/* ФИНАЛ: живой e2e на реальном Supabase — Orbit 4 + заявка с лендинга */
const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'https://tankecu.github.io/voskhod-school/app/';
const LANDING = 'https://tankecu.github.io/voskhod-school/';
const OUT = 'D:\\rep\\voskhod\\app-shots\\';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' };
const SALT = 'fin';
const U1 = 'ufinstudent', U2 = 'ufinteacher';
const errors = [];
const mkHash = (pass) => crypto.createHash('sha256').update(SALT + ':' + pass).digest('hex');

async function cleanup() {
  for (const t of ['mastery', 'block_state', 'placement', 'plans_study', 'stardust', 'student_plans']) {
    await fetch(SB + t + '?student_id=eq.' + U1, { method: 'DELETE', headers: H });
  }
  await fetch(SB + 'plans_study?teacher_id=eq.' + U2, { method: 'DELETE', headers: H });
  await fetch(SB + 'student_plans?teacher_id=eq.' + U2, { method: 'DELETE', headers: H });
  await fetch(SB + 'leads?contact=eq.@fin_test', { method: 'DELETE', headers: H });
  await fetch(SB + 'users?id=in.(' + U1 + ',' + U2 + ')', { method: 'DELETE', headers: H });
  await fetch(SB + 'users?login=eq.mobux', { method: 'DELETE', headers: H });
}

const SEED_USERS = [
  { id: U1, login: 'finstudent', salt: SALT, role: 'student', name: 'Финал Студент', active: true, xp: 0, groupId: '' },
  { id: U2, login: 'finteacher', salt: SALT, role: 'teacher', name: 'Финал Препод', active: true, xp: 0, rate: 12, subject: 'SAT Math' },
];

(async () => {
  await cleanup();
  console.log('old test data cleaned');

  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  p.on('pageerror', e => errors.push('P: ' + e.message));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const shot = async n => { await p.screenshot({ path: OUT + n }); console.log('shot', n); };
  const type = (s, v) => p.evaluate((sel, val) => {
    const el = document.querySelector(sel); el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, s, v);
  const click = s => p.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) throw new Error('нет: ' + sel);
    el.click();
  }, s);

  /* ── Supabase-адаптер активен? ── */
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await p.goto(APP, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('#loginName', { timeout: 30000 });
  const adapter = await p.evaluate(() => window.DB.adapterName());
  console.log('adapter:', adapter);

  /* сеем тестовых пользователей через слой приложения (WebCrypto страницы) */
  const hashes = await p.evaluate(async (salt, p1, p2) => {
    const h = (pass) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pass))
      .then(buf => [...new Uint8Array(buf)].map(b => ('0' + b.toString(16)).slice(-2)).join(''));
    return [await h(p1), await h(p2)];
  }, SALT, 'pass1', 'pass2');
  const seedUsers = [
    Object.assign({}, SEED_USERS[0], { passHash: hashes[0] }),
    Object.assign({}, SEED_USERS[1], { passHash: hashes[1] }),
  ];
  await p.evaluate(async (users) => {
    for (const u of users) await window.DB.saveUser(u);
  }, seedUsers);
  const seededCount = await p.evaluate(() => window.DB.allUsers().filter(u => String(u.login).indexOf('fin') === 0).length);
  console.log('seeded via app layer:', seededCount);

  /* ── вход учеником → сегодня с карточкой размещения ── */
  await type('#loginName', 'finstudent');
  await type('#loginPass', 'pass1');
  await click('#loginBtn');
  await sleep(2500);
  const today = await p.evaluate(() => ({
    placement: document.body.innerText.includes('Вводное тестирование не пройдено'),
    trainerTab: [...document.querySelectorAll('.tabbar__item')].some(t => t.textContent.includes('Тренажёр')),
  }));
  console.log('student today:', JSON.stringify(today));
  await shot('fin-01-today.png');

  /* ── размещение ── */
  await click('a[href="#/trainer"]');
  await sleep(1200);
  await click('a[href="#/trainer/placement/run"]');
  await sleep(900);
  for (let i = 0; i < 150; i++) {
    const st = await p.evaluate(() => {
      const opts = [...document.querySelectorAll('[data-popt]:not([disabled])')];
      if (opts.length) { opts[Math.floor(Math.random() * opts.length)].click(); return 'answered'; }
      const nxt = document.querySelector('#pNext');
      if (nxt) { nxt.click(); return 'next'; }
      return 'done';
    });
    if (st === 'done') break;
    await sleep(st === 'answered' ? 35 : 60);
  }
  await sleep(2000);
  const pl = await p.evaluate(() => (document.querySelector('.result__verdict') || {}).textContent || null);
  console.log('placement:', pl);
  await shot('fin-02-placement.png');

  /* ── практика a1: 22 вопроса ── */
  await click('a[href="#/trainer"]');
  await sleep(1200);
  await click('a[href="#/trainer/topic/a1/practice"]');
  await sleep(900);
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
  await sleep(1500);
  const practice = await p.evaluate(() => (document.querySelector('.result__verdict') || {}).textContent || null);
  console.log('practice:', practice);

  /* ── данные в Supabase ── */
  const masteryRows = await p.evaluate(async () => {
    const r = await fetch(window.CONFIG.SUPABASE_URL + '/rest/v1/mastery?student_id=eq.' + window.DB.session(), {
      headers: { apikey: window.CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + window.CONFIG.SUPABASE_ANON_KEY },
    });
    return (await r.json()).length;
  });
  console.log('mastery rows in supabase:', masteryRows);

  /* ── учитель: маршрут + тариф ── */
  await p.evaluate(() => { location.hash = '#/settings'; });
  await sleep(800);
  await click('#logoutBtn2');
  await sleep(1200);
  await type('#loginName', 'finteacher');
  await type('#loginPass', 'pass2');
  await click('#loginBtn');
  await sleep(2500);
  await p.evaluate(() => { location.hash = '#/students'; });
  await sleep(1500);
  await click('a[href*="#/route/"]');
  await sleep(1800);
  await p.evaluate(() => document.getElementById('plSave').click());
  await sleep(1500);
  await click('#approvePlan');
  await sleep(1500);
  const approved = await p.evaluate(() => document.body.innerText.includes('Маршрут утверждён'));
  console.log('teacher: route approved + plan saved:', approved);
  await shot('fin-03-teacher-route.png');

  /* ── заявка с лендинга (отдельная вкладка) ── */
  const p2 = await b.newPage();
  await p2.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p2.setViewport({ width: 1280, height: 900 });
  await p2.goto(LANDING, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(3000);
  await p2.evaluate(() => document.querySelector('#apply').scrollIntoView());
  await sleep(1000);
  await p2.evaluate(() => {
    const set = (s, v) => { const el = document.querySelector(s); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#fName', 'Финал Тест');
    set('#fContact', '@fin_test');
  });
  await p2.evaluate(() => document.querySelector('#submitBtn').click());
  await sleep(4000);
  const leadOk = await p2.evaluate(() => !document.getElementById('formSuccess').hidden);
  console.log('lead form success shown:', leadOk);

  /* админ-экран заявок видит записи? — проверяем через REST */
  const leadCount = await p.evaluate(async () => {
    const r = await fetch(window.CONFIG.SUPABASE_URL + '/rest/v1/leads?contact=eq.@fin_test', {
      headers: { apikey: window.CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + window.CONFIG.SUPABASE_ANON_KEY },
    });
    return (await r.json()).length;
  });
  console.log('lead rows:', leadCount);
  await shot('fin-04-lead.png');

  console.log('---- errors:', errors.length ? '\n' + errors.join('\n') : 'none');
  await b.close();
  await cleanup();
  console.log('cleanup done');
})().catch(async (e) => { console.error('FAIL:', e.message); await cleanup(); process.exit(1); });
