/* Тест пробника: ускоренный таймер → все модули → баллы → разбор */
const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:8091/';
const OUT = 'D:\\rep\\voskhod\\app-shots\\';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const errors = [];
const TEST_USER_ID = 'utestmock01';

(async () => {
  /* подготовка: тестовый ученик в Supabase */
  const salt = 'ms123';
  const hash = crypto.createHash('sha256').update(salt + ':passmock').digest('hex');
  await fetch(SB + 'users', {
    method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{ id: TEST_USER_ID, login: 'mocktest', pass_hash: hash, salt, role: 'student', name: 'Mock Test', active: true, xp: 0, streak: 0 }]),
  });
  console.log('test student ready');

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(() => { window.MOCK_TIME_SCALE = 0.01; });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const shot = async n => { await page.screenshot({ path: OUT + n }); console.log('shot', n); };
  const type = (sel, val) => page.evaluate((s, v) => {
    const el = document.querySelector(s); el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, sel, val);
  const click = sel => page.evaluate(s => document.querySelector(s).click(), sel);

  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await sleep(3000);
  await type('#loginName', 'mocktest');
  await type('#loginPass', 'passmock');
  await click('#loginBtn');
  await sleep(2200);
  console.log('hash:', await page.evaluate(() => location.hash));

  /* вкладка пробника */
  await page.evaluate(() => { location.hash = '#/mock'; });
  await sleep(1500);
  await shot('mock-01-intro.png');
  await click('#mockStart');
  await sleep(1500);
  await shot('mock-02-question.png');

  /* проходим все 4 модуля, отвечая правильно */
  const moduleInfo = [];
  for (let mod = 0; mod < 4; mod++) {
    const sec = mod < 2 ? 'rw' : 'math';
    const len = await page.evaluate((s, mi) => {
      const m = window.MOCK_SAT_1;
      return (s === 'rw' ? m.rw : m.math)[mi].length;
    }, sec, mod % 2);
    moduleInfo.push(sec + (mod % 2 + 1) + ':' + len);
    for (let i = 0; i < len; i++) {
      await page.evaluate(() => {
        const st = window.__nothing; /* нет доступа к st — кликаем верный вариант по данным вопроса */
      });
      const ok = await page.evaluate((s, mi, qi) => {
        const m = window.MOCK_SAT_1;
        const q = (s === 'rw' ? m.rw : m.math)[mi][qi];
        const btn = document.querySelector(`[data-mopt="${q.correct}"]`);
        if (!btn) return false;
        btn.click();
        return true;
      }, sec, mod % 2, i);
      if (!ok) { console.log('option click failed at', mod, i); break; }
      await sleep(60);
      const next = await page.evaluate(() => {
        const b = document.querySelector('#mockNext');
        if (!b) return false;
        b.click(); return true;
      });
      if (!next) break;
      await sleep(60);
    }
    /* модуль завершён → экран Module End */
    await sleep(900);
    const endScreen = await page.evaluate(() => !!document.querySelector('#mockGo'));
    console.log('module', mod + 1, 'end screen:', endScreen);
    if (mod === 1) {
      await shot('mock-03-module-end.png');
      /* перерыв */
      await click('#mockGo');
      await sleep(900);
      const brk = await page.evaluate(() => !!document.querySelector('#brkSkip'));
      console.log('break screen:', brk);
      await shot('mock-04-break.png');
      await click('#brkSkip');
      await sleep(900);
    } else if (mod < 3) {
      await click('#mockGo');
      await sleep(900);
    }
    /* mod === 3 → finish() → экран баллов без #mockGo */
  }
  console.log('modules passed:', moduleInfo.join(' '));

  /* экран баллов */
  await sleep(1500);
  const scores = await page.evaluate(() => {
    const ring = document.querySelector('.result__ring b');
    const tiles = [...document.querySelectorAll('.mock-scores .stat-tile b')].map(b => b.textContent);
    return { total: ring ? ring.textContent : null, tiles };
  });
  console.log('scores:', JSON.stringify(scores), '(ожидалось 1600 / 800+800)');
  await shot('mock-05-scores.png');

  /* разбор */
  await click('[href*="mock/review"]');
  await sleep(1800);
  const reviewCount = await page.evaluate(() => document.querySelectorAll('.qcard').length);
  console.log('review questions rendered:', reviewCount, '(ожидается 98)');
  await shot('mock-06-review.png');

  /* история на вкладке пробника */
  await page.evaluate(() => { location.hash = '#/mock'; });
  await sleep(1500);
  const historyShown = await page.evaluate(() => document.body.innerText.includes('мои попытки'));
  console.log('history shown:', historyShown);
  await shot('mock-07-history.png');

  /* прогресс: тренд — один пробник → заглушка */
  await page.evaluate(() => { location.hash = '#/progress'; });
  await sleep(1500);
  const badges = await page.evaluate(() => document.body.innerText.includes('Первый пробник'));
  console.log('mock badge in progress:', badges);

  console.log('---- errors:', errors.length ? '\n' + errors.join('\n') : 'none');
  await browser.close();

  /* очистка тестовых данных */
  await fetch(SB + 'mock_results?student_id=eq.' + TEST_USER_ID, { method: 'DELETE', headers: H });
  await fetch(SB + 'users?id=eq.' + TEST_USER_ID, { method: 'DELETE', headers: H });
  console.log('cleanup done');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
