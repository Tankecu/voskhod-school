/* e2e комнаты: хост + ученик, фейковые камера/микрофон, чат, доска */
const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP = 'http://localhost:8091/';
const SB = 'https://dtbwwqpjjplpzmscgblq.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Ynd3cXBqanBscHptc2NnYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDQzMzgsImV4cCI6MjEwNDg4MDMzOH0.UFUYkGe3WCS1FibMOTH4-tQBu3ZW84pTgkwCicPn_G8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' };
const SALT = 'r';
const errors = [];
const LESSON_ID = 'l-roome2e';
const T_ID = 'uroome2e', S_ID = 'sroome2e';
const mkHash = (pass) => crypto.createHash('sha256').update(SALT + ':' + pass).digest('hex');
const today = new Date();
const iso = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
const hhmm = () => {
  const d = new Date(Date.now() + 30 * 60000);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

async function cleanup() {
  await fetch(SB + 'lessons?id=eq.' + LESSON_ID, { method: 'DELETE', headers: H });
  await fetch(SB + 'groups?id=eq.g-roome2e', { method: 'DELETE', headers: H });
  await fetch(SB + 'users?id=in.(' + T_ID + ',' + S_ID + ')', { method: 'DELETE', headers: H });
}

(async () => {
  await cleanup();
  const s3 = await fetch(SB + 'groups', {
    method: 'POST', headers: H,
    body: JSON.stringify([{ id: 'g-roome2e', name: 'Room E2E', teacher_ids: [T_ID], student_ids: [S_ID] }]),
  });
  console.log('seed group:', s3.status);
  const s1 = await fetch(SB + 'users', {
    method: 'POST', headers: H,
    body: JSON.stringify({ id: T_ID, login: 'roome2et', pass_hash: mkHash('pt'), salt: SALT, role: 'teacher', name: 'Хост Учитель', active: true, xp: 0, subject: 'SAT Math' }),
  });
  console.log('seed teacher:', s1.status);
  const s2 = await fetch(SB + 'users', {
    method: 'POST', headers: H,
    body: JSON.stringify({ id: S_ID, login: 'roome2es', pass_hash: mkHash('ps'), salt: SALT, role: 'student', name: 'Гость Ученик', active: true, xp: 0, group_id: 'g-roome2e' }),
  });
  console.log('seed student:', s2.status);
  const s4 = await fetch(SB + 'lessons', {
    method: 'POST', headers: H,
    body: JSON.stringify([{
      id: LESSON_ID, group_id: 'g-roome2e', teacher_id: T_ID,
      subject: 'SAT Math', topic: 'Пробный урок E2E', date: iso,
      start_time: hhmm(), dur_min: 60,
      room: 'https://meet.google.com/xxx', materials: [],
    }]),
  });
  console.log('seed lesson:', s4.status);
  console.log('seeded: users + group + lesson');

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader',
      '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
  });
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function makePage() {
    const p = await browser.newPage();
    await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    p.on('pageerror', e => errors.push(e.message));
    return p;
  }

  async function loginAndOpenRoom(p, login, pass) {
    await p.goto(APP, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.waitForSelector('#loginName', { timeout: 20000 });
    await p.evaluate((l, pw) => {
      const s = (s2, v) => { const el = document.querySelector(s2); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
      s('#loginName', l);
      s('#loginPass', pw);
    }, login, pass);
    await p.evaluate(() => document.querySelector('#loginBtn').click());
    await sleep(2000);
    const loginState = await p.evaluate(() => ({
      hash: location.hash,
      err: (document.getElementById('loginErr') || {}).textContent || null,
      usersSeen: window.DB.allUsers().length,
    }));
    console.log('login [' + login + ']:', JSON.stringify(loginState));
    await p.evaluate((lid) => { location.hash = '#/room/' + lid; }, LESSON_ID);
    await sleep(1500);
    const roomState = await p.evaluate(() => ({
      hash: location.hash,
      room: !!document.querySelector('.room'),
      roomDefined: typeof window.Room,
      lessonInState: !!(window.DB.lesson('l-roome2e')),
      lessonsInState: window.DB.lessonsFor(window.DB.currentUser()).map(l => l.id),
      roomStateText: (document.getElementById('roomState') || {}).textContent || null,
      snippet: document.body.innerText.slice(0, 90),
    }));
    console.log('room nav:', JSON.stringify(roomState));
  }

  /* ── хост (преподаватель) ── */
  const host = await makePage();
  await host.setViewport({ width: 1280, height: 800 });
  await loginAndOpenRoom(host, 'roome2et', 'pt');
  const hostState = await host.evaluate(() => ({
    isRoom: !!document.querySelector('.room'),
    state: (document.getElementById('roomState') || {}).textContent || null,
    mic: !!document.getElementById('ctlMic'),
  }));
  console.log('host:', JSON.stringify(hostState));

  /* микрофон/камера: fake device → стрим должен прийти */
  await host.evaluate(() => document.querySelector('#ctlMic').click()); /* вкл/выкл mic */
  await host.evaluate(() => document.querySelector('#ctlMic').click());

  /* ── ученик подключается ── */
  const student = await makePage();
  await student.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await loginAndOpenRoom(student, 'roome2es', 'ps');
  await sleep(3500); /* ждём PeerJS-хендшейк */

  const hostAfter = await host.evaluate(() => ({
    state: (document.getElementById('roomState') || {}).textContent || null,
    peers: (document.getElementById('roomPeers') || {}).textContent || null,
    remoteVideo: !!document.querySelector('#tileRemoteWrap video'),
    remoteHasStream: (() => { const v = document.querySelector('#tileRemoteWrap video'); return !!(v && v.srcObject); })(),
  }));
  console.log('host after student join:', JSON.stringify(hostAfter));
  await host.screenshot({ path: 'D:\\rep\\voskhod\\app-shots\\room-01-host.png' });

  /* чат: ученик пишет, хост видит */
  await student.evaluate(() => {
    const i = document.querySelector('#chatInput');
    i.value = 'привет, проверка связи';
    document.querySelector('#chatForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await sleep(1200);
  const hostChat = await host.evaluate(() => ({
    delivered: (window.__roomSt || { chat: [] }).chat.some(m => m.text === 'привет, проверка связи'),
  }));
  console.log('chat student→host:', JSON.stringify(hostChat));

  /* доска: хост рисует штрих, ученик получает */
  await host.evaluate(() => document.querySelector('#ctlBoard').click());
  await sleep(400);
  await host.evaluate(() => {
    const c = document.getElementById('boardCanvas');
    const r = c.getBoundingClientRect();
    const opts = { bubbles: true, clientX: r.left + 50, clientY: r.top + 50 };
    c.dispatchEvent(new PointerEvent('pointerdown', opts));
    const opts2 = { bubbles: true, clientX: r.left + 200, clientY: r.top + 150 };
    c.dispatchEvent(new PointerEvent('pointermove', opts2));
    window.dispatchEvent(new PointerEvent('pointerup', {}));
  });
  await sleep(900);
  const studentBoard = await student.evaluate(() => ({
    boardShown: document.getElementById('roomBoard') && document.getElementById('roomBoard').style.display !== 'none',
    strokesReceived: (window.__roomSt || { strokes: [] }).strokes.length,
  }));
  /* проверяем, что штрих дошёл: включаем доску у ученика и считаем отрисовку */
  await student.evaluate(() => document.querySelector('#ctlBoard').click());
  await sleep(500);
  const strokeOk = await student.evaluate(() => {
    const strokes = (window.__roomSt || { strokes: [] }).strokes.length;
    const c = document.getElementById('boardCanvas');
    let painted = false;
    if (c) {
      const ctx = c.getContext('2d');
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 40 && data[i + 1] > 40) { painted = true; break; } /* не фон #14102A */
      }
    }
    return { strokes: strokes, painted: painted };
  });
  console.log('board student-side:', JSON.stringify(strokeOk));
  await student.screenshot({ path: 'D:\\rep\\voskhod\\app-shots\\room-02-student.png' });

  /* чат хост→ученик */
  await host.evaluate(() => {
    const i = document.getElementById('chatInput');
    if (i) { i.value = 'домашка на завтра'; document.querySelector('#chatForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
  });
  await sleep(1200);
  const studentChat = await student.evaluate(() => ({
    inStrokesState: (window.__roomSt || { chat: [] }).chat.some(m => m.text === 'домашка на завтра'),
  }));
  console.log('chat host→student:', JSON.stringify(studentChat));

  console.log('---- errors:', errors.length ? '\n' + errors.join('\n') : 'none');
  await browser.close();
  await cleanup();
  console.log('cleanup done');
})().catch(async (e) => { console.error('FAIL:', e.message); await cleanup(); process.exit(1); });
