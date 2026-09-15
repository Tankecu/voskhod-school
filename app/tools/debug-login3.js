const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://localhost:8091/';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const mkHash = (pass) => crypto.createHash('sha256').update('r:' + pass).digest('hex');

(async () => {
  const r1 = await fetch(SB + 'users', {
    method: 'POST', headers: H,
    body: JSON.stringify({ id: 'uroome2e', login: 'roome2et', pass_hash: mkHash('pt'), salt: 'r', role: 'teacher', name: 'Хост Учитель', active: true, xp: 0, subject: 'SAT Math' }),
  });
  console.log('seed status:', r1.status);

  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  p.on('pageerror', e => {
    errs.push('PAGEERROR: ' + e.message + ' || ' + (e.stack || '').split('\n').slice(1, 4).join(' ~ '));
  });
  await p.setViewport({ width: 1280, height: 800 });
  await p.goto(APP, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  const pre = await p.evaluate(() => window.DB.allUsers().map(u => u.login));
  console.log('page users:', JSON.stringify(pre));
  await p.evaluate(() => {
    const s = (s2, v) => { const el = document.querySelector(s2); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    s('#loginName', 'roome2et');
    s('#loginPass', 'pt');
  });
  await p.evaluate(() => document.querySelector('#loginBtn').click());
  await new Promise(r => setTimeout(r, 2500));
  const post = await p.evaluate(() => ({
    hash: location.hash,
    loginErr: (document.getElementById('loginErr') || {}).textContent || null,
  }));
  console.log('after login:', JSON.stringify(post));
  console.log('---- errors:', errs.join('\n') || 'none');
  await b.close();
})().catch(e => console.error('FAIL', e.message));
