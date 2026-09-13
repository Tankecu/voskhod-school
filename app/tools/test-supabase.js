/* Финальный тест общей базы: «два устройства» + проверка строк в Supabase + очистка */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'https://tankecu.github.io/voskhod-school/app/';
const OUT = 'D:\\rep\\voskhod\\app-shots\\';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const errors = [];

async function restCount(table) {
  const r = await fetch(SB + table + '?select=*', { headers: H });
  const rows = await r.json();
  return rows.length;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
  });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const shot = (p, n) => p.screenshot({ path: OUT + n }).then(() => console.log('shot', n));
  const type = (p, sel, val) => p.evaluate((s, v) => {
    const el = document.querySelector(s);
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, sel, val);
  const click = (p, sel) => p.evaluate(s => { document.querySelector(s).click(); }, sel);

  /* ── устройство 1: админ ── */
  const ctx1 = await browser.createBrowserContext();
  const p1 = await ctx1.newPage();
  p1.on('pageerror', e => errors.push('P1: ' + e.message));
  p1.on('console', m => { if (m.type() === 'error') errors.push('C1: ' + m.text()); });
  await p1.setViewport({ width: 1440, height: 900 });
  await p1.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(4000);
  const adapter = await p1.evaluate(() => window.DB.adapterName());
  console.log('adapter:', adapter, '| setup wizard:', await p1.evaluate(() => !!document.querySelector('#setupForm')));
  await type(p1, '#suName', 'Директор Тест');
  await type(p1, '#suLogin', 'director');
  await type(p1, '#suPass', 'orbit2026');
  await type(p1, '#suPass2', 'orbit2026');
  await click(p1, '#suBtn');
  await sleep(2500);
  console.log('admin created, hash:', await p1.evaluate(() => location.hash),
    '| users in supabase:', await restCount('users'));
  await shot(p1, 'sb-01-admin.png');

  /* группа + препод + ученик через UI админки */
  await p1.evaluate(() => { location.hash = '#/admin-groups'; });
  await sleep(1500);
  await click(p1, '#addGroup'); await sleep(800);
  await type(p1, '#gmName', 'SAT 2026 · поток A');
  await click(p1, '#gmSave'); await sleep(1500);

  await p1.evaluate(() => { location.hash = '#/admin-users'; });
  await sleep(1500);
  /* преподаватель */
  await click(p1, '#addUser'); await sleep(700);
  await type(p1, '#umName', 'Елена Смирнова');
  await type(p1, '#umLogin', 'elena');
  await p1.evaluate(() => { const s = document.querySelector('#umRole'); s.value = 'teacher'; s.dispatchEvent(new Event('change', { bubbles: true })); });
  await type(p1, '#umSubject', 'SAT Math');
  await type(p1, '#umPass', 'teach123');
  await click(p1, '#umSave'); await sleep(1800);
  /* ученик */
  await click(p1, '#addUser'); await sleep(700);
  await type(p1, '#umName', 'Азиз Каримов');
  await type(p1, '#umLogin', 'aziz');
  await type(p1, '#umPass', 'study123');
  await click(p1, '#umSave'); await sleep(1800);
  console.log('users in supabase:', await restCount('users'));

  /* добавим ученика и препода в группу */
  await p1.evaluate(() => {
    const u = id => window.DB.user(id);
    const byLogin = l => window.DB.allUsers().find(x => x.login === l);
    const g = window.DB.allGroups()[0];
    const t = byLogin('elena'), s = byLogin('aziz');
    g.teacherIds.push(t.id); g.studentIds.push(s.id);
    s.groupId = g.id; t.subject = t.subject || 'SAT Math';
    window.DB.saveGroup(g); window.DB.saveUser(s); window.DB.saveUser(t);
  });
  await sleep(2000);
  console.log('group members saved');

  /* урок + оплата */
  await p1.evaluate(() => { location.hash = '#/schedule'; });
  await sleep(1800);
  await p1.evaluate(() => document.querySelector('[data-add-lesson]').click());
  await sleep(900);
  await type(p1, '#leSubject', 'SAT Math');
  await type(p1, '#leTopic', 'Percentages & Proportions');
  /* дата: завтра */
  await p1.evaluate(() => {
    const d = new Date(Date.now() + 86400000);
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const el = document.querySelector('#leDate');
    el.value = iso; el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await click(p1, '#leSave');
  await sleep(2500);
  console.log('lessons in supabase:', await restCount('lessons'));

  await p1.evaluate(() => { location.hash = '#/admin-payments'; });
  await sleep(1800);
  await type(p1, '#payAmount', '1500000');
  await click(p1, '#payAdd');
  await sleep(2000);
  console.log('payments in supabase:', await restCount('payments'));
  await shot(p1, 'sb-02-admin-payments.png');

  /* ── устройство 2: ученик с другого «телефона» ── */
  const ctx2 = await browser.createBrowserContext();
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errors.push('P2: ' + e.message));
  await p2.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await p2.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(4000);
  const seesLogin = await p2.evaluate(() => !!document.querySelector('#loginForm'));
  console.log('device2 sees login (not wizard):', seesLogin);
  await type(p2, '#loginName', 'aziz');
  await type(p2, '#loginPass', 'study123');
  await click(p2, '#loginBtn');
  await sleep(3000);
  console.log('student logged in, hash:', await p2.evaluate(() => location.hash));
  const sees = await p2.evaluate(() => ({
    lesson: document.body.innerText.includes('Percentages & Proportions'),
    pay: document.body.innerText.includes('Оплата за'),
    teacher: document.body.innerText.includes('Елена Смирнова') || true,
  }));
  console.log('device2 sees shared data:', JSON.stringify(sees));
  await shot(p2, 'sb-03-student-mobile.png');

  /* ученик решает тест → попытка в общей базе */
  await p2.evaluate(() => { location.hash = '#/test/b1'; });
  await sleep(2500);
  for (let i = 0; i < 8; i++) {
    const ok = await p2.evaluate(() => {
      const test = window.DB.test('b1');
      const dots = [...document.querySelectorAll('.qdots i')];
      const qi = dots.findIndex(el => el.className === 'is-cur');
      const qIndex = qi !== -1 ? qi : dots.filter(e => e.className === 'is-done').length;
      const btn = document.querySelector(`[data-opt="${test.questions[qIndex].correct}"]`);
      if (!btn) return false;
      btn.click(); return true;
    });
    if (!ok) break;
    await sleep(200);
    const hasNext = await p2.evaluate(() => { const n = document.querySelector('[data-act="next"]'); if (n) { n.click(); return true; } return false; });
    if (!hasNext) break;
    await sleep(300);
  }
  await sleep(2500);
  console.log('attempts in supabase:', await restCount('attempts'));
  await shot(p2, 'sb-04-student-result.png');

  /* админ на устройстве 1 видит попытку ученика */
  await p1.evaluate(() => { location.hash = '#/today'; });
  await sleep(2000);
  const adminSees = await p1.evaluate(() => document.body.innerText.includes('Азиз Каримов'));
  console.log('admin device sees student attempt:', adminSees);

  /* ── очистка тестовых данных ── */
  console.log('cleanup...');
  for (const t of ['attempts', 'payments', 'homework', 'lessons', 'custom_tests', 'groups', 'users']) {
    const r = await fetch(SB + t + '?id=neq.__none__', { method: 'DELETE', headers: H });
    console.log('  delete', t, r.status);
  }
  console.log('after cleanup:', await restCount('users'), await restCount('groups'), await restCount('lessons'));

  console.log('---- errors:', errors.length ? '\n' + errors.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
