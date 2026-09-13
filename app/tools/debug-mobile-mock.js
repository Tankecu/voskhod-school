const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:8091/';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const UID = 'umobtest';
(async () => {
  const salt = 'm1', hash = crypto.createHash('sha256').update(salt + ':passm1').digest('hex');
  await fetch(SB + 'users', {
    method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{ id: UID, login: 'mobtest', pass_hash: hash, salt, role: 'student', name: 'Mob Test', active: true, xp: 40 }]),
  });
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForSelector('#loginName', { timeout: 20000 });
  await p.evaluate(() => {
    const set = (s, v) => { const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#loginName', 'mobtest');
    set('#loginPass', 'passm1');
  });
  await p.evaluate(() => document.querySelector('#loginBtn').click());
  await sleep(2200);
  await p.evaluate(() => { location.hash = '#/mock'; });
  await sleep(1500);
  const st = await p.evaluate(() => ({
    hash: location.hash,
    startBtn: !!document.querySelector('#mockStart'),
    genBtn: !!document.querySelector('#mockGenStart'),
    tabbarMock: [...document.querySelectorAll('.tabbar__item')].map(t => t.textContent.trim()),
  }));
  console.log(JSON.stringify(st, null, 1));
  await p.screenshot({ path: 'D:\\rep\\voskhod\\app-shots\\m-mock-fixed.png' });
  await b.close();
  await fetch(SB + 'users?id=eq.' + UID, { method: 'DELETE', headers: H });
  console.log('cleanup done');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
