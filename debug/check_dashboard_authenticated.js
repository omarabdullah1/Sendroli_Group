const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const baseUrl = 'http://localhost:5174';
    console.log('Opening', baseUrl);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Login via API to avoid UI auth flow
    await page.evaluate(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: 'admin', password: 'admin123', force: true }),
        });
        const data = await res.json();
        if (data?.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user || data.data));
        }
      } catch (err) {
        console.error('Login API failed', err);
      }
    });

    // Navigate to dashboard route
    await page.goto(baseUrl + '/dashboard', { waitUntil: 'networkidle' });
    await page.waitForSelector('.enhanced-dashboard .kpi-card', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Check TopHeader actions - should be hidden
    const topHeaderActionsPresent = await page.evaluate(() => {
      const topHeader = document.querySelector('.top-header');
      if (!topHeader) return false;
      return !!topHeader.querySelector('.top-header-actions');
    });

    console.log('TopHeader actions present?', topHeaderActionsPresent);

    // Check for any .header-actions inside the dashboard
    const headerActionsPresent = await page.evaluate(() => {
      const dashboard = document.querySelector('.enhanced-dashboard');
      if (!dashboard) return false;
      return !!dashboard.querySelector('.header-actions');
    });

    console.log('Dashboard header-actions present?', headerActionsPresent);

    // Check KPI svg color and fill for first KPI
    const kpiInfo = await page.evaluate(() => {
      const k = document.querySelector('.enhanced-dashboard .kpi-card .kpi-icon');
      if (!k) return null;
      const svg = k.querySelector('svg');
      const emoji = k.querySelector('.kpi-emoji');
      const computed = window.getComputedStyle(k);
      const svgStyle = svg ? window.getComputedStyle(svg) : null;
      const emojiStyle = emoji ? window.getComputedStyle(emoji) : null;
      return {
        svgColor: svgStyle ? svgStyle.color : null,
        svgFill: svgStyle ? svgStyle.fill : null,
        emojiColor: emojiStyle ? emojiStyle.color : null,
        containerColor: computed ? computed.color : null,
      };
    });

    console.log('KPI Icon computed styles:', kpiInfo);

    // Basic assertion logging
    if (topHeaderActionsPresent) {
      console.warn('WARNING: Top header actions are still present on dashboard route');
    }
    if (headerActionsPresent) {
      console.warn('WARNING: Dashboard header actions are still present');
    }
    if (kpiInfo && (kpiInfo.svgColor !== 'rgb(255, 255, 255)' && kpiInfo.svgFill !== 'rgb(255, 255, 255)')) {
      console.warn('WARNING: KPI icon does not have white color/fill:', kpiInfo);
    }

  } catch (err) {
    console.error('Error during authenticated dashboard check:', err);
  } finally {
    await browser.close();
  }
})();
