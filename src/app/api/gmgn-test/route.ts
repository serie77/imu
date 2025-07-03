import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  let browser;
  
  try {
    // Get the address from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address') || 'FzYYc73f81baefsgCW3bJaySnZPi1wixFFrje8uuT2HD'; // Default address
    
    console.log(`Starting GMGN test for address: ${address}`);
    
    // Create logs directory
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Log file
    const logFile = path.join(logDir, `gmgn-test-${new Date().toISOString().replace(/:/g, '-')}.log`);
    fs.writeFileSync(logFile, `Starting GMGN test for address: ${address}\n`);
    
    const log = (message) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      console.log(message);
      fs.appendFileSync(logFile, logMessage);
    };
    
    log('Launching browser...');
    
    // Launch browser with debugging options
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
    });
    
    log('Browser launched successfully');
    
    // Create context
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      javaScriptEnabled: true,
    });
    
    log('Browser context created');
    
    // Create page
    const page = await context.newPage();
    log('Page created');
    
    // Navigate directly to the wallet address page
    const url = `https://gmgn.ai/sol/address/${address}`;
    log(`Navigating to ${url}...`);
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    log('Navigation complete');
    
    // Wait a bit for any additional resources to load
    log('Waiting additional time for resources to load...');
    await page.waitForTimeout(5000);
    
    // Get page title
    const title = await page.title();
    log(`Page title: ${title}`);
    
    // Check if we can find any of the elements we're interested in
    log('Checking for elements...');
    
    const elements = {
      winRate: await page.evaluate(() => {
        const el = document.querySelector('div.css-16udrhy');
        return el ? el.textContent.trim() : null;
      }),
      pnl: await page.evaluate(() => {
        const el = document.querySelector('div.css-d865bw');
        return el ? el.textContent.trim() : null;
      }),
      trades: await page.evaluate(() => {
        const greenEl = document.querySelector('div.css-1e1624f p.css-131utnt');
        const redEl = document.querySelector('div.css-1e1624f p.css-159dfc2');
        return {
          green: greenEl ? greenEl.textContent.trim() : null,
          red: redEl ? redEl.textContent.trim() : null
        };
      }),
      realizedProfits: await page.evaluate(() => {
        const el = document.querySelector('div.css-wob81f');
        return el ? el.textContent.trim() : null;
      })
    };
    
    log(`Found elements: ${JSON.stringify(elements, null, 2)}`);
    
    // Close browser
    await browser.close();
    log('Browser closed');
    
    return NextResponse.json({
      success: true,
      message: 'Test completed successfully',
      title,
      elements,
      logFile,
    });
  } catch (error) {
    console.error('Error in GMGN test:', error);
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}