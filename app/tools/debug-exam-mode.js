const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:8091/';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const UID = 'umobux2';
(async () => {
  const salt = 'ux2', hash = crypto.createHash('sha256').update(salt + ':passux2').digest('hex');
  await fetch(SB + 'users', {
    method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{ id: UID, login: 'mobux2', pass_hash: hash, salt, role: 'student', name: 'Mob Two', active: true, xp: 0 }]),
  });
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('C: ' + m.text().slice(0, 80)); });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForSelector('#loginName', { timeout: 20000 });
  await p.evaluate(() => {
    const set = (s, v) => { const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#loginName', 'mobux2');
    set('#loginPass', 'passux2');
  });
  await p.evaluate(() => document.querySelector('#loginBtn').click());
  await sleep(2600);
  await p.evaluate(() => { location.hash = '#/mock'; });
  await sleep(1200);
  await p.evaluate(() => document.querySelector('#mockGenStart').click());

  for (const ms of [100, 400, 900, 1500]) {
    await sleep(ms === 100 ? 100 : ms - (ms === 400 ? 100 : ms === 900 ? 400 : 900));
    const st = await p.evaluate(() => ({
      examMode: document.body.classList.contains('exam-mode'),
      view: document.querySelector('#mockExit') ? 'module' : (document.querySelector('#mockStart') ? 'intro' : (document.querySelector('.stat-tile') ? 'today' : 'other')),
    }));
    console.log(ms + 'ms:', JSON.stringify(st));
  }
  console.log('errors:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
  await fetch(SB + 'users?id=eq.' + UID, { method: 'DELETE', headers: H });
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
