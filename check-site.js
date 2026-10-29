const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => {
    errors.push(`PageError: ${err.message}`);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`ConsoleError: ${msg.text()}`);
    }
  });
  page.on('response', res => {
    if (!res.ok() && res.status() >= 400) {
      errors.push(`NetworkError: ${res.status()} ${res.url()}`);
    }
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log("Navigated to home page");
    
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
    console.log("Navigated to register page");
    
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    console.log("Navigated to login page");
    
    // Check if auth works
  } catch (err) {
    console.error("Navigation failed:", err);
  }

  console.log("Collected errors:", JSON.stringify(errors, null, 2));
  await browser.close();
})();
