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
  await new Promise(r => setTimeout(r, 1200));
  await p.evaluate(() => document.querySelectorAll('[data-login]')[1].click());
  await new Promise(r => setTimeout(r, 800));
  await p.evaluate(() => { location.hash = '#/tests'; });
  await new Promise(r => setTimeout(r, 800));
  const info = await p.evaluate(() => {
    const d = DB.ready();
    return {
      attemptsTotal: d.attempts.length,
      byTest: d.tests.map(t => ({ id: t.id, n: d.attempts.filter(a => a.testId === t.id).length })),
      chips: [...document.querySelectorAll('.test-card .chip')].slice(0, 8).map(c => c.textContent.trim()),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
