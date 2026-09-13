const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('http://localhost:8091/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const info = await p.evaluate(() => {
    const login = document.querySelector('.login');
    const box = document.querySelector('.login__box');
    const cs = login ? getComputedStyle(login) : null;
    return {
      exists: !!login,
      display: cs ? cs.display : null,
      placeContent: cs ? cs.placeContent : null,
      justifyContent: cs ? cs.justifyContent : null,
      loginWidth: login ? login.getBoundingClientRect().width : null,
      boxX: box ? Math.round(box.getBoundingClientRect().x) : null,
    };
  });
  console.log(JSON.stringify(info));
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
