/* Сквозной прогон V2: мастер настройки → админ (создание аккаунтов, группы, оплаты)
   → учитель (урок) → ученик (тест EN, теория, домашка) → админ видит результаты */
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
  const shot = async n => { await page.screenshot({ path: OUT + n }); console.log('shot', n); };
  const click = sel => page.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('no ' + s); el.click(); }, sel);
  const type = (sel, val) => page.evaluate((s, v) => {
    const el = document.querySelector(s);
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, sel, val);

  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await sleep(1800);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(1500);

  /* ── 1. мастер настройки ── */
  const setupVisible = await page.evaluate(() => !!document.querySelector('#setupForm'));
  console.log('setup wizard shown:', setupVisible);
  await shot('v2-01-setup.png');
  await type('#suName', 'Админ Школы');
  await type('#suLogin', 'admin');
  await type('#suPass', 'orbit2026');
  await type('#suPass2', 'orbit2026');
  await click('#suBtn');
  await sleep(900);
  console.log('after setup hash:', await page.evaluate(() => location.hash));
  await shot('v2-02-admin-today.png');

  /* ── 2. группа ── */
  await page.evaluate(() => { location.hash = '#/admin-groups'; });
  await sleep(700);
  await click('#addGroup');
  await sleep(500);
  await type('#gmName', 'SAT 2026 · поток A');
  /* выбираем никого — группу без людей сначала */
  await click('#gmSave');
  await sleep(700);
  console.log('group created');
  await shot('v2-03-admin-groups.png');

  /* ── 3. пользователь: преподаватель ── */
  await page.evaluate(() => { location.hash = '#/admin-users'; });
  await sleep(700);
  await click('#addUser');
  await sleep(500);
  await type('#umName', 'Елена Смирнова');
  await type('#umLogin', 'elena');
  await page.evaluate(() => {
    const sel = document.querySelector('#umRole');
    sel.value = 'teacher';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await type('#umSubject', 'SAT Math · Математика');
  await type('#umPass', 'teach123');
  await click('#umSave');
  await sleep(700);

  /* ученик */
  await click('#addUser');
  await sleep(500);
  await type('#umName', 'Азиз Каримов');
  await type('#umLogin', 'aziz');
  /* роль student по умолчанию; группа уже выбрана */
  await type('#umPass', 'study123');
  await click('#umSave');
  await sleep(700);
  const userCount = await page.evaluate(() => window.DB.allUsers().length);
  console.log('users now:', userCount); // админ + препод + ученик = 3
  await shot('v2-04-admin-users.png');

  /* добавим ученика в группу */
  await page.evaluate(() => {
    const users = window.DB.allUsers();
    const aziz = users.find(u => u.login === 'aziz');
    const g = window.DB.allGroups()[0];
    g.studentIds.push(aziz.id);
    aziz.groupId = g.id;
    window.DB.saveGroup(g);
    window.DB.saveUser(aziz);
  });
  await sleep(500);

  /* ── 4. оплата ── */
  await page.evaluate(() => { location.hash = '#/admin-payments'; });
  await sleep(700);
  await type('#payAmount', '1500000');
  await click('#payAdd');
  await sleep(700);
  await shot('v2-05-admin-payments.png');

  /* ── 5. урок от лица админа ── */
  await page.evaluate(() => { location.hash = '#/schedule'; });
  await sleep(700);
  await page.evaluate(() => document.querySelector('[data-add-lesson]').click());
  await sleep(600);
  await type('#leSubject', 'SAT Math');
  await type('#leTopic', 'Percentages & Proportions');
  await click('#leSave');
  await sleep(800);
  const lessonCreated = await page.evaluate(() => window.DB.allUsers() && window.DB.lessonsFor(window.DB.currentUser()).length);
  console.log('lessons for admin:', lessonCreated);
  await shot('v2-06-schedule-with-lesson.png');

  /* ── 6. выход, вход учителем ── */
  await page.evaluate(() => { location.hash = '#/settings'; });
  await sleep(600);
  await click('#logoutBtn2');
  await sleep(800);
  await type('#loginName', 'elena');
  await type('#loginPass', 'teach123');
  await click('#loginBtn');
  await sleep(900);
  console.log('teacher hash:', await page.evaluate(() => location.hash));
  await shot('v2-07-teacher-today.png');

  /* неверный пароль */
  await page.evaluate(() => { location.hash = '#/settings'; });
  await sleep(500);
  await click('#logoutBtn2');
  await sleep(700);
  await type('#loginName', 'aziz');
  await type('#loginPass', 'wrongpass');
  await click('#loginBtn');
  await sleep(700);
  const errShown = await page.evaluate(() => {
    const e = document.querySelector('#loginErr');
    return e && e.style.display !== 'none' ? e.textContent : null;
  });
  console.log('wrong pass error:', errShown);

  /* ── 7. вход учеником ── */
  await type('#loginPass', 'study123');
  await click('#loginBtn');
  await sleep(900);
  console.log('student hash:', await page.evaluate(() => location.hash));
  await shot('v2-08-student-today.png');

  /* расписание: урок виден */
  await page.evaluate(() => { location.hash = '#/schedule'; });
  await sleep(700);
  const lessonVisible = await page.evaluate(() => document.body.innerText.includes('Percentages & Proportions'));
  console.log('lesson visible to student:', lessonVisible);

  /* теория */
  await page.evaluate(() => { location.hash = '#/theory'; });
  await sleep(700);
  await shot('v2-09-theory.png');
  await page.evaluate(() => { location.hash = '#/theory/sat-math/percentages'; });
  await sleep(700);
  await shot('v2-10-theory-topic.png');

  /* тест b1 — все правильные */
  await page.evaluate(() => { location.hash = '#/test/b1'; });
  await sleep(900);
  await shot('v2-11-test-en.png');
  const xpBefore = await page.evaluate(() => window.DB.currentUser().xp);
  for (let i = 0; i < 8; i++) {
    const ok = await page.evaluate(() => {
      const test = window.DB.test('b1');
      const dots = [...document.querySelectorAll('.qdots i')];
      const qi = dots.findIndex(el => el.className === 'is-cur');
      const qIndex = qi !== -1 ? qi : dots.filter(e => e.className === 'is-done').length;
      const correct = test.questions[qIndex].correct;
      const btn = document.querySelector(`[data-opt="${correct}"]`);
      if (!btn) return false;
      btn.click();
      return true;
    });
    if (!ok) break;
    await sleep(200);
    const hasNext = await page.evaluate(() => {
      const next = document.querySelector('[data-act="next"]');
      if (!next) return false;
      next.click();
      return true;
    });
    if (!hasNext) break;
    await sleep(250);
  }
  await sleep(800);
  const xpAfter = await page.evaluate(() => window.DB.currentUser().xp);
  console.log('xp:', xpBefore, '→', xpAfter);
  await shot('v2-12-result.png');

  /* админ видит попытку */
  await page.evaluate(() => { location.hash = '#/settings'; });
  await sleep(500);
  await click('#logoutBtn2');
  await sleep(700);
  await type('#loginName', 'admin');
  await type('#loginPass', 'orbit2026');
  await click('#loginBtn');
  await sleep(900);
  const adminSees = await page.evaluate(() => {
    const attempts = window.DB.allAttempts();
    return { attempts: attempts.length, last: attempts[0] ? attempts[0].score + '/' + attempts[0].max : null };
  });
  console.log('admin sees attempts:', JSON.stringify(adminSees));
  await shot('v2-13-admin-overview-final.png');

  console.log('---- errors:', errors.length ? '\n' + errors.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
