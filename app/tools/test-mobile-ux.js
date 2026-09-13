/* Мобильный UX v2: exam-mode → пролистать RW → math: шторка калькулятора → выход */
const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:8091/';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const UID = 'umobux3';
const errors = [];
(async () => {
  const salt = 'ux3', hash = crypto.createHash('sha256').update(salt + ':passux3').digest('hex');
  await fetch(SB + 'users', {
    method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{ id: UID, login: 'mobux3', pass_hash: hash, salt, role: 'student', name: 'Mob Three', active: true, xp: 0 }]),
  });

  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push(e.message));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const shot = async n => { await p.screenshot({ path: 'D:\\rep\\voskhod\\app-shots\\' + n }); console.log('shot', n); };

  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForSelector('#loginName', { timeout: 20000 });
  await p.evaluate(() => {
    const set = (s, v) => { const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#loginName', 'mobux3');
    set('#loginPass', 'passux3');
  });
  await p.evaluate(() => document.querySelector('#loginBtn').click());
  await sleep(2200);
  await p.evaluate(() => { location.hash = '#/mock'; });
  await sleep(1000);
  await p.evaluate(() => document.querySelector('#mockGenStart').click());
  await sleep(900);

  /* exam-mode в RW */
  const examState = await p.evaluate(() => ({
    examMode: document.body.classList.contains('exam-mode'),
    tabbarHidden: getComputedStyle(document.querySelector('.tabbar')).display === 'none',
    exitBtn: !!document.querySelector('#mockExit'),
    stickyNav: document.querySelector('.mock-nav').getBoundingClientRect().top > 700,
  }));
  console.log('exam state:', JSON.stringify(examState));
  await shot('ux-01-exam-mobile.png');

  /* пролистываем оба RW модуля случайными ответами до Math */
  let reachedMath = false;
  for (let i = 0; i < 90 && !reachedMath; i++) {
    await p.evaluate(() => {
      const btns = [...document.querySelectorAll('[data-mopt]')];
      if (btns.length) btns[Math.floor(Math.random() * btns.length)].click();
    });
    await sleep(35);
    await p.evaluate(() => {
      const b = document.querySelector('#mockNext'); if (b) b.click();
      const g = document.querySelector('#mockGo'); if (g) g.click();
      const s = document.querySelector('#brkSkip'); if (s) s.click();
    });
    await sleep(55);
    reachedMath = await p.evaluate(() => !!document.querySelector('#mockCalc'));
  }
  console.log('reached math module:', reachedMath);

  /* шторка калькулятора */
  await p.evaluate(() => document.querySelector('#mockCalc').click());
  await sleep(500);
  const calc = await p.evaluate(() => {
    const el = document.querySelector('.mock-calc');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), bottom: Math.round(r.bottom), full: r.width > 320 };
  });
  console.log('calc sheet:', JSON.stringify(calc));
  await shot('ux-02-calc-sheet.png');
  await p.evaluate(() => document.querySelector('#mockCalc').click());

  /* выход с сохранением */
  await p.evaluate(() => document.querySelector('#mockExit').click());
  await sleep(500);
  await p.evaluate(() => document.querySelector('#exitYes').click());
  await sleep(1200);
  const afterExit = await p.evaluate(() => ({
    hash: location.hash,
    examModeOff: !document.body.classList.contains('exam-mode'),
    resumeBtn: !!document.querySelector('#mockResume'),
  }));
  console.log('after exit:', JSON.stringify(afterExit));
  await shot('ux-03-resume.png');

  console.log('---- errors:', errors.length ? '\n' + errors.join('\n') : 'none');
  await b.close();
  await fetch(SB + 'users?id=eq.' + UID, { method: 'DELETE', headers: H });
  console.log('cleanup done');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
