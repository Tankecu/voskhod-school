const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'https://tankecu.github.io/voskhod-school/app/';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' };
const U = 'upldebug';
(async () => {
  await fetch(SB + 'users', {
    method: 'POST', headers: H,
    body: JSON.stringify([{ id: U, login: 'pldebug', pass_hash: crypto.createHash('sha256').update('fin:pp').digest('hex'), salt: 'fin', role: 'student', name: 'PL Debug', active: true, xp: 0 }]),
  });
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  p.on('pageerror', e => console.log('PAGEERROR:', e.message));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await p.setViewport({ width: 390, height: 844, isMobile: true });
  await p.goto(APP, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('#loginName', { timeout: 30000 });
  await p.evaluate(() => {
    const s = (s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    s('#loginName', 'pldebug');
    s('#loginPass', 'pp');
  });
  await p.evaluate(() => document.querySelector('#loginBtn').click());
  await sleep(2200);
  await p.evaluate(() => { location.hash = '#/trainer/placement/run'; });
  await sleep(900);

  /* отвечаем на 8 вопросов всегда «первый вариант» */
  for (let i = 0; i < 8; i++) {
    const hasQ = await p.evaluate(() => !!document.querySelector('[data-popt]'));
    if (!hasQ) { console.log('нет вопроса на шаге', i); break; }
    await p.evaluate(() => {
      const btns = [...document.querySelectorAll('[data-popt]')];
      btns[0].click();
    });
    await sleep(50);
    await p.evaluate(() => document.querySelector('#pNext').click());
    await sleep(60);
  }
  await sleep(800);
  const dump = await p.evaluate(async () => {
    const uid = window.DB.session();
    const local = window.DB.masteryFor(uid).map(m => ({ t: m.topicId, s: m.score, id: m.id }));
    const r = await fetch(window.CONFIG.SUPABASE_URL + '/rest/v1/mastery?student_id=eq.' + uid, {
      headers: { apikey: window.CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + window.CONFIG.SUPABASE_ANON_KEY },
    });
    const remote = await r.json();
    return {
      localRows: local.length,
      remoteRows: remote.length,
      remoteTopics: [...new Set(remote.map(m => m.topic_id))].length,
      remoteIds: [...new Set(remote.map(m => m.id))].length,
      answersLen: undefined,
      hash: location.hash,
    };
  });
  console.log(JSON.stringify(dump, null, 1));
  const answersLen = await p.evaluate(() => document.body.innerText.slice(0, 60).replace(/\n/g, ' | '));
  console.log('screen:', answersLen);
  await b.close();
  await fetch(SB + 'mastery?student_id=eq.' + U, { method: 'DELETE', headers: H });
  await fetch(SB + 'placement?student_id=eq.' + U, { method: 'DELETE', headers: H });
  await fetch(SB + 'block_state?student_id=eq.' + U, { method: 'DELETE', headers: H });
  await fetch(SB + 'users?id=eq.' + U, { method: 'DELETE', headers: H });
  console.log('cleanup done');
})().catch(e => console.error('FAIL', e.message));
