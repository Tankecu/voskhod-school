const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('http://localhost:8091/#/login', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  const info = await p.evaluate(() => {
    const side = document.querySelector('.side');
    return {
      mq: matchMedia('(min-width: 1000px)').matches,
      innerWidth: innerWidth,
      sideExists: !!side,
      sideDisplay: side ? getComputedStyle(side).display : null,
      sideRect: side ? JSON.parse(JSON.stringify(side.getBoundingClientRect())) : null,
      appFlexDir: getComputedStyle(document.querySelector('.app')).flexDirection,
      tabbarDisplay: (() => { const t = document.querySelector('.tabbar'); return t ? getComputedStyle(t).display : 'none-el'; })(),
      sheets: [...document.styleSheets].map(s => { try { return s.cssRules.length; } catch (e) { return 'blocked'; } }),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
