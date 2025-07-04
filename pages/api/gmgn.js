const puppeteer = require('puppeteer');

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
      // REVERT: Use regular puppeteer launch
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
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
        // If you have a calculateRank function, add it here
        // data.rank = calculateRank(data);
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