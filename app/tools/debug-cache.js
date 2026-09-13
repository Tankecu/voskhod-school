const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
(async () => {
  const salt = 'x9', hash = crypto.createHash('sha256').update(salt + ':px9').digest('hex');
  await fetch(SB + 'users', {
    method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{ id: 'ux9', login: 'ux9', pass_hash: hash, salt, role: 'student', name: 'X9', active: true, xp: 0 }]),
  });
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.setViewport({ width: 390, height: 844, isMobile: true });
  await p.goto('http://localhost:8091/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2500));
  const resInfo = await p.evaluate(() => performance.getEntriesByType('resource')
    .filter(r => r.name.includes('mock.js') || r.name.includes('mock-gen') || r.name.includes('bank-math'))
    .map(r => [r.name.split('/').pop(), r.transferSize, r.decodedBodySize]));
  console.log('resources [name, transferSize, decoded]:', JSON.stringify(resInfo));
  const swState = await p.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? { active: !!reg.active, scope: reg.scope } : 'none';
  });
  console.log('sw:', JSON.stringify(swState));
  await p.evaluate(() => {
    const s = (s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    s('#loginName', 'ux9');
    s('#loginPass', 'px9');
  });
  await p.evaluate(() => document.querySelector('#loginBtn').click());
  await new Promise(r => setTimeout(r, 2000));
  await p.evaluate(() => { location.hash = '#/mock'; });
  await new Promise(r => setTimeout(r, 900));
  await p.evaluate(() => document.querySelector('#mockGenStart').click());
  await new Promise(r => setTimeout(r, 400));
  const st = await p.evaluate(() => ({
    shell: !!document.querySelector('.mock-shell'),
    frozen: window.__cosmosFrozen,
    genOk: typeof window.MOCK_GEN !== 'undefined' && !!window.MOCK_GEN.build,
  }));
  console.log('after click:', JSON.stringify(st));
  await b.close();
  await fetch(SB + 'users?id=eq.ux9', { method: 'DELETE', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
})().catch(e => console.error('FAIL', e.message));
