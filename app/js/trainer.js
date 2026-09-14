/* ═══════════════════════════════════════════════════════════
   VOSKHOD — тренажёр: карта блоков, практика 5/7/10, зачёт
   25 задач, экзамены уровней, вводное тестирование.
   ═══════════════════════════════════════════════════════════ */

window.Trainer = (function () {
  'use strict';

  var esc = UI.esc, ic = UI.ic, toast = UI.toast;

  function emptyBox(icon, title, text) {
    return '<div class="empty">' + ic(icon) + '<b>' + esc(title) + '</b><p>' + esc(text) + '</p></div>';
  }

  /* ═══════════ ГЛАВНЫЙ ЭКРАН ═══════════ */

  function renderTrainer(root, user) {
    var placement = DB.placementOf(user.id);
    if (!placement) { renderPlacementIntro(root, user); return; }

    var balance = DB.stardustBalance(user.id);
    var plan = DB.planStudyOf(user.id);

    var blocksHtml = window.CURRICULUM.blocks.map(function (b) {
      var level = MASTERY.blockLevel(user.id, b.id);
      var meta = MASTERY.LEVEL_ICON[level] + ' ' + MASTERY.LEVEL_RU[level];
      var allGated = MASTERY.gatePassedAll(user.id, b.id);
      var examIdx = MASTERY.canTakeExam(user.id, b.id);

      var topicsHtml = b.topics.map(function (t) {
        var row = DB.masteryOf(user.id, t.id);
        var passed = row && row.gatePassed;
        var unlocked = MASTERY.topicUnlocked(user.id, t.id);
        var best = row ? row.gateBest || 0 : 0;
        var icon = passed ? '✔' : unlocked ? '▶' : '🔒';
        var cls = passed ? 'tr-topic is-passed' : unlocked ? 'tr-topic' : 'tr-topic is-locked';
        var actions = [];
        if (unlocked || passed) {
          actions.push('<a class="btn btn--ghost btn--sm" href="#/trainer/topic/' + t.id + '/practice">Практика</a>');
          if (!passed && unlocked) actions.push('<a class="btn btn--gold btn--sm" href="#/trainer/topic/' + t.id + '/gate">Зачёт</a>');
        }
        return '<div class="' + cls + '">' +
          '<span class="tr-topic__icon">' + icon + '</span>' +
          '<span class="tr-topic__name">' + esc(t.title) + '</span>' +
          (passed ? '<span class="chip chip--ion">зачёт ✓</span>'
            : row && best > 0 ? '<span class="chip">лучший ' + best + '/25</span>' : '') +
          '<span class="tr-topic__actions">' + actions.join('') + '</span>' +
          '</div>';
      }).join('');

      var examHtml = '';
      if (allGated) {
        examHtml = examIdx !== null
          ? '<a class="btn btn--gold btn--full" href="#/trainer/exam/' + b.id + '">' + ic('star') + ' Экзамен: ' +
            MASTERY.LEVEL_RU[MASTERY.LEVELS[examIdx]] + ' → ' + MASTERY.LEVEL_RU[MASTERY.LEVELS[examIdx + 1]] + '</a>'
          : '<div class="th-tip" style="margin:10px 0 2px">💎 Платина достигнута — вершина блока!</div>';
      }

      return '<div class="glass card" style="margin-bottom:14px">' +
        '<div class="tr-block__head">' +
          '<span class="card__icon">' + (b.icon || '∑') + '</span>' +
          '<div style="flex:1"><b>' + esc(b.title) + '</b><span style="display:block;font-size:12px;color:var(--dust)">' + esc(b.desc || '') + '</span></div>' +
          '<span class="chip chip--gold">' + meta + '</span>' +
        '</div>' +
        '<div class="tr-topics">' + topicsHtml + '</div>' + examHtml +
        '</div>';
    }).join('');

    root.innerHTML =
      '<div class="page-head"><p class="eyebrow">[ тренажёр · система обучения ]</p>' +
      '<div class="page-head__row"><h1>Тренажёр</h1>' +
      '<span class="chip chip--gold" style="font-size:13px">✦ ' + balance + ' звёздной пыли</span></div>' +
      '<p>Блоки → темы → зачёты → экзамены уровней. Прогресс виден тебе, цифры мастерства — системе и преподавателю</p></div>' +

      (plan && plan.status === 'approved'
        ? '<div class="th-tip" style="margin-bottom:14px">🧭 Твой маршрут утверждён преподавателем: ' +
          plan.topics.map(function (id) { var t = MASTERY.topicById(id); return t ? esc(t.title) : ''; }).join(' → ') + '</div>'
        : '') +

      blocksHtml +

      '<div class="stack" style="margin-top:20px">' +
        '<a class="login__card glass" href="#/tests">' + ic('clipboard') +
          '<span><b>Тренировочные тесты</b><i>полные варианты и тесты преподавателя</i></span>' +
          '<span class="login__go">' + ic('back') + '</span></a>' +
        '<a class="login__card glass" href="#/trainer/stardust">' + ic('star') +
          '<span><b>Звёздная пыль</b><i>как зарабатывается и на что тратится</i></span>' +
          '<span class="login__go">' + ic('back') + '</span></a>' +
      '</div>';
  }

  /* ═══════════ РАЗМЕЩЕНИЕ ═══════════ */

  function renderPlacementIntro(root, user) {
    var placement = DB.placementOf(user.id);
    if (placement) { renderTrainer(root, user); return; }

    root.innerHTML =
      '<div class="page-head"><p class="eyebrow">[ вводное тестирование ]</p><h1>Размещение</h1></div>' +
      '<div class="glass card" style="max-width:640px">' +
        '<p style="margin-bottom:12px">Тест охватывает <b>все 24 темы</b> SAT Math и определит твою стартовую точку: какие блоки даются легко, а где пробелы.</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">' +
          '<span class="chip">' + ic('clock') + ' ~25 минут</span>' +
          '<span class="chip">' + ic('clipboard') + ' 24–72 вопроса</span>' +
          '<span class="chip chip--ion">+30 ✦ за прохождение</span>' +
        '</div>' +
        '<p style="font-size:13.5px;color:var(--dust)">Задачи идут от простых к сложным. Отвечай честно — система построит личную траекторию, и учитель составит маршрут по её данным. Без таймера.</p>' +
        '<a class="btn btn--gold btn--full" href="#/trainer/placement/run" style="margin-top:14px">' + ic('play') + ' Начать размещение</a>' +
      '</div>';
  }

  function runPlacement(root, user) {
    var queue = MASTERY.buildPlacementQueue(); /* по 1 easy на тему */
    var st = { round: 0, idx: 0, answers: [], rounds: [['easy', queue], null, null], current: null };

    function nextQuestion() {
      var list = st.rounds[st.round][1];
      var difficulty = st.rounds[st.round][0];
      while (st.idx < list.length) {
        var item = list[st.idx];
        var q = window.BANK_MATH.draw(item.topicId, difficulty, 1)[0];
        if (q) { q.topicId = item.topicId; q.difficulty = difficulty; return q; }
        st.idx++;
      }
      return null;
    }

    function render() {
      var q = st.current;
      if (!q) { finish(); return; }
      var t = MASTERY.topicById(q.topicId);
      var keys = ['A', 'B', 'C', 'D'];
      root.innerHTML =
        '<div class="mock-shell">' +
          '<div class="mock-top"><div class="mock-top__title"><b>' + esc(t.title) + '</b>' +
          '<span>тема ' + (doneCount() + 1) + ' · сложность: ' + ({ easy: 'базовая', medium: 'средняя', hard: 'сложная' })[q.difficulty] + '</span></div></div>' +
          '<div class="qcard glass">' +
            '<p class="qcard__text">' + q.q + '</p>' +
            q.options.map(function (opt, i) {
              return '<button class="opt" data-popt="' + i + '"><span class="opt__key">' + keys[i] + '</span><span>' + opt + '</span></button>';
            }).join('') +
          '</div>' +
          '<div class="mock-nav"><button class="btn btn--gold btn--full" id="pNext" style="visibility:hidden">Далее →</button></div>' +
        '</div>';

      root.querySelectorAll('[data-popt]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = +btn.dataset.popt;
          var correct = i === q.correct;
          st.answers.push({ topicId: q.topicId, difficulty: q.difficulty, correct: correct });
          root.querySelectorAll('[data-popt]').forEach(function (b, bi) {
            b.disabled = true;
            if (bi === q.correct) b.classList.add('opt--right');
            else if (bi === i) b.classList.add('opt--wrong');
          });
          document.getElementById('pNext').style.visibility = 'visible';
        });
      });
      document.getElementById('pNext').addEventListener('click', function () {
        advance();
      });
      window.scrollTo(0, 0);
    }

    function doneCount() {
      return st.answers.length;
    }

    function advance() {
      /* эскалация: верно → следующий уровень сложности той же темы в следующем раунде */
      var last = st.answers[st.answers.length - 1];
      var rounds = st.rounds;
      if (last && last.correct) {
        if (st.round === 0) {
          rounds[1] = rounds[1] || ['medium', []];
          rounds[1][1].push({ topicId: last.topicId });
        } else if (st.round === 1) {
          rounds[2] = rounds[2] || ['hard', []];
          rounds[2][1].push({ topicId: last.topicId });
        }
      }
      st.idx++;
      st.current = nextQuestion();
      if (!st.current && st.round < 2) {
        st.round++;
        st.idx = 0;
        if (!st.rounds[st.round]) { finish(); return; }
        st.current = nextQuestion();
      }
      if (!st.current) { finish(); return; }
      render();
    }

    function finish() {
      MASTERY.applyPlacement(user.id, st.answers).then(function (res) {
        renderPlacementResults(root, user, res);
      });
    }

    st.current = nextQuestion();
    if (!st.current) { renderPlacementIntro(root, user); return; }
    render();
  }

  function renderPlacementResults(root, user, res) {
    var blocks = window.CURRICULUM.blocks.map(function (b) {
      var lvl = res.blockStarts[b.id];
      return '<div class="stat-tile glass"><b style="font-size:20px">' + MASTERY.LEVEL_ICON[lvl] + '</b>' +
        '<span>' + esc(b.title) + '<br>' + MASTERY.LEVEL_RU[lvl] + '</span></div>';
    }).join('');
    var strong = Object.keys(res.topicsScore).sort(function (a, b) { return res.topicsScore[b] - res.topicsScore[a]; })[0];
    var weak = Object.keys(res.topicsScore).sort(function (a, b) { return res.topicsScore[a] - res.topicsScore[b]; })[0];
    var tName = function (id) { var t = MASTERY.topicById(id); return t ? t.title : id; };

    root.innerHTML =
      '<div class="mock-shell"><div class="result glass">' +
        '<p class="eyebrow mono" style="margin-bottom:14px">[ карта знаний построена ]</p>' +
        '<div class="result__verdict">Твоя стартовая орбита ✦</div>' +
        '<div class="mock-scores" style="margin:18px 0">' + blocks + '</div>' +
        '<p class="result__sub">Сильная сторона: <b style="color:var(--green)">' + esc(tName(strong)) + '</b> · ' +
        'точка роста: <b style="color:var(--solar)">' + esc(tName(weak)) + '</b></p>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px">' +
          '<a class="btn btn--gold" href="#/trainer">К тренажёру</a>' +
          '<a class="btn btn--ghost" href="#/apply-consult">Консультация с преподавателем</a>' +
        '</div>' +
        '<p class="mono" style="font-size:11px;color:var(--dust-2);margin-top:16px">+30 ✦ начислено · результаты видны твоему преподавателю</p>' +
      '</div></div>';
    window.scrollTo(0, 0);
  }

  /* ═══════════ СЕССИИ: ПРАКТИКА / ЗАЧЁТ / ЭКЗАМЕН ═══════════ */

  function renderTopicSession(root, user, topicId, mode) {
    var topic = MASTERY.topicById(topicId);
    if (!topic) { location.hash = '#/trainer'; return; }
    var questions = mode === 'gate' ? MASTERY.buildGate(topicId) : MASTERY.buildPractice(topicId);
    runSession(root, user, {
      title: topic.title,
      sub: mode === 'gate' ? 'Зачёт: сдай минимум 21 из 25' : 'Практика: 5 лёгких → 7 средних → 10 сложных',
      questions: questions,
      mode: mode, topicId: topicId,
    });
  }

  function renderLevelExam(root, user, blockId) {
    var b = MASTERY.blockById(blockId);
    var levelIdx = MASTERY.LEVELS.indexOf(MASTERY.blockLevel(user.id, blockId));
    if (!b || levelIdx < 0 || levelIdx > 2) { location.hash = '#/trainer'; return; }
    var spec = MASTERY.EXAMS[levelIdx];
    var questions = MASTERY.buildLevelExam(blockId, levelIdx);
    runSession(root, user, {
      title: 'Экзамен: ' + MASTERY.LEVEL_RU[MASTERY.LEVELS[levelIdx]] + ' → ' + MASTERY.LEVEL_RU[MASTERY.LEVELS[levelIdx + 1]],
      sub: 'Блок «' + b.title + '» · нужно ' + Math.round(spec.pass * 100) + '% · ' + spec.count + ' задач',
      questions: questions,
      mode: 'exam', blockId: blockId, levelIdx: levelIdx,
    });
  }

  function runSession(root, user, cfg) {
    var idx = 0, results = [];
    var keys = ['A', 'B', 'C', 'D'];

    function render() {
      var q = cfg.questions[idx];
      root.innerHTML =
        '<div class="mock-shell">' +
          '<div class="mock-top"><div class="mock-top__title"><b>' + esc(cfg.title) + '</b>' +
          '<span>' + esc(cfg.sub) + ' · ' + (idx + 1) + ' / ' + cfg.questions.length + '</span></div>' +
          '<a class="btn btn--ghost btn--sm" href="#/trainer">Выйти</a></div>' +
          '<div class="qcard glass">' +
            '<p class="qcard__num">' + esc(q.domain || '') + (q.topicId ? '' : '') + '</p>' +
            '<p class="qcard__text">' + q.q + '</p>' +
            q.options.map(function (opt, i) {
              return '<button class="opt" data-topt="' + i + '"><span class="opt__key">' + keys[i] + '</span><span>' + opt + '</span></button>';
            }).join('') +
            '<div id="tExplain"></div>' +
          '</div>' +
          '<div class="mock-nav"><button class="btn btn--gold btn--full" id="tNext" style="visibility:hidden">' +
            (idx === cfg.questions.length - 1 ? 'Завершить' : 'Далее →') + '</button></div>' +
        '</div>';

      root.querySelectorAll('[data-topt]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = +btn.dataset.topt;
          var correct = i === q.correct;
          results.push({ difficulty: q.difficulty, correct: correct, topicId: q.topicId || cfg.topicId });
          root.querySelectorAll('[data-topt]').forEach(function (b, bi) {
            b.disabled = true;
            if (bi === q.correct) b.classList.add('opt--right');
            else if (bi === i) b.classList.add('opt--wrong');
          });
          document.getElementById('tExplain').innerHTML =
            '<div class="explain"><b>' + (correct ? '✓ верно' : 'разбор') + '</b>' + esc(q.explain || '') + '</div>';
          document.getElementById('tNext').style.visibility = 'visible';
        });
      });
      document.getElementById('tNext').addEventListener('click', function () {
        idx++;
        if (idx < cfg.questions.length) render();
        else finish();
      });
      window.scrollTo(0, 0);
    }

    function finish() {
      var correct = results.filter(function (r) { return r.correct; }).length;
      var chain;

      if (cfg.mode === 'gate') {
        chain = MASTERY.applyGate(user.id, cfg.topicId, results).then(function (res) {
          showGateResult(res, results);
        });
      } else if (cfg.mode === 'exam') {
        chain = MASTERY.applyLevelExam(user.id, cfg.blockId, results).then(function (res) {
          showExamResult(res, results);
        });
      } else {
        chain = MASTERY.applySession(user.id, cfg.topicId, results).then(function () {
          return DB.addStardust(user.id, 10, 'Практика: ' + cfg.title).catch(function () {});
        }).then(function () {
          DB.addXp(user.id, 10);
          showPracticeResult(correct, results);
        });
      }
      chain.catch(function (e) {
        console.warn('trainer finish:', e);
        toast('Результаты сохранены локально', 'warn');
        if (cfg.mode === 'gate') showGateResult({ passed: false, correct: correct }, results);
        else showPracticeResult(correct, results);
      });
    }

    function showPracticeResult(correct, results) {
      var pct = Math.round(correct / results.length * 100);
      root.innerHTML =
        '<div class="mock-shell"><div class="result glass">' +
          '<div class="result__ring" style="--pct:' + pct + '"><div><b>' + correct + '/' + results.length + '</b><span>' + pct + '%</span></div></div>' +
          '<div class="result__verdict">Практика завершена ✦</div>' +
          '<p class="result__sub">+10 ✦ · мастерство темы обновлено — система учтёт это при планировании</p>' +
          '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
            '<a class="btn btn--ghost" href="#/trainer/topic/' + cfg.topicId + '/practice">Ещё практика</a>' +
            '<a class="btn btn--gold" href="#/trainer">К тренажёру</a>' +
          '</div></div></div>';
    }

    function showGateResult(res, results) {
      var byDiff = { easy: [0, 0], medium: [0, 0], hard: [0, 0] };
      results.forEach(function (r) {
        byDiff[r.difficulty][1]++;
        if (r.correct) byDiff[r.difficulty][0]++;
      });
      var weakTypes = Object.keys(byDiff).filter(function (d) {
        return byDiff[d][1] > 0 && byDiff[d][0] < byDiff[d][1];
      });
      root.innerHTML =
        '<div class="mock-shell"><div class="result glass">' +
          (res.passed
            ? '<div class="result__verdict" style="color:var(--green)">Зачёт сдан ✦</div>' +
              '<p class="result__sub">' + res.correct + '/25 · тема закрыта, открыта следующая · +50 ✦</p>'
            : '<div class="result__verdict" style="color:var(--solar)">Зачёт не сдан</div>' +
              '<p class="result__sub">' + res.correct + '/25 · нужно минимум 21. Слабые места видно в разборе — доработай и пересдай.</p>') +
          '<div class="badges" style="justify-content:center;margin:14px 0">' +
            Object.keys(byDiff).map(function (d) {
              return '<span class="badge">' + ({ easy: 'лёгкие', medium: 'средние', hard: 'сложные' })[d] + ': ' + byDiff[d][0] + '/' + byDiff[d][1] + '</span>';
            }).join('') +
          '</div>' +
          '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
            '<a class="btn btn--ghost" href="#/trainer/topic/' + cfg.topicId + '/practice">Практика по теме</a>' +
            '<a class="btn btn--gold" href="#/trainer/topic/' + cfg.topicId + '/gate">Пересдать зачёт</a>' +
            '<a class="btn btn--ghost" href="#/trainer">К тренажёру</a>' +
          '</div></div></div>';
    }

    function showExamResult(res, results) {
      var pct = Math.round(res.correct / results.length * 100);
      root.innerHTML =
        '<div class="mock-shell"><div class="result glass">' +
          (res.passed
            ? '<div class="result__verdict" style="color:var(--gold)">' + MASTERY.LEVEL_ICON[res.newLevel] + ' ' + MASTERY.LEVEL_RU[res.newLevel] + '!</div>' +
              '<p class="result__sub">Экзамен сдан: ' + res.correct + '/' + results.length + ' · +' + res.reward + ' ✦</p>'
            : '<div class="result__verdict">Экзамен не сдан</div>' +
              '<p class="result__sub">' + res.correct + '/' + results.length + ' · доработай темы блока и попробуй снова</p>') +
          '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">' +
            '<a class="btn btn--gold" href="#/trainer">К тренажёру</a>' +
          '</div></div></div>';
    }

    render();
  }

  /* ═══════════ ЗВЁЗДНАЯ ПЫЛЬ ═══════════ */

  function renderStardust(root, user) {
    var balance = DB.stardustBalance(user.id);
    var ledger = DB.stardustLedger(user.id).slice(0, 12);
    var rows = ledger.map(function (s) {
      return '<div class="attempt glass">' +
        '<span class="attempt__score ' + (s.amount > 0 ? 'attempt__score--good' : 'attempt__score--bad') + '">' +
        (s.amount > 0 ? '+' + s.amount : s.amount) + ' ✦</span>' +
        '<div class="attempt__main"><b>' + esc(s.reason || 'Начисление') + '</b>' +
        '<span>' + UI.dayLabel((s.createdAt || '').slice(0, 10) || DB.todayIso()) + '</span></div></div>';
    }).join('');

    root.innerHTML =
      '<div class="page-head"><p class="eyebrow">[ звёздная пыль ✦ ]</p><h1>Звёздная пыль</h1>' +
      '<div class="glass orbit-wrap" style="margin:14px 0"><div class="orbit" style="--pct:100"><b>✦ ' + balance + '</b></div>' +
      '<div class="orbit-wrap__info"><b>Твой запас</b><span>зарабатывается за зачёты, экзамены и старание. Скоро — магазин обменов</span></div></div>' +
      '<p class="section-label"><span>как заработать</span></p>' +
      '<div class="badges">' +
        '<span class="badge badge--on">Зачёт темы +50</span>' +
        '<span class="badge badge--on">Практика +10</span>' +
        '<span class="badge badge--on">Экзамен уровня +80…200</span>' +
        '<span class="badge badge--on">Размещение +30</span>' +
      '</div>' +
      '<p class="section-label"><span>история</span></p>' +
      (rows || emptyBox('star', 'Пока пусто', 'Пройди практику или зачёт — пыль посыплется'));
  }

  return {
    renderTrainer: renderTrainer,
    renderPlacementIntro: renderPlacementIntro,
    runPlacement: runPlacement,
    renderTopicSession: renderTopicSession,
    renderLevelExam: renderLevelExam,
    renderStardust: renderStardust,
  };
})();
