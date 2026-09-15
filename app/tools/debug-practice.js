const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'https://tankecu.github.io/voskhod-school/app/';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const U = 'upldebug';
(async () => {
  const sbH = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' };
  const crypto = require('crypto');
  await fetch(SB + 'users', {
    method: 'POST', headers: sbH,
    body: JSON.stringify([{ id: U, login: 'pldebug', pass_hash: crypto.createHash('sha256').update('fin:pp').digest('hex'), salt: 'fin', role: 'student', name: 'PL Debug', active: true, xp: 0 }]),
  });
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' | ' + (e.stack || '').split('\n').slice(1, 3).join(' ~ ')));
  p.on('console', m => { if (m.type() === 'error') errs.push('C: ' + m.text().slice(0, 120)); });
  await p.setViewport({ width: 390, height: 844, isMobile: true });
  await p.goto(APP, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('#loginName', { timeout: 30000 });
  await p.evaluate(() => {
    const s = (s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    s('#loginName', 'pldebug');
    s('#loginPass', 'pp');
  });
  await p.evaluate(() => document.querySelector('#loginBtn').click());
  await new Promise(r => setTimeout(r, 2200));
  await p.evaluate(() => { location.hash = '#/trainer/topic/a1/practice'; });
  await new Promise(r => setTimeout(r, 1500));
  const st = await p.evaluate(() => ({
    hash: location.hash,
    qcard: !!document.querySelector('.qcard'),
    opts: document.querySelectorAll('[data-topt]').length,
    topTitle: (document.querySelector('.mock-top__title b') || {}).textContent || null,
  }));
  console.log('practice session:', JSON.stringify(st));
  console.log('errors:', errs.join('\n') || 'none');
  await b.close();
})().catch(e => console.error('FAIL', e.message));
