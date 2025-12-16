const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const baseUrl = 'https://sendroligroup.cloud';
    // Use domcontentloaded and increase timeout to avoid network idle hangs
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // login
    await page.evaluate(async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        credentials: 'include',
        body: JSON.stringify({username:'admin',password:'admin123',force:true}),
      });
      const data = await res.json();
      if (data?.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || data.data));
      }
    });
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for KPI cards to appear (in case they load lazily)
    await page.waitForSelector('.kpi-card', { timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(500);

    // Check header-actions presence
    const headerExists = await page.$eval('.header-actions', el => !!el).catch(()=>false);
    console.log(`header-actions present? ${headerExists}`);

    // Get first KPI's innerHTML for inspection and computed colors
    const kpiInfo = await page.evaluate(() => {
      const k = document.querySelector('.kpi-card .kpi-icon');
      if (!k) return null;
      const emoji = k.querySelector('.kpi-emoji');
      const svg = k.querySelector('svg');
      const computed = window.getComputedStyle(k);
      const emojiStyle = emoji ? window.getComputedStyle(emoji) : null;
      const svgStyle = svg ? window.getComputedStyle(svg) : null;
      return {
        outer: k.outerHTML,
        background: computed.backgroundColor,
        emojiColor: emojiStyle ? emojiStyle.color : null,
        svgFill: svgStyle ? svgStyle.fill : null,
        svgColor: svgStyle ? svgStyle.color : null
      };
    });
    console.log('KPI icon info (first):', kpiInfo);
    // Get first KPI's svg color, if present
    const kpiSvgColor = await page.$eval('.kpi-card .kpi-icon svg', el => {
      const cs = getComputedStyle(el);
      return { color: cs.color, fill: el.getAttribute('fill') || cs.fill };
    }).catch(()=>null);
    console.log('KPI SVG computed color/fill:', kpiSvgColor);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
