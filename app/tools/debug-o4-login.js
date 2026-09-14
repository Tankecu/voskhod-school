const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const mkHash = (pass) => crypto.createHash('sha256').update('o4:' + pass).digest('hex');
(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader'],
  });
  const p = await b.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('C: ' + m.text().slice(0, 90)); });
  await p.setViewport({ width: 390, height: 844, isMobile: true });
  await p.evaluateOnNewDocument((seedJson) => {
    Object.defineProperty(window, 'CONFIG', {
      value: { SUPABASE_URL: '', SUPABASE_ANON_KEY: '', APP_VERSION: 'test', APK_URL: '', SCHOOL_NAME: 'VOSKHOD' },
      writable: false, configurable: false,
    });
    localStorage.setItem('vo-db-v2', seedJson);
  }, JSON.stringify({
    users: [
      { id: 'u1', login: 's1', passHash: mkHash('p1'), salt: 'o4', role: 'student', name: 'Студент', active: true, xp: 0, groupId: '' },
      { id: 'u2', login: 't1', passHash: mkHash('p2'), salt: 'o4', role: 'teacher', name: 'Препод', active: true, xp: 0, rate: 10, subject: 'SAT Math' },
    ],
    groups: [], lessons: [], homework: [], payments: [], attempts: [], custom_tests: [],
    mock_results: [], leads: [], mastery: [], block_state: [], placement: [], plans_study: [], stardust: [], student_plans: [],
  }));
  await p.goto('http://localhost:8091/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  const s1 = await p.evaluate(() => ({
    loginForm: !!document.querySelector('#loginName'),
    adapter: window.DB ? window.DB.adapterName() : null,
    users: window.DB ? window.DB.allUsers().length : -1,
    needsSetup: window.DB ? window.DB.needsSetup() : null,
  }));
  console.log('before login:', JSON.stringify(s1));
  await p.evaluate(() => {
    const s = (s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    s('#loginName', 's1');
    s('#loginPass', 'p1');
  });
  await p.evaluate(() => document.querySelector('#loginBtn').click());
  await new Promise(r => setTimeout(r, 2000));
  const s2 = await p.evaluate(() => ({
    hash: location.hash,
    placementCard: document.body.innerText.includes('Вводное тестирование'),
    trainerTab: document.body.innerText.includes('Тренажёр'),
    bodySnippet: document.body.innerText.slice(0, 120).replace(/\n/g, ' | '),
  }));
  console.log('after login:', JSON.stringify(s2, null, 1));
  console.log('errors:', errs.join(' | ') || 'none');
  await b.close();
})().catch(e => console.error('FAIL', e.message));
