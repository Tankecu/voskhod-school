const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const p = await b.newPage();
  await p.evaluateOnNewDocument(() => { window.MOCK_TIME_SCALE = 0.0015; });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 150)); });
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('http://localhost:8091/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  await p.evaluate(() => {
    const set = (s, v) => { const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#loginName', 'mocktest');
    set('#loginPass', 'passmock');
  });
  await p.evaluate(() => document.querySelector('#loginBtn').click());
  await new Promise(r => setTimeout(r, 2200));
  await p.evaluate(() => { location.hash = '#/mock'; });
  await new Promise(r => setTimeout(r, 1200));
  await p.evaluate(() => document.querySelector('#mockStart').click());
  await new Promise(r => setTimeout(r, 1500));
  const state = await p.evaluate(() => ({
    hasQ: !!document.querySelector('#mockQ'),
    qHtmlLen: (document.querySelector('#mockQ') || { innerHTML: '' }).innerHTML.length,
    hasTimer: !!document.querySelector('#mockTimerVal'),
    hash: location.hash,
    timerText: (document.querySelector('#mockTimerVal') || {}).textContent || null,
    firstOpt: !!document.querySelector('[data-mopt="0"]'),
  }));
  console.log(JSON.stringify(state, null, 1));
  console.log(errs.slice(0, 6).join('\n') || 'no errors');
  await b.close();
})().catch(e => console.error('FAIL', e.message));
