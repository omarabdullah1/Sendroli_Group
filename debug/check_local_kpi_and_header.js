const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const baseUrl = 'http://localhost:5173';
    console.log('Opening', baseUrl);
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Navigate to dashboard route
    await page.goto(baseUrl + '/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check header-actions presence within enhanced-dashboard
    const headerActionsPresent = await page.evaluate(() => {
      const container = document.querySelector('.enhanced-dashboard');
      if (!container) return false;
      return !!container.querySelector('.header-actions');
    });

    console.log('Dashboard header-actions present?', headerActionsPresent);

    // Check KPI svg color and fill
    const kpiInfo = await page.evaluate(() => {
      const k = document.querySelector('.enhanced-dashboard .kpi-icon');
      if (!k) return null;
      const outer = k.outerHTML;
      const svg = k.querySelector('svg');
      const computed = svg ? window.getComputedStyle(svg) : null;
      return {
        outer,
        svgFill: computed ? computed.fill : null,
        color: computed ? computed.color : null
      };
    });

    console.log('KPI Icon info:', kpiInfo);
  } catch (err) {
    console.error('Error during local check:', err);
  } finally {
    await browser.close();
  }
})();