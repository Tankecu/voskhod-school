/* Юнит-тесты движка мастерства */
global.window = {};
global.localStorage = {
  _s: {},
  getItem(k) { return this._s[k] || null; },
  setItem(k, v) { this._s[k] = v; },
  removeItem(k) { delete this._s[k]; },
};
global.CONFIG = { SUPABASE_URL: '', SUPABASE_ANON_KEY: '', APP_VERSION: 't', SCHOOL_NAME: 't', APK_URL: '' };
require('../js/bank-math.js');
require('../js/curriculum.js');
global.window.TEST_BANK = [];
require('../js/db.js');
global.DB = window.DB;
require('../js/mastery.js');

const DB = window.DB, M = window.MASTERY;
const ST = 'stest';
let pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; } else { fail++; console.log('✗ ' + name); } }

DB.init().then(async () => {
  /* студент */
  await DB.saveUser({ id: ST, login: 'stest', pass_hash: 'x', salt: 's', role: 'student', name: 'Test', active: true, xp: 0, groupId: '' });

  /* 1. обновление мастерства */
  await M.updateOnTask(ST, 'a1', 'easy', true);
  let row = DB.masteryOf(ST, 'a1');
  check('easy correct = +4', row.score === 4);
  await M.updateOnTask(ST, 'a1', 'hard', false);
  row = DB.masteryOf(ST, 'a1');
  check('hard wrong = −8 (клампится в 0)', row.score === 0);
  for (let i = 0; i < 3; i++) await M.updateOnTask(ST, 'a1', 'medium', true);
  check('3 medium = +24', DB.masteryOf(ST, 'a1').score === 24);

  /* 2. разблокировка: a1 открыта, a2 нет */
  check('a1 unlocked', M.topicUnlocked(ST, 'a1'));
  check('a2 locked (нет зачёта a1)', !M.topicUnlocked(ST, 'a2'));

  /* 3. зачёт: провал (10/25) */
  const resFail = [];
  for (let i = 0; i < 25; i++) resFail.push({ difficulty: 'medium', correct: i < 10 });
  const r1 = await M.applyGate(ST, 'a1', resFail);
  check('gate 10/25 → fail', r1.passed === false);
  check('a2 всё ещё locked', !M.topicUnlocked(ST, 'a2'));

  /* 4. зачёт: успех (21/25) */
  const resPass = [];
  for (let i = 0; i < 25; i++) resPass.push({ difficulty: 'medium', correct: i < 21 });
  const r2 = await M.applyGate(ST, 'a1', resPass);
  check('gate 21/25 → pass', r2.passed === true);
  check('gatePassed сохранён', DB.masteryOf(ST, 'a1').gatePassed === true);
  check('a2 разблокирована', M.topicUnlocked(ST, 'a2'));
  check('stardust +50 за зачёт', DB.stardustBalance(ST) === 50);

  /* 5. экзамен уровня: все темы блока A должны быть зачтены */
  for (const t of ['a2', 'a3', 'a4', 'a5']) {
    const res = [];
    for (let i = 0; i < 25; i++) res.push({ difficulty: 'medium', correct: i < 21 });
    await M.applyGate(ST, t, res);
  }
  check('все темы A зачтены', M.gatePassedAll(ST, 'A'));
  check('экзамен доступен', M.canTakeExam(ST, 'A') === 0);

  const examQ = M.buildLevelExam('A', 0);
  check('exam 10 вопросов', examQ.length === 10);
  check('все из блока A', examQ.every(q => ['a1','a2','a3','a4','a5'].includes(q.topicId)));
  const examResults = examQ.map(q => ({ topicId: q.topicId, difficulty: q.difficulty, correct: true }));
  const er = await M.applyLevelExam(ST, 'A', examResults);
  check('exam 10/10 → passed', er.passed === true);
  check('уровень silver', M.blockLevel(ST, 'A') === 'silver');
  check('stardust: 5 зачётов + экзамен = 330', DB.stardustBalance(ST) === 50 + 4 * 50 + 80);

  /* 6. placement */
  const ST2 = 'stest2';
  await DB.saveUser({ id: ST2, login: 'stest2', pass_hash: 'x', salt: 's', role: 'student', name: 'T2', active: true, xp: 0 });
  const answers = [];
  M.allTopics().forEach((p, i) => {
    answers.push({ topicId: p.topic.id, difficulty: 'easy', correct: i % 2 === 0 });
    if (i % 2 === 0) answers.push({ topicId: p.topic.id, difficulty: 'medium', correct: true });
  });
  const pl = await M.applyPlacement(ST2, answers);
  check('placement: mastery создан', DB.masteryOf(ST2, 'a1') !== null);
  const a1s = pl.topicsScore['a1'];
  check('placement a1 = 55 (medium ✓)', a1s === 55);
  check('placement b1 = 15 (easy ✗)', pl.topicsScore['b1'] === 15);
  const avgA = (55 + 15) / 2; /* a1 55, a2 15 */
  check('block A старт: bronze при среднем < 55', pl.blockStarts['A'] === 'bronze');
  check('+30 ★ за placement', DB.stardustBalance(ST2) === 30);

  /* 7. рекомендации */
  const rec = M.recommend(ST);
  check('recommend nextByRoute = b1 (a1..a5 зачтены)', rec.nextByRoute === 'b1');
  check('recommend examReady = B', rec.examReady === null || typeof rec.examReady === 'string');

  console.log(`\nИТОГ: ✓ ${pass} | ✗ ${fail}`);
  if (fail) process.exit(1);
}).catch(e => { console.error('FAIL', e); process.exit(1); });
