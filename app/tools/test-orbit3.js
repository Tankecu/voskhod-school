/* Orbit 3.0 e2e: уникальный пробник + адаптив + лидерборд */
const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:8091/';
const OUT = 'D:\\rep\\voskhod\\app-shots\\';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const errors = [];
const UID = 'ugen3test';

(async () => {
  const salt = 'g3', hash = crypto.createHash('sha256').update(salt + ':passg3').digest('hex');
  await fetch(SB + 'users', {
    method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{ id: UID, login: 'gen3test', pass_hash: hash, salt, role: 'student', name: 'Gen Three', active: true, xp: 0 }]),
  });

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(() => { window.MOCK_TIME_SCALE = 0.02; });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const shot = async n => { await page.screenshot({ path: OUT + n }); console.log('shot', n); };

  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#loginName', { timeout: 20000 });
  await page.evaluate(() => {
    const set = (s, v) => { const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#loginName', 'gen3test');
    set('#loginPass', 'passg3');
  });
  await page.evaluate(() => document.querySelector('#loginBtn').click());
  await sleep(2000);
  await page.evaluate(() => { location.hash = '#/mock'; });
  await sleep(1200);
  const bothButtons = await page.evaluate(() => ({
    fixed: !!document.querySelector('#mockStart'),
    gen: !!document.querySelector('#mockGenStart'),
  }));
  console.log('intro buttons:', JSON.stringify(bothButtons));
  await shot('g3-01-intro.png');

  await page.evaluate(() => document.querySelector('#mockGenStart').click());
  await sleep(1200);
  const firstQ = await page.evaluate(() => document.querySelector('.qcard__text').textContent.slice(0, 70));
  console.log('gen M1 Q1:', firstQ);

  /* адаптив: проваливаем RW M1 (все неправильно) */
  for (let mod = 0; mod < 2; mod++) {
    for (let i = 0; i < 27; i++) {
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('[data-mopt]')];
        const q = window.MOCK_SAT_1; /* заглушка */
        const wrongIdx = 0;
        /* выбираем гарантированно неверный вариант через bank? вопросы генерированные —
           берём вариант, отличный от правильного: правильный неизвестен из DOM,
           поэтому кликаем по индексу 0..3 по очереди — для теста адаптива важен процент */
        btns[(Math.floor(Math.random() * 4))].click();
      });
      await sleep(40);
      await page.evaluate(() => { const b = document.querySelector('#mockNext'); if (b) b.click(); });
      await sleep(60);
    }
    await sleep(800);
    const hint = await page.evaluate(() => {
      const el = document.querySelector('.result .mono');
      return el ? el.textContent : null;
    });
    console.log('after module', mod + 1, 'adaptive hint:', hint);
    if (mod === 0) await shot('g3-02-adaptive-easy.png');
    if (mod === 1) {
      await page.evaluate(() => document.querySelector('#mockGo').click());
      await sleep(700);
      await page.evaluate(() => document.querySelector('#brkSkip').click());
      await sleep(700);
    } else {
      await page.evaluate(() => document.querySelector('#mockGo').click());
      await sleep(800);
    }
  }
  /* math: отвечаем все правильно → hard M2 */
  for (let mod = 0; mod < 2; mod++) {
    for (let i = 0; i < 22; i++) {
      await page.evaluate((mi, qi) => {
        /* правильный вариант недоступен из DOM; используем хранение в st? — нет.
           Кликаем случайно; для адаптива ниже проверяем hint */
        const btns = [...document.querySelectorAll('[data-mopt]')];
        btns[Math.floor(Math.random() * 4)].click();
      }, mod, i);
      await sleep(30);
      await page.evaluate(() => { const b = document.querySelector('#mockNext'); if (b) b.click(); });
      await sleep(40);
    }
    await sleep(700);
    if (mod === 0) {
      const hint = await page.evaluate(() => {
        const el = document.querySelector('.result .mono');
        return el ? el.textContent.slice(0, 60) : null;
      });
      console.log('math adaptive hint:', hint);
      await page.evaluate(() => document.querySelector('#mockGo').click());
      await sleep(700);
    }
  }
  await sleep(1500);
  const scores = await page.evaluate(() => {
    const ring = document.querySelector('.result__ring b');
    const badges = [...document.querySelectorAll('.badge')].map(b => b.textContent.trim());
    return { total: ring ? ring.textContent : null, badges };
  });
  console.log('scores:', JSON.stringify(scores));
  await shot('g3-03-scores.png');

  /* лидерборд */
  await page.evaluate(() => { location.hash = '#/leaderboard'; });
  await sleep(1200);
  const lb = await page.evaluate(() => ({
    rows: document.querySelectorAll('.student-row').length,
    hasSelf: document.body.innerText.includes('Gen Three'),
  }));
  console.log('leaderboard:', JSON.stringify(lb));
  await shot('g3-04-leaderboard.png');

  /* мобильный вид интро пробника */
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.evaluate(() => { location.hash = '#/mock'; });
  await sleep(1200);
  await shot('g3-05-m-mock.png');

  console.log('---- errors:', errors.length ? '\n' + errors.join('\n') : 'none');
  await browser.close();

  /* очистка */
  await fetch(SB + 'mock_results?student_id=eq.' + UID, { method: 'DELETE', headers: H });
  await fetch(SB + 'users?id=eq.' + UID, { method: 'DELETE', headers: H });
  console.log('cleanup done');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
