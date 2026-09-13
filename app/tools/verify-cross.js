/* Проверка сквозного сценария без очистки хранилища:
   препод создаёт тест → выходит → ученик входит и видит тест */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8091/', { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:8091/#/login', { waitUntil: 'domcontentloaded' });
  await sleep(800);

  /* вход как преподаватель (btns[1]) */
  await page.evaluate(() => document.querySelectorAll('[data-login]')[1].click());
  await sleep(700);

  /* конструктор */
  await page.evaluate(() => { location.hash = '#/builder'; });
  await sleep(900);
  await page.evaluate(() => {
    const set = (sel, val) => {
      const el = document.querySelector(sel);
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    set('#tbTitle', 'Тренировка: функции');
    set('[data-q="0"]', 'Чему равен f(3), если f(x) = 2x + 1?');
    ['7', '5', '6', '9'].forEach((v, i) => set(`[data-opt="0:${i}"]`, v));
    set('[data-explain="0"]', 'f(3) = 2·3 + 1 = 7');
    document.querySelector('[data-correct="0:0"]').click();
  });
  await sleep(300);
  await page.evaluate(() => document.querySelector('#saveTest').click());
  await sleep(900);

  const savedAsTeacher = await page.evaluate(() => {
    return DB.ready().tests.some(t => t.title === 'Тренировка: функции');
  });
  console.log('saved in db as teacher:', savedAsTeacher);

  /* выход через интерфейс (боковое меню) */
  await page.evaluate(() => { location.hash = '#/settings'; });
  await sleep(600);
  await page.evaluate(() => document.getElementById('logoutBtn2').click());
  await sleep(700);

  /* вход как ученик */
  await page.evaluate(() => document.querySelectorAll('[data-login]')[0].click());
  await sleep(700);
  await page.evaluate(() => { location.hash = '#/tests'; });
  await sleep(800);
  const visible = await page.evaluate(() => ({
    inList: [...document.querySelectorAll('.test-card h3')].some(h => h.textContent.includes('Тренировка: функции')),
    hash: location.hash,
  }));
  console.log('visible to student:', JSON.stringify(visible));

  /* заодно: hw XP — отмечаем домашку, проверяем +5 */
  await page.evaluate(() => { location.hash = '#/homework'; });
  await sleep(700);
  const xpBefore = await page.evaluate(() => DB.currentUser().xp);
  await page.evaluate(() => { const b = document.querySelector('[data-hw]'); if (b) b.click(); });
  await sleep(500);
  const xpAfter = await page.evaluate(() => DB.currentUser().xp);
  console.log('hw xp delta:', xpAfter - xpBefore);

  console.log('pageerrors:', errs.length ? errs.join(' | ') : 'none');
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
