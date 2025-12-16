const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const logs = [];

  page.on('console', (msg) => {
    const text = `[console:${msg.type()}] ${msg.text()}`;
    logs.push(text);
    console.log(text);
  });

  page.on('pageerror', (err) => {
    const text = `[pageerror] ${err.message}`;
    logs.push(text);
    console.log(text);
  });

  page.on('requestfailed', (request) => {
    const text = `[requestfailed] ${request.url()} - ${request.failure()?.errorText}`;
    logs.push(text);
    console.log(text);
  });

  try {
    const baseUrl = 'https://sendroligroup.cloud';
    console.log('Base URL:', baseUrl);

    // Navigate to root to ensure app loads
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    // Perform login via fetch inside page context
    const loginResult = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: 'admin', password: 'admin123', force: true })
        });
        const data = await res.json();
        if (data?.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user || data.data));
          console.log('Login success', data.user || data.data);
        }
        return data;
      } catch (err) {
        console.error('Login error', err);
        return { error: err.toString() };
      }
    });

    logs.push(`[loginResult] ${JSON.stringify(loginResult)}`);

    // Navigate to dashboard after login
    const url = `${baseUrl}/dashboard`;
    console.log('Opening', url);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Ensure we give time for charts and lazy components to load
    await page.waitForTimeout(3000);

    // Take screenshot
    const screenshotPath = 'debug/dashboard_screenshot_after_login.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot saved to', screenshotPath);

    // Save logs to file
    fs.writeFileSync('debug/dashboard_console_logs.txt', logs.join('\n'));
    console.log('Saved console logs to debug/dashboard_console_logs.txt');
  } catch (err) {
    console.error('Error during navigation', err);
  } finally {
    await browser.close();
  }
})();
