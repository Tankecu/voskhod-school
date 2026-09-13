const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'https://tankecu.github.io/voskhod-school/app/';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
(async () => {
  const salt = 'lv1', hash = crypto.createHash('sha256').update(salt + ':liveshot').digest('hex');
  await fetch(SB + 'users', {
    method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{ id: 'uliveshot', login: 'liveshot', pass_hash: hash, salt, role: 'student', name: 'Live Shot', active: true, xp: 0 }]),
  });

  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('#loginName', { timeout: 30000 });
  await p.evaluate(() => {
    const set = (s, v) => { const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#loginName', 'liveshot');
    set('#loginPass', 'liveshot');
  });
  await p.evaluate(() => document.querySelector('#loginBtn').click());
  await sleep(2500);
  await p.evaluate(() => { location.hash = '#/mock'; });
  await sleep(2000);
  const state = await p.evaluate(() => ({
    startBtn: !!document.querySelector('#mockStart'),
    mockLoaded: !!window.MOCK_SAT_1,
    questions: window.MOCK_SAT_1 ? window.MOCK_SAT_1.rw[0].length + window.MOCK_SAT_1.rw[1].length + window.MOCK_SAT_1.math[0].length + window.MOCK_SAT_1.math[1].length : 0,
    theoryLink: document.body.innerText.includes('Как устроен цифровой SAT'),
  }));
  console.log('live mock tab:', JSON.stringify(state));
  await p.screenshot({ path: 'D:\\rep\\voskhod\\app-shots\\live-mock-intro.png' });
  console.log('errors:', errs.length ? errs.join(' | ') : 'none');
  await b.close();

  await fetch(SB + 'users?id=eq.uliveshot', { method: 'DELETE', headers: H });
  console.log('cleanup done');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
