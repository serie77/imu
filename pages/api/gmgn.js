const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// Helper function for logging
const log = (...args) => console.log('[GMGN Scraper]', ...args);

// Helper function to wait for a specified time
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // We always use 30d, regardless of what's in the request
    const timeframe = '30d';

    log(`Scraping data for ${address}`);
    
    let browser = null;
    
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
      
      // Always use 30d in the URL
      const cieoUrl = `https://app.cielo.finance/profile/${address}/pnl/tokens?timeframe=30d`;
      log(`Navigating to ${cieoUrl}...`);
      await page.goto(cieoUrl, { 
        waitUntil: 'networkidle0',
        timeout: 60000
      });
      
      log('Waiting for stats to load...');
      await wait(2000);
      
      // Get and log the raw text first for debugging
      const rawContent = await page.evaluate(() => document.body.innerText);
      log('Raw page content:');
      log(rawContent);
      
      const stats = await page.evaluate(() => {
        try {
          const text = document.body.innerText;
          
          // Add debug logging for each extraction
          const debugExtraction = (name, pattern, value) => {
            console.log(`Extracting ${name}:`);
            console.log(`Pattern: ${pattern}`);
            console.log(`Found value: ${value}`);
          };
          
          // Extract Balance - updated pattern to handle commas in SOL amount
          const balanceMatch = text.match(/Balance:\s*([\d,]+\.?\d*)\s*SOL\s*\(\$([0-9,]+)\)/);
          const balance = balanceMatch ? 
            `${balanceMatch[1].replace(/,/g, '')} SOL ($${balanceMatch[2]})` : 
            '0 SOL ($0)';
          const isInactive = !balanceMatch || parseFloat(balanceMatch[1].replace(/,/g, '')) === 0;
          debugExtraction('Balance', 'Balance:', balance);

          // Extract Realized PnL - updated pattern to handle -$ format
          const pnlMatch = text.match(/Realized PnL \(ROI\)\s*(-?\$[0-9,]+|-\$[0-9,]+|\$-[0-9,]+)\s*\(([0-9.-]+)%\)/);
          const pnl = pnlMatch ? pnlMatch[1].replace(/\$/, '') : '0';  // Remove $ sign temporarily
          const formattedPnl = `$${pnl}`; // Add it back in consistent format
          debugExtraction('PNL', 'Realized PnL', formattedPnl);

          // Extract Token Winrate (this one works fine)
          const winRateMatch = text.match(/Token Winrate\s*(\d+\.\d+%)/);
          const winRate = winRateMatch ? winRateMatch[1] : 'N/A';
          debugExtraction('Winrate', 'Token Winrate', winRate);

          // Extract Tokens Traded (this one works fine)
          const tokensMatch = text.match(/Tokens Traded\s*(\d+)/);
          const tokensTraded = tokensMatch ? parseInt(tokensMatch[1]) : 0;
          debugExtraction('Tokens Traded', 'Tokens Traded', tokensTraded);

          // Extract Best Trade - look for highest value in individual trades
          const tradeMatches = text.matchAll(/\$([0-9,]+)\s+([0-9.]+)%/g);
          let bestTrade = 0;
          let bestTradePercentage = 0;
          for (const match of tradeMatches) {
            const value = parseInt(match[1].replace(/,/g, ''));
            const percentage = parseFloat(match[2]);
            if (value > bestTrade) {
              bestTrade = value;
              bestTradePercentage = percentage;
            }
          }
          debugExtraction('Best Trade', 'Highest PNL', bestTrade > 0 ? `$${bestTrade.toLocaleString()}` : 'N/A');

          // Extract Median Hold Time - updated to include seconds
          const holdTimeMatch = text.match(/Median Hold Time\s*(\d+)\s*(seconds?|minutes?|hours?|days?)/i);
          const holdTime = holdTimeMatch ? `${holdTimeMatch[1]} ${holdTimeMatch[2]}` : 'N/A';
          debugExtraction('Hold Time', 'Median Hold Time', holdTime);

          return {
            balance,
            pnl: formattedPnl,
            winRate,
            tokensTraded,
            bestTrade: bestTrade > 0 ? `$${bestTrade.toLocaleString()}` : 'N/A',
            bestTradePercentage,
            holdTime,
            isInactive
          };
        } catch (e) {
          console.error('Error during extraction:', e);
          return null;
        }
      });
      
      log('Stats extraction completed');
      log('Stats found:', stats ? 'Yes, with values:' : 'No');
      if (stats) {
        log('Balance:', stats.balance);
        log('PNL:', stats.pnl);
        log('Winrate:', stats.winRate);
        log('Tokens traded:', stats.tokensTraded);
        log('Best trade:', stats.bestTrade, `(${stats.bestTradePercentage}%)`);
        log('Hold Time:', stats.holdTime);
      }
      
      await browser.close();
      browser = null;
      
      if (stats) {
        const data = {
          balance: stats.balance,
          winRate: stats.winRate,
          pnl: stats.pnl,
          bestTrade: stats.bestTrade,
          bestTradePercentage: stats.bestTradePercentage,
          holdTime: stats.holdTime,
          tokensTraded: stats.tokensTraded,
          address,
          timeframe: timeframe,
          isInactive: stats.isInactive
        };
        data.rank = calculateRank(data);
        return res.status(200).json(data);
      } else {
        return res.status(200).json({
          balance: '0 SOL ($0)',
          winRate: 'N/A',
          pnl: '$0',
          bestTrade: 'N/A',
          bestTradePercentage: 0,
          holdTime: 'N/A',
          tokensTraded: 0,
          address,
          timeframe: timeframe,
          isInactive: true
        });
      }
    } catch (error) {
      if (browser) {
        try { await browser.close(); } catch (e) { /* ignore */ }
      }
      
      return res.status(200).json({
        balance: 'N/A',
        winRate: 'N/A',
        pnl: '$0',
        bestTrade: 'N/A',
        bestTradePercentage: 0,
        holdTime: 'N/A',
        address,
        timeframe: timeframe
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}

const calculateRank = (data) => {
  // Return unranked if we don't have enough data
  if (!data || !data.winRate || !data.pnl || !data.holdTime) {
    return 'Unranked';
  }

  let totalScore = 0;
  
  // 1. PNL Score (35 points max)
  const pnlValue = parseFloat(data.pnl.replace(/[^0-9.-]/g, ''));
  const pnlScore = Math.min(35, (Math.abs(pnlValue) / 10000) * 3.5);
  // If PNL is negative, make the score negative
  const finalPnlScore = pnlValue < 0 ? -pnlScore : pnlScore;
  
  // 2. Win Rate Score (25 points max)
  const winRateValue = parseFloat(data.winRate.replace('%', ''));
  const winRateScore = (winRateValue - 40) * 1.25;
  
  // 3. Hold Time Score (20 points max)
  const holdTimeValue = parseInt(data.holdTime.split(' ')[0]);
  const holdTimeUnit = data.holdTime.split(' ')[1].toLowerCase();
  let holdTimeSeconds;
  
  // Convert hold time to seconds
  switch(holdTimeUnit) {
    case 'seconds':
    case 'second':
      holdTimeSeconds = holdTimeValue;
      break;
    case 'minutes':
    case 'minute':
      holdTimeSeconds = holdTimeValue * 60;
      break;
    case 'hours':
    case 'hour':
      holdTimeSeconds = holdTimeValue * 3600;
      break;
    case 'days':
    case 'day':
      holdTimeSeconds = holdTimeValue * 86400;
      break;
    default:
      holdTimeSeconds = 0;
  }
  
  const holdTimeScore = Math.min(20, (holdTimeSeconds / 30) * 10);
  
  // 4. Volume/Activity Score (10 points max)
  const volumeScore = Math.min(10, (data.tokensTraded / 500) * 5);
  
  // 5. Risk Management Score (10 points max)
  const bestTradePercentage = data.bestTradePercentage || 0;
  const riskScore = Math.min(10, (bestTradePercentage / 100));

  // Add score logging
  log('Score Breakdown:');
  log('PNL Score:', finalPnlScore);
  log('Win Rate Score:', winRateScore);
  log('Hold Time Score:', holdTimeScore);
  log('Volume Score:', volumeScore);
  log('Risk Score:', riskScore);

  // Calculate total score
  totalScore = finalPnlScore + winRateScore + holdTimeScore + volumeScore + riskScore;

  // Assign rank based on total score
  if (totalScore >= 90) return 'S+';
  if (totalScore >= 80) return 'S';
  if (totalScore >= 70) return 'A+';
  if (totalScore >= 60) return 'A';
  if (totalScore >= 50) return 'B+';
  if (totalScore >= 40) return 'B';
  if (totalScore >= 30) return 'C+';
  if (totalScore >= 20) return 'C';
  if (totalScore >= 0) return 'D';
  return 'F';
};