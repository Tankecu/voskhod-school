const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://localhost:8091/';
(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader',
      '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' || ' + (e.stack || '').split('\n').slice(1, 4).join(' ~ ')));
  p.on('console', m => { if (m.type() === 'error') errs.push('C: ' + m.text().slice(0, 130)); });
  p.on('requestfailed', r => { if (r.url().includes('supabase')) errs.push('REQFAIL: ' + r.url().slice(0, 110) + ' ' + (r.failure() || {}).errorText); });
  await p.setViewport({ width: 1280, height: 800 });
  await p.goto(APP, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForSelector('#loginName', { timeout: 20000 });
  await p.evaluate(() => {
    const s = (s2, v) => { const el = document.querySelector(s2); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    s('#loginName', 'roome2et');
    s('#loginPass', 'pt');
  });
  await p.evaluate(() => document.querySelector('#loginBtn').click());
  try {
    await p.waitForFunction(() => location.hash !== '#/login' && location.hash !== '' , { timeout: 15000 });
  } catch (e) { errs.push('TIMEOUT waiting for hash change'); }
  await new Promise(r => setTimeout(r, 1500));
  const st = await p.evaluate(() => ({
    hash: location.hash,
    loginErr: (document.getElementById('loginErr') || {}).textContent || null,
    room: !!document.querySelector('.room'),
    roomState: (document.getElementById('roomState') || {}).textContent || null,
  }));
  console.log('state:', JSON.stringify(st, null, 1));
  console.log('---- errors:', errs.join('\n') || 'none');
  await b.close();
})().catch(e => console.error('FAIL', e.message));
