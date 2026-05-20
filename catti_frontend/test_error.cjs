const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      console.log(`BROWSER WARN: ${msg.text()}`);
    } else {
      console.log(`BROWSER LOG: ${msg.text()}`);
    }
  });

  page.on('pageerror', exception => {
    console.log(`PAGE ERROR: ${exception}`);
  });

  console.log('Navigating to app...');
  await page.goto('http://localhost:5174');

  console.log('Waiting for network idle...');
  await page.waitForLoadState('networkidle');

  console.log('Clicking Written Mode...');
  await page.getByText('Written Translation').click();
  
  console.log('Switching to Comprehensive mode...');
  await page.getByText('Written Comprehensive').click();

  console.log('Filling input...');
  const textareas = await page.locator('textarea').all();
  if (textareas.length > 0) {
    await textareas[0].fill('This is a test for vocabulary.');
  }

  console.log('Clicking Generate...');
  await page.getByText('Generate Exam').click();

  console.log('Waiting for results...');
  // Wait up to 30 seconds, looking for the results container or an error
  try {
    await page.waitForSelector('text=Submit Exam', { timeout: 30000 });
    console.log('Results loaded successfully.');
  } catch (e) {
    console.log('Timeout waiting for results, or app crashed.');
  }

  console.log('Done.');
  await browser.close();
})();