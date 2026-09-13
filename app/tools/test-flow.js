/* Сквозной прогон платформы: ученик (дашборд → тест → домашка → прогресс),
   преподаватель (дашборд → конструктор → создание теста → проверка у ученика) */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:8091/';
const OUT = __dirname + '\\..\\..\\app-shots\\';
require('fs').mkdirSync(OUT, { recursive: true });

const errors = [];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const shot = async name => { await page.screenshot({ path: OUT + name }); console.log('shot', name); };
  const login = async (who) => {
    await page.goto(URL + '#/login', { waitUntil: 'domcontentloaded' });
    await sleep(1200);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(1000);
    await page.evaluate((w) => {
      const btns = [...document.querySelectorAll('[data-login]')];
      btns[w].click();
    }, who === 'student' ? 0 : 1);
    await sleep(900);
  };

  /* ── ученик ── */
  await login('student');
  console.log('hash after student login:', await page.evaluate(() => location.hash));
  await shot('01-student-today.png');

  await page.evaluate(() => { location.hash = '#/schedule'; });
  await sleep(800);
  await shot('02-student-schedule.png');

  /* урок: детали */
  await page.evaluate(() => document.querySelector('[data-details]').click());
  await sleep(600);
  await shot('03-lesson-modal.png');
  await page.keyboard.press('Escape');
  await sleep(400);

  /* тест: пройти все вопросы правильно */
  await page.evaluate(() => { location.hash = '#/tests'; });
  await sleep(700);
  await shot('04-student-tests.png');

  await page.evaluate(() => { location.hash = '#/test/q1'; });
  await sleep(800);
  await shot('05-test-question.png');

  const qCount = await page.evaluate(() => {
    const answers = [];
    return fetch('/').then(() => answers);
  });
  // проходим все 8 вопросов теста q1, выбирая правильный через данные объяснения нет — читаем из DB
  for (let i = 0; i < 8; i++) {
    const ok = await page.evaluate(() => {
      const hash = location.hash;
      const m = window.DB;
      const test = m.test('q1');
      const idx = [...document.querySelectorAll('.qdots i')].findIndex(el => el.className === 'is-cur');
      const qi = idx === -1 ? [...document.querySelectorAll('.qdots i')].filter(e => e.className === 'is-done').length : idx;
      const correct = test.questions[qi] ? test.questions[qi].correct : 0;
      const btn = document.querySelector(`[data-opt="${correct}"]`);
      if (!btn) return false;
      btn.click();
      return true;
    });
    if (!ok) { console.log('no option btn at q', i); break; }
    await sleep(250);
    const hasNext = await page.evaluate(() => {
      const next = document.querySelector('[data-act="next"]');
      if (!next) return false;
      next.click();
      return true;
    });
    if (!hasNext) break;
    await sleep(300);
  }
  await sleep(900);
  const xpAfter = await page.evaluate(() => {
    const u = window.DB.currentUser();
    return { xp: u.xp, hash: location.hash };
  });
  console.log('student xp after test:', JSON.stringify(xpAfter));
  await shot('06-test-result.png');

  /* разбор ошибок */
  const hasReview = await page.evaluate(() => {
    const b = document.querySelector('#reviewBtn');
    if (!b) return false;
    b.click(); return true;
  });
  await sleep(600);
  if (hasReview) await shot('07-test-review.png');

  /* домашка */
  await page.evaluate(() => { location.hash = '#/homework'; });
  await sleep(700);
  await shot('08-homework.png');
  const hwToggled = await page.evaluate(() => {
    const btn = document.querySelector('[data-hw]');
    if (!btn) return false;
    btn.click(); return true;
  });
  await sleep(500);
  console.log('hw toggled:', hwToggled);
  await shot('09-homework-done.png');

  /* прогресс */
  await page.evaluate(() => { location.hash = '#/progress'; });
  await sleep(800);
  await shot('10-progress.png');

  /* мобильный вид */
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.evaluate(() => { location.hash = '#/today'; });
  await sleep(800);
  await shot('11-m-today.png');
  await page.evaluate(() => { location.hash = '#/schedule'; });
  await sleep(800);
  await shot('12-m-schedule.png');
  await page.evaluate(() => { location.hash = '#/more'; });
  await sleep(600);
  await shot('13-m-more.png');

  /* ── преподаватель ── */
  await page.setViewport({ width: 1440, height: 900 });
  await login('teacher');
  console.log('hash after teacher login:', await page.evaluate(() => location.hash));
  await shot('14-teacher-today.png');

  await page.evaluate(() => { location.hash = '#/students'; });
  await sleep(700);
  await shot('15-teacher-students.png');

  /* конструктор: создать тест */
  await page.evaluate(() => { location.hash = '#/builder'; });
  await sleep(800);
  await shot('16-builder.png');

  await page.evaluate(() => {
    document.querySelector('#tbTitle').value = 'Тренировка: функции';
    document.querySelector('#tbTitle').dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('[data-q="0"]').value = 'Чему равен f(3), если f(x) = 2x + 1?';
    document.querySelector('[data-q="0"]').dispatchEvent(new Event('input', { bubbles: true }));
    const vals = ['7', '5', '6', '9'];
    vals.forEach((v, i) => {
      const el = document.querySelector(`[data-opt="0:${i}"]`);
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    document.querySelector('[data-explain="0"]').value = 'f(3) = 2·3 + 1 = 7';
    document.querySelector('[data-explain="0"]').dispatchEvent(new Event('input', { bubbles: true }));
  });
  await sleep(200);
  await page.evaluate(() => document.querySelector('#saveTest').click());
  await sleep(900);
  console.log('hash after save:', await page.evaluate(() => location.hash));
  await shot('17-teacher-tests-after-save.png');

  /* проверяем, что тест виден ученику */
  await login('student');
  await page.evaluate(() => { location.hash = '#/tests'; });
  await sleep(800);
  const newTestVisible = await page.evaluate(() => document.body.innerText.includes('Тренировка: функции'));
  console.log('new test visible to student:', newTestVisible);
  await shot('18-student-sees-new-test.png');

  console.log('---- errors:', errors.length ? '\n' + errors.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error('FAIL:', e); process.exit(1); });
