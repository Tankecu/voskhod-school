const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
async function waitFor(p, sel, timeout) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await p.evaluate(s => !!document.querySelector(s), sel)) return true;
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
}
(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.evaluateOnNewDocument(() => { window.MOCK_TIME_SCALE = 0.0015; });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ': ' + r.url()); });
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('http://localhost:8091/', { waitUntil: 'domcontentloaded' });

  const loginOk = await waitFor(p, '#loginName', 15000);
  console.log('login form appeared:', loginOk);
  const globals = await p.evaluate(() => ({
    rw: typeof window.MOCK_SAT_1_RW, rwLen: window.MOCK_SAT_1_RW ? window.MOCK_SAT_1_RW.length : null,
    m1: typeof window.MOCK_SAT_1, m1rw: window.MOCK_SAT_1 ? window.MOCK_SAT_1.rw[0].length : null,
  }));
  console.log('globals:', JSON.stringify(globals));

  await p.evaluate(() => {
    const set = (s, v) => { const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#loginName', 'mocktest');
    set('#loginPass', 'passmock');
  });
  await p.evaluate(() => document.querySelector('#loginBtn').click());
  await new Promise(r => setTimeout(r, 2500));
  await p.evaluate(() => { location.hash = '#/mock'; });
  await waitFor(p, '#mockStart', 10000);
  const hasStart = await p.evaluate(() => !!document.querySelector('#mockStart'));
  console.log('mockStart:', hasStart);
  await p.evaluate(() => document.querySelector('#mockStart').click());
  await new Promise(r => setTimeout(r, 1500));
  const state = await p.evaluate(() => ({
    hasQ: !!document.querySelector('#mockQ'),
    firstOpt: !!document.querySelector('[data-mopt="0"]'),
    timer: (document.querySelector('#mockTimerVal') || {}).textContent || null,
    title: (document.querySelector('.mock-top__title b') || {}).textContent || null,
  }));
  console.log('module state:', JSON.stringify(state));
  console.log('---- ERRORS ----');
  console.log(errs.slice(0, 8).join('\n---\n') || 'none');
  await b.close();
})().catch(e => console.error('FAIL', e.message));
