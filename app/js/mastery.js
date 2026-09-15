/* ═══════════════════════════════════════════════════════════
   VOSKHOD — движок мастерства.
   Мастерство темы 1–100 (скрыто от ученика): верно на
   hard +12 / medium +8 / easy +4, ошибка −8/−5/−2.
   Зачёт темы: 25 задач (5/8/12), сдать ≥21.
   Уровни блока: bronze → silver → gold → platinum через
   экзамены возрастающей сложности.
   ═══════════════════════════════════════════════════════════ */

window.MASTERY = (function () {
  'use strict';

  var DELTA = {
    correct: { easy: 4, medium: 8, hard: 12 },
    wrong: { easy: -2, medium: -5, hard: -8 },
  };
  var LEVELS = ['bronze', 'silver', 'gold', 'platinum'];
  var LEVEL_RU = { bronze: 'Бронза', silver: 'Серебро', gold: 'Золото', platinum: 'Платина' };
  var LEVEL_ICON = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };
  var GATE = { total: 25, pass: 21, mix: { easy: 5, medium: 8, hard: 12 } };
  var PRACTICE = { easy: 5, medium: 7, hard: 10 };
  /* переходы: 0→1, 1→2, 2→3 */
  var EXAMS = [
    { count: 10, pass: 0.6, reward: 80, diff: ['medium'] },
    { count: 12, pass: 0.7, reward: 120, diff: ['medium', 'hard'] },
    { count: 15, pass: 0.8, reward: 160, diff: ['hard'] },
  ];
  var INIT_SCORE = { none: 15, easy: 35, medium: 55, hard: 75 };

  /* ── служебные ── */

  function topicById(id) {
    var found = null;
    window.CURRICULUM_ALL.allBlocks().forEach(function (b) {
      b.topics.forEach(function (t) { if (t.id === id) found = t; });
    });
    return found;
  }
  function blockById(id) {
    var found = null;
    window.CURRICULUM_ALL.allBlocks().forEach(function (b) { if (b.id === id) found = b; });
    return found;
  }
  function allTopics() {
    var out = [];
    window.CURRICULUM_ALL.allBlocks().forEach(function (b) {
      b.topics.forEach(function (t) { out.push({ block: b, topic: t }); });
    });
    return out;
  }
  function blockIndex(blockId) {
    return window.CURRICULUM_ALL.allBlocks().findIndex(function (b) { return b.id === blockId; });
  }
  function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }

  /* ── мастерство ── */

  function ensureRow(studentId, topicId) {
    var row = DB.masteryOf(studentId, topicId);
    if (row) return row;
    return {
      id: DB.newId('m'), studentId: studentId, topicId: topicId,
      score: 0, attempts: 0, correct: 0,
      gatePassed: false, gateAttempts: 0, gateBest: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  function updateOnTask(studentId, topicId, difficulty, correct) {
    var row = DB.masteryOf(studentId, topicId) || ensureRow(studentId, topicId);
    var delta = correct ? DELTA.correct[difficulty] : DELTA.wrong[difficulty];
    row.score = clamp((row.score || 0) + delta);
    row.attempts = (row.attempts || 0) + 1;
    if (correct) row.correct = (row.correct || 0) + 1;
    row.updatedAt = new Date().toISOString();
    return DB.saveMastery(row).then(function () { return row; });
  }

  function applySession(studentId, topicId, results) {
    var chain = Promise.resolve();
    results.forEach(function (r) {
      chain = chain.then(function () {
        return updateOnTask(studentId, topicId, r.difficulty, r.correct);
      });
    });
    return chain;
  }

  /* ── зачёт темы ── */

  function applyGate(studentId, topicId, results) {
    var correct = results.filter(function (r) { return r.correct; }).length;
    var row = DB.masteryOf(studentId, topicId) || ensureRow(studentId, topicId);
    row.gateAttempts = (row.gateAttempts || 0) + 1;
    row.gateBest = Math.max(row.gateBest || 0, correct);
    var firstPass = false;
    if (correct >= GATE.pass && !row.gatePassed) {
      row.gatePassed = true;
      firstPass = true;
    }
    row.updatedAt = new Date().toISOString();
    return DB.saveMastery(row).then(function () {
      var chain = applySession(studentId, topicId, results);
      var rewards = Promise.resolve();
      if (firstPass) {
        rewards = DB.addStardust(studentId, 50, 'Зачёт темы: ' + topicId);
        chain = chain.then(function () { return DB.addXp(studentId, 25); });
      }
      return Promise.all([chain, rewards]).then(function () {
        return { passed: correct >= GATE.pass, correct: correct, firstPass: firstPass };
      });
    });
  }

  /* ── блоки ── */

  function blockTopics(blockId) {
    var b = blockById(blockId);
    return b ? b.topics : [];
  }

  function blockScore(studentId, blockId) {
    var topics = blockTopics(blockId);
    var sum = 0;
    topics.forEach(function (t) {
      var row = DB.masteryOf(studentId, t.id);
      sum += row ? (row.score || 0) : 0;
    });
    return Math.round(sum / Math.max(1, topics.length));
  }

  function blockLevel(studentId, blockId) {
    var b = DB.blockStateOf(studentId, blockId);
    return b ? b.level : 'bronze';
  }

  function gatePassedAll(studentId, blockId) {
    return blockTopics(blockId).every(function (t) {
      var row = DB.masteryOf(studentId, t.id);
      return row && row.gatePassed;
    });
  }

  function canTakeExam(studentId, blockId) {
    var levelIdx = LEVELS.indexOf(blockLevel(studentId, blockId));
    if (levelIdx >= LEVELS.length - 1) return null; /* платина — вершина */
    return gatePassedAll(studentId, blockId) ? levelIdx : null;
  }

  function applyLevelExam(studentId, blockId, results) {
    var levelIdx = LEVELS.indexOf(blockLevel(studentId, blockId));
    var spec = EXAMS[levelIdx];
    if (!spec) return Promise.resolve({ passed: false });
    var correct = results.filter(function (r) { return r.correct; }).length;
    var passed = correct / results.length >= spec.pass;

    var chain = Promise.resolve();
    results.forEach(function (r) {
      chain = chain.then(function () {
        return updateOnTask(studentId, r.topicId, r.difficulty, r.correct);
      });
    });

    if (!passed) return chain.then(function () { return { passed: false, correct: correct }; });

    var b = DB.blockStateOf(studentId, blockId) || {
      id: DB.newId('bl'), studentId: studentId, blockId: blockId,
      level: 'bronze', score: 0, exams: [],
    };
    b.level = LEVELS[levelIdx + 1];
    b.score = blockScore(studentId, blockId);
    b.exams = (b.exams || []).concat([{ from: LEVELS[levelIdx], to: b.level, date: DB.todayIso() }]);
    b.updatedAt = new Date().toISOString();

    return Promise.all([
      chain,
      DB.saveBlockState(b),
      DB.addStardust(studentId, spec.reward, 'Экзамен ' + LEVEL_RU[LEVELS[levelIdx]] + ' → ' + LEVEL_RU[b.level]),
      DB.addXp(studentId, 40),
    ]).then(function () {
      return { passed: true, correct: correct, newLevel: b.level, reward: spec.reward };
    });
  }

  /* ── размещение (placement) ── */

  function buildPlacementQueue() {
    /* по каждой теме: easy → (верно) medium → (верно) hard */
    var queue = [];
    allTopics().forEach(function (pair) {
      queue.push({ topicId: pair.topic.id, difficulty: 'easy' });
    });
    return queue; /* runner сам эскалирует по ответам */
  }

  function applyPlacement(studentId, answers) {
    /* answers: [{topicId, difficulty, correct}] — вся история ответов */
    var perTopic = {};
    answers.forEach(function (a) {
      var t = perTopic[a.topicId] = perTopic[a.topicId] || { lastCorrect: null, anyCorrect: false, count: 0 };
      t.count++;
      if (a.correct) {
        t.lastCorrect = a.difficulty;
        t.anyCorrect = true;
      }
    });

    var topicsScore = {}, chain = Promise.resolve();
    Object.keys(perTopic).forEach(function (topicId) {
      var info = perTopic[topicId];
      var score = INIT_SCORE[info.lastCorrect || 'none'];
      if (info.lastCorrect === 'hard') score = INIT_SCORE.hard;
      topicsScore[topicId] = score;
      var row = DB.masteryOf(studentId, topicId) || ensureRow(studentId, topicId);
      row.score = score;
      row.attempts = info.count;
      row.correct = info.anyCorrect ? row.correct || 1 : 0;
      row.updatedAt = new Date().toISOString();
      chain = chain.then(function () { return DB.saveMastery(row); });
    });

    /* темы без вопросов (не дошли) — минимальный старт */
    allTopics().forEach(function (pair) {
      if (!topicsScore[pair.topic.id]) {
        topicsScore[pair.topic.id] = INIT_SCORE.none;
        var row = DB.masteryOf(studentId, pair.topic.id) || ensureRow(studentId, pair.topic.id);
        row.score = INIT_SCORE.none;
        chain = chain.then(function () { return DB.saveMastery(row); });
      }
    });

    /* стартовые уровни блоков: среднее ≥ 55 → сразу серебро */
    var blockStarts = {};
    window.CURRICULUM_ALL.allBlocks().forEach(function (b) {
      var sum = 0;
      b.topics.forEach(function (t) { sum += topicsScore[t.id] || 0; });
      var avg = sum / b.topics.length;
      var level = avg >= 55 ? 'silver' : 'bronze';
      blockStarts[b.id] = level;
      var bs = DB.blockStateOf(studentId, b.id) || {
        id: DB.newId('bl'), studentId: studentId, blockId: b.id,
        level: 'bronze', score: 0, exams: [],
      };
      bs.level = level;
      bs.score = Math.round(avg);
      bs.updatedAt = new Date().toISOString();
      chain = chain.then(function () { return DB.saveBlockState(bs); });
    });

    var placementRow = {
      id: DB.newId('pl'), studentId: studentId, date: DB.todayIso(),
      answers: answers, topics: topicsScore, blockStarts: blockStarts,
    };

    return Promise.all([
      chain,
      DB.savePlacement(placementRow),
      DB.addStardust(studentId, 30, 'Вводное тестирование пройдено'),
    ]).then(function () {
      return { topicsScore: topicsScore, blockStarts: blockStarts };
    });
  }

  /* ── рекомендации ── */

  function recommend(studentId) {
    var routeTopic = null, weakest = null;
    allTopics().forEach(function (pair) {
      var row = DB.masteryOf(studentId, pair.topic.id);
      var gated = row && row.gatePassed;
      if (!routeTopic && !gated) routeTopic = pair.topic.id;
      if (gated && (weakest === null || (row.score || 0) < (DB.masteryOf(studentId, weakest) || { score: 100 }).score)) {
        weakest = pair.topic.id;
      }
    });
    var examReady = null;
    window.CURRICULUM_ALL.allBlocks().forEach(function (b) {
      if (canTakeExam(studentId, b.id) !== null) examReady = b.id;
    });
    return { nextByRoute: routeTopic, weakest: weakest, examReady: examReady };
  }

  /* тема открыта? (первая всегда; остальные — после зачёта предыдущей) */
  function topicUnlocked(studentId, topicId) {
    var flat = allTopics();
    for (var i = 0; i < flat.length; i++) {
      if (flat[i].topic.id === topicId) {
        if (i === 0) return true;
        var prev = DB.masteryOf(studentId, flat[i - 1].topic.id);
        return !!(prev && prev.gatePassed);
      }
    }
    return false;
  }

  /* ── сборка сессий ── */

  function buildPractice(topicId) {
    return window.BANK_MATH.draw(topicId, 'easy', PRACTICE.easy)
      .concat(window.BANK_MATH.draw(topicId, 'medium', PRACTICE.medium))
      .concat(window.BANK_MATH.draw(topicId, 'hard', PRACTICE.hard));
  }

  function buildGate(topicId) {
    return window.BANK_MATH.draw(topicId, 'easy', GATE.mix.easy)
      .concat(window.BANK_MATH.draw(topicId, 'medium', GATE.mix.medium))
      .concat(window.BANK_MATH.draw(topicId, 'hard', GATE.mix.hard));
  }

  function buildLevelExam(blockId, levelIdx) {
    var spec = EXAMS[levelIdx];
    var topics = blockTopics(blockId).map(function (t) { return t.id; });
    var out = [], i = 0;
    for (var n = 0; n < spec.count; n++) {
      var topicId = topics[n % topics.length];
      var d = spec.diff[n % spec.diff.length];
      var q = window.BANK_MATH.draw(topicId, d, 1)[0];
      if (q) { q.topicId = topicId; out.push(q); }
      i++;
    }
    return out;
  }

  return {
    DELTA: DELTA, LEVELS: LEVELS, LEVEL_RU: LEVEL_RU, LEVEL_ICON: LEVEL_ICON,
    GATE: GATE, PRACTICE: PRACTICE, EXAMS: EXAMS, INIT_SCORE: INIT_SCORE,
    topicById: topicById, blockById: blockById, allTopics: allTopics,
    updateOnTask: updateOnTask, applySession: applySession, applyGate: applyGate,
    blockScore: blockScore, blockLevel: blockLevel, gatePassedAll: gatePassedAll,
    canTakeExam: canTakeExam, applyLevelExam: applyLevelExam,
    buildPlacementQueue: buildPlacementQueue, applyPlacement: applyPlacement,
    recommend: recommend, topicUnlocked: topicUnlocked,
    buildPractice: buildPractice, buildGate: buildGate, buildLevelExam: buildLevelExam,
  };
})();
