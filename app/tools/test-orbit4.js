/* Orbit 4.0 e2e: placement → тренажёр → практика → зачёт → маршрут учителя */
const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:8091/';
const OUT = 'D:\\rep\\voskhod\\app-shots\\';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' };
const SALT = 'o4';
const errors = [];
const mkHash = (pass) => crypto.createHash('sha256').update(SALT + ':' + pass).digest('hex');
const U1 = 'uo4student', U2 = 'uo4teacher';
const CLEAN_TABLES = ['mastery', 'block_state', 'placement', 'plans_study', 'stardust', 'student_plans'];

async function cleanup() {
  for (const t of CLEAN_TABLES) await fetch(SB + t + '?student_id=eq.' + U1, { method: 'DELETE', headers: H });
  await fetch(SB + 'plans_study?teacher_id=eq.' + U2, { method: 'DELETE', headers: H });
  await fetch(SB + 'student_plans?teacher_id=eq.' + U2, { method: 'DELETE', headers: H });
  await fetch(SB + 'users?id=in.(' + U1 + ',' + U2 + ')', { method: 'DELETE', headers: H });
}

(async () => {
  await cleanup();
  /* подготовка: пользователи сеются в localStorage (локальный адаптер),
     CONFIG замораживается до загрузки скриптов, чтобы БД была локальной */
  const seed = {
    users: [
      { id: U1, login: 'o4student', passHash: mkHash('pass1'), salt: SALT, role: 'student', name: 'Орбита Четыре', active: true, xp: 0, groupId: '' },
      { id: U2, login: 'o4teacher', passHash: mkHash('pass2'), salt: SALT, role: 'teacher', name: 'Тест Препод', active: true, xp: 0, rate: 10, subject: 'SAT Math' },
    ],
    groups: [{ id: 'g1', name: 'SAT 2026 · поток A', teacherIds: ['uo4teacher'], studentIds: ['uo4student'] }], lessons: [], homework: [], payments: [], attempts: [], custom_tests: [],
    mock_results: [], leads: [], mastery: [], block_state: [], placement: [], plans_study: [], stardust: [], student_plans: [],
  };

  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.evaluateOnNewDocument((seedJson) => {
    Object.defineProperty(window, 'CONFIG', {
      value: { SUPABASE_URL: '', SUPABASE_ANON_KEY: '', APP_VERSION: 'test', APK_URL: '', SCHOOL_NAME: 'VOSKHOD' },
      writable: false, configurable: false,
    });
    localStorage.setItem('vo-db-v2', seedJson);
  }, JSON.stringify(seed));
  p.on('pageerror', e => errors.push('P: ' + e.message));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const shot = async n => { await p.screenshot({ path: OUT + n }); console.log('shot', n); };
  const type = (s, v) => p.evaluate((sel, val) => {
    const el = document.querySelector(sel); el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, s, v);
  const click = s => p.evaluate(sel => { const el = document.querySelector(sel); if (!el) throw new Error('нет элемента: ' + sel); el.click(); }, s);

  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForSelector('#loginName', { timeout: 20000 });
  await type('#loginName', 'o4student');
  await type('#loginPass', 'pass1');
  await click('#loginBtn');
  await sleep(2000);

  /* карточка размещения на Сегодня */
  const todayHasPlacement = await p.evaluate(() => document.body.innerText.includes('Вводное тестирование не пройдено'));
  console.log('today placement card:', todayHasPlacement);
  await click('a[href="#/trainer"]');
  await sleep(1000);
  await shot('o4-01-placement-intro.png');
  await click('a[href="#/trainer/placement/run"]');
  await sleep(800);

  /* проходим размещение: случайно */
  for (let i = 0; i < 80; i++) {
    const done = await p.evaluate(() => !document.querySelector('[data-popt]'));
    if (done) break;
    await p.evaluate(() => {
      const btns = [...document.querySelectorAll('[data-popt]')];
      btns[Math.floor(Math.random() * btns.length)].click();
    });
    await sleep(40);
    await click('#pNext');
    await sleep(45);
  }
  await sleep(1500);
  const results = await p.evaluate(() => ({
    verdict: (document.querySelector('.result__verdict') || {}).textContent || null,
    blocks: document.querySelectorAll('.stat-tile').length,
    consult: document.body.innerText.includes('Консультация'),
  }));
  console.log('placement results:', JSON.stringify(results));
  await shot('o4-02-placement-results.png');

  /* тренажёр: карта блоков */
  await click('a[href="#/trainer"]');
  await sleep(1200);
  const trainer = await p.evaluate(() => ({
    blocks: document.querySelectorAll('.tr-block__head').length,
    stardust: document.body.innerText.includes('звёздной пыли'),
    practice: [...document.querySelectorAll('a')].filter(a => a.textContent === 'Практика').length,
  }));
  console.log('trainer map:', JSON.stringify(trainer));
  await shot('o4-03-trainer-map.png');

  /* практика по a1 */
  await click('a[href="#/trainer/topic/a1/practice"]');
  await sleep(800);
  for (let i = 0; i < 25; i++) {
    const hasQ = await p.evaluate(() => !!document.querySelector('[data-topt]'));
    if (!hasQ) break;
    await p.evaluate(() => {
      const btns = [...document.querySelectorAll('[data-topt]')];
      btns[Math.floor(Math.random() * btns.length)].click();
    });
    await sleep(35);
    await click('#tNext');
    await sleep(40);
  }
  await sleep(1200);
  const practice = await p.evaluate(() => (document.querySelector('.result__verdict') || {}).textContent || null);
  console.log('practice result:', practice);

  /* зачёт a1 (random ~25% — ожидаем fail, проверяем экран) */
  await p.evaluate(() => { location.hash = '#/trainer/topic/a1/gate'; });
  await sleep(800);
  for (let i = 0; i < 30; i++) {
    const hasQ = await p.evaluate(() => !!document.querySelector('[data-topt]'));
    if (!hasQ) break;
    await p.evaluate(() => {
      const btns = [...document.querySelectorAll('[data-topt]')];
      btns[Math.floor(Math.random() * btns.length)].click();
    });
    await sleep(30);
    await click('#tNext');
    await sleep(35);
  }
  await sleep(1200);
  const gate = await p.evaluate(() => ({
    verdict: (document.querySelector('.result__verdict') || {}).textContent || null,
    badges: document.querySelectorAll('.badge').length,
  }));
  console.log('gate result:', JSON.stringify(gate));
  await shot('o4-04-gate.png');

  /* ── учитель: маршрут + план ── */
  await p.evaluate(() => { location.hash = '#/settings'; });
  await sleep(700);
  await click('#logoutBtn2');
  await sleep(900);
  await type('#loginName', 'o4teacher');
  await type('#loginPass', 'pass2');
  await click('#loginBtn');
  await sleep(2000);
  await p.evaluate(() => { location.hash = '#/students'; });
  await sleep(1200);
  const dbg = await p.evaluate(() => ({
    hash: location.hash,
    rows: document.querySelectorAll('.student-row').length,
    routeLinks: document.querySelectorAll('a[href*="#/route/"]').length,
    groupsRaw: window.DB.allGroups().map(g => ({ id: g.id, teacherIds: g.teacherIds, studentIds: g.studentIds })),
    me: (window.DB.currentUser() || {}).id + '/' + (window.DB.currentUser() || {}).role,
    session: window.DB.session(),
    myGroups: window.DB.groupsFor(window.DB.currentUser()).map(g => g.name),
    snippet: document.body.innerText.slice(0, 130).replace(/\n/g, ' | '),
  }));
  console.log('students page:', JSON.stringify(dbg));
  await click('a[href*="#/route/"]');
  await sleep(1400);
  const planner = await p.evaluate(() => ({
    heatmap: document.querySelectorAll('.hm-cell').length,
    recs: document.querySelectorAll('.hw').length,
    approve: !!document.querySelector('#approvePlan'),
    planPrice: (document.getElementById('plPrice') || {}).textContent || null,
  }));
  console.log('route planner:', JSON.stringify(planner));
  await shot('o4-05-route-planner.png');

  /* тариф: сохранить план */
  await p.evaluate(() => document.getElementById('plSave').click());
  await sleep(1200);
  const planSaved = await p.evaluate(() => document.body.innerText.includes('/ месяц'));
  console.log('plan saved:', planSaved);

  /* утвердить маршрут */
  await click('#approvePlan');
  await sleep(1200);
  const approved = await p.evaluate(() => document.body.innerText.includes('Маршрут утверждён'));
  console.log('route approved:', approved);

  /* ученик видит маршрут */
  await p.evaluate(() => { location.hash = '#/settings'; });
  await sleep(600);
  await click('#logoutBtn2');
  await sleep(900);
  await type('#loginName', 'o4student');
  await type('#loginPass', 'pass1');
  await click('#loginBtn');
  await sleep(2000);
  await p.evaluate(() => { location.hash = '#/trainer'; });
  await sleep(1200);
  const studentSees = await p.evaluate(() => document.body.innerText.includes('маршрут утверждён'));
  console.log('student sees approved route:', studentSees);
  await shot('o4-06-student-route.png');

  console.log('---- errors:', errors.length ? '\n' + errors.join('\n') : 'none');
  await b.close();
  await cleanup();
  console.log('cleanup done');
})().catch(async (e) => { console.error('FAIL:', e.message); await cleanup(); process.exit(1); });
