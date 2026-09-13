/* ═══════════════════════════════════════════════════════════
   VOSKHOD Orbit — режим пробника SAT (симуляция Bluebook).
   RW: 2 модуля × 27 вопросов × 32 мин → перерыв 10 мин →
   Math: 2 модуля × 22 вопроса × 35 мин. Шкала 400–1600.
   Черновик автосохраняется — пробник переживает перезагрузку.
   ═══════════════════════════════════════════════════════════ */

window.Mock = (function () {
  'use strict';

  var esc = UI.esc, ic = UI.ic, toast = UI.toast;
  var DRAFT_KEY = 'vo-mock-draft';
  var TIME_SCALE = window.MOCK_TIME_SCALE || 1; /* тесты: ускоренный таймер */
  var timerId = null;

  /* приближённая конверсия raw → scaled (College Board 400–1600) */
  var RW_TABLE = [200, 220, 240, 260, 280, 300, 320, 335, 350, 365, 380, 395, 410, 420, 430, 440, 450, 460, 470, 480, 490, 500, 510, 520, 530, 540, 548, 556, 564, 572, 580, 590, 600, 608, 616, 624, 632, 640, 650, 660, 668, 676, 684, 692, 700, 708, 716, 724, 732, 740, 750, 760, 770, 780, 800];
  var MATH_TABLE = [200, 230, 260, 290, 320, 350, 370, 390, 410, 430, 450, 470, 490, 500, 510, 520, 530, 540, 550, 560, 570, 580, 590, 600, 610, 620, 630, 640, 650, 660, 665, 670, 680, 690, 700, 710, 720, 730, 740, 750, 760, 770, 780, 790, 800];
  /* easy Module 2 ограничивает потолок балла — как на настоящем SAT */
  var RW_EASY_TABLE = RW_TABLE.map(function (v) { return Math.min(v, 730); });
  var MATH_EASY_TABLE = MATH_TABLE.map(function (v) { return Math.min(v, 690); });
  var MODULE_TIME = { rw: [32, 32], math: [35, 35] };

  function moduleTime(sectionIdx, moduleIdx) {
    return MODULE_TIME[sectionIdx === 0 ? 'rw' : 'math'][moduleIdx];
  }

  function scale(table, raw) {
    if (raw <= 0) return table[0];
    if (raw >= table.length - 1) return table[table.length - 1];
    return table[raw];
  }

  function mockById(id) {
    return (window.MOCK_SAT_1 && window.MOCK_SAT_1.id === id) ? window.MOCK_SAT_1 : null;
  }
  function examsList() {
    return window.MOCK_SAT_1 ? [window.MOCK_SAT_1] : [];
  }

  function cleanup() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }
  /* полный сброс при уходе из экзамена (route/intro/scores) */
  function teardown() {
    cleanup();
    document.body.classList.remove('exam-mode');
    window.__cosmosFrozen = false;
  }

  /* ═══════════ ИНТРО / СПИСОК ═══════════ */

  function renderIntro(root, user) {
    teardown();
    var draft = readDraft();
    var mock = examsList()[0];
    var hasValidDraft = draft && draft.uid === user.id;

    var history = DB.mockResultsBy(user.id).slice().reverse();
    var historyHtml = history.length ? history.map(function (r) {
      return '<a class="attempt glass" href="#/mock/results/' + r.id + '">' +
        '<span class="attempt__score ' + (r.total >= 1200 ? 'attempt__score--good' : '') + '">' + r.total + '</span>' +
        '<div class="attempt__main"><b>SAT ' + esc(r.mockId === 'mock1' ? 'Practice #1' : r.mockId) + '</b>' +
        '<span>' + UI.dayLabel(r.date) + ' · RW ' + r.rw + ' · Math ' + r.math + ' · тапни для разбора</span></div></a>';
    }).join('') : '';

    root.innerHTML =
      '<div class="page-head"><p class="eyebrow">[ пробник · digital SAT ]</p><h1>Пробник SAT</h1>' +
      '<p>Полная симуляция экзамена в Bluebook: 98 вопросов, шкала 400–1600</p></div>' +

      '<div class="glass card" style="display:grid;gap:14px;margin-bottom:14px">' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
          '<span class="chip">' + ic('clock') + ' 134 мин + перерыв</span>' +
          '<span class="chip">' + ic('clipboard') + ' 98 вопросов</span>' +
          '<span class="chip chip--ion">шкала 400–1600</span>' +
        '</div>' +
        '<div class="mock-format">' +
          '<div><b>Reading &amp; Writing</b><span>2 модуля × 27 вопросов · 32 мин</span></div>' +
          '<div class="mock-format__arrow">↓ <i>перерыв 10 мин</i></div>' +
          '<div><b>Math</b><span>2 модуля × 22 вопроса · 35 мин</span></div>' +
        '</div>' +
        '<p style="font-size:13px;color:var(--dust)">Ответы не подсвечиваются во время экзамена — разбор откроется в конце. В Math доступен калькулятор и формулы. Прогресс сохраняется: если закрыть вкладку, продолжишь с того же места.</p>' +
        (hasValidDraft
          ? '<div class="th-tip">⏸ Найден незавершённый пробник — осталось ' + Math.max(1, Math.round((draft.endsAt - Date.now()) / 60000)) + ' мин текущего модуля.</div>' +
            '<button class="btn btn--gold btn--full" id="mockResume">Продолжить пробник ▸</button>' +
            '<button class="btn btn--ghost btn--full" id="mockRestart">Начать заново</button>'
          : '<button class="btn btn--gold btn--full" id="mockStart">' + ic('play') + ' Диагностический SAT #1 ✦</button>' +
            '<button class="btn btn--ion btn--full" id="mockGenStart">' + ic('star') + ' Уникальный пробник — новый каждый раз</button>' +
            '<p class="mono" style="font-size:10.5px;color:var(--dust-2);text-align:center">уникальный собирается из банка: адаптивный Module 2, вопросы не повторяются как в фиксированном</p>') +
        '<a class="btn btn--ghost btn--full" href="#/theory/sat-info/format">Как устроен цифровой SAT — 7 мин теории</a>' +
      '</div>' +
      (historyHtml
        ? '<p class="section-label"><span>мои попытки</span></p><div class="stack">' + historyHtml + '</div>'
        : '');

    var startBtn = document.getElementById('mockStart');
    if (startBtn) startBtn.addEventListener('click', function () { startNew(root, user, mock.id); });
    var genBtn = document.getElementById('mockGenStart');
    if (genBtn) genBtn.addEventListener('click', function () { startGenerated(root, user); });
    var resumeBtn = document.getElementById('mockResume');
    if (resumeBtn) resumeBtn.addEventListener('click', function () { resumeDraft(root, user); });
    var restartBtn = document.getElementById('mockRestart');
    if (restartBtn) restartBtn.addEventListener('click', function () {
      localStorage.removeItem(DRAFT_KEY);
      startNew(root, user, mock.id);
    });
  }

  /* ═══════════ СОСТОЯНИЕ ═══════════ */

  function blankAnswers(mock) {
    function size(arr, i) { return arr[i] ? arr[i].length : 40; }
    return [
      [new Array(size(mock.rw, 0)).fill(null), new Array(size(mock.rw, 1)).fill(null)],
      [new Array(size(mock.math, 0)).fill(null), new Array(size(mock.math, 1)).fill(null)],
    ];
  }
  function blankFlags(mock) {
    function size(arr, i) { return arr[i] ? arr[i].length : 40; }
    return [
      [new Array(size(mock.rw, 0)).fill(false), new Array(size(mock.rw, 1)).fill(false)],
      [new Array(size(mock.math, 0)).fill(false), new Array(size(mock.math, 1)).fill(false)],
    ];
  }
  /* точная подгонка длины под фактический модуль (адаптивные M2 строятся позже) */
  function ensureSized(st, sectionIdx, moduleIdx) {
    var need = (sectionIdx === 0 ? st.mock.rw : st.mock.math)[moduleIdx].length;
    [st.answers, st.flags].forEach(function (struct) {
      var arr = struct[sectionIdx][moduleIdx];
      arr.length = need;
      for (var i = 0; i < need; i++) {
        if (arr[i] === undefined) arr[i] = struct === st.answers ? null : false;
      }
    });
  }

  function saveDraft(st) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        uid: st.user.id, mockId: st.mock.id,
        exam: st.mock.generated ? st.mock : null,
        sectionIdx: st.sectionIdx, moduleIdx: st.moduleIdx,
        answers: st.answers, flags: st.flags,
        startedAt: st.startedAt, endsAt: st.endsAt,
      }));
    } catch (e) { /* ignore */ }
  }
  function readDraft() {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch (e) { return null; }
  }
  function clearDraft() { localStorage.removeItem(DRAFT_KEY); }

  function startNew(root, user, mockId) {
    var mock = mockById(mockId);
    if (!mock) return;
    beginExam(root, user, mock);
  }

  function startGenerated(root, user) {
    var exam = window.MOCK_GEN.build();
    beginExam(root, user, exam);
  }

  function beginExam(root, user, mock) {
    var st = {
      user: user, mock: mock,
      sectionIdx: 0, moduleIdx: 0, qIdx: 0,
      answers: blankAnswers(mock), flags: blankFlags(mock),
      startedAt: Date.now(),
      endsAt: Date.now() + moduleTime(0, 0) * 60000 * TIME_SCALE,
      phase: 'module',
    };
    saveDraft(st);
    renderModule(root, st);
  }

  function resumeDraft(root, user) {
    var d = readDraft();
    var mock = d && mockById(d.mockId);
    if (!mock && d && d.exam) mock = window.MOCK_GEN.attachBuilder(d.exam);
    if (!mock || (d && d.uid !== user.id)) { startNew(root, user, (examsList()[0] || {}).id); return; }
    var st = {
      user: user, mock: mock,
      sectionIdx: d.sectionIdx, moduleIdx: d.moduleIdx, qIdx: d.qIdx,
      answers: d.answers, flags: d.flags,
      startedAt: d.startedAt, endsAt: d.endsAt,
      phase: 'module',
    };
    if (Date.now() >= st.endsAt) {
      /* модуль истёк, пока студента не было */
      advance(root, st);
      return;
    }
    renderModule(root, st);
  }

  /* ═══════════ МОДУЛЬ ═══════════ */

  function sectionName(sectionIdx) {
    return sectionIdx === 0 ? 'Reading & Writing' : 'Math';
  }
  function isMath(sectionIdx) { return sectionIdx === 1; }
  function currentQuestions(st) {
    return (st.sectionIdx === 0 ? st.mock.rw : st.mock.math)[st.moduleIdx];
  }

  function renderModule(root, st) {
    ensureSized(st, st.sectionIdx, st.moduleIdx);
    /* прибираем оверлеи, оставшиеся от предыдущего вопроса */
    document.querySelectorAll('body > .mock-overlay').forEach(function (el) { el.remove(); });
    var qs = currentQuestions(st);
    /* режим экзамена: убираем шапку/таббар/меню, замораживаем космос */
    document.body.classList.add('exam-mode');
    window.__cosmosFrozen = true;
    var q = qs[st.qIdx];
    var sectionLabel = sectionName(st.sectionIdx);
    var isMathSec = isMath(st.sectionIdx);

    root.innerHTML =
      '<div class="mock-shell">' +
        '<div class="mock-top">' +
          '<button class="mock-top__exit" id="mockExit" aria-label="Сохранить и выйти">' + ic('x') + '</button>' +
          '<div class="mock-top__title"><b>' + esc(sectionLabel) + '</b><span>Module ' + (st.moduleIdx + 1) + ' · вопрос ' + (st.qIdx + 1) + ' из ' + qs.length + '</span></div>' +
          '<div class="runner__timer" id="mockTimer"><span id="mockTimerVal">–:––</span></div>' +
        '</div>' +
        '<div class="mock-toolbar">' +
          '<button class="btn btn--ghost btn--sm" id="mockGrid">' + ic('grid') + ' Вопросы</button>' +
          '<button class="btn btn--ghost btn--sm' + (st.flags[st.sectionIdx][st.moduleIdx][st.qIdx] ? ' mock-flag--on' : '') + '" id="mockFlag">' + ic('star') + ' <span>На проверку</span></button>' +
          (isMathSec ? '<button class="btn btn--ghost btn--sm" id="mockRef">Σ Формулы</button><button class="btn btn--ion btn--sm" id="mockCalc">🖩 Калькулятор</button>' : '') +
        '</div>' +
        '<div id="mockQ"></div>' +
        '<div class="mock-nav">' +
          '<button class="btn btn--ghost" id="mockPrev" ' + (st.qIdx === 0 ? 'disabled' : '') + '>← Назад</button>' +
          '<button class="btn ' + (st.qIdx === qs.length - 1 ? 'btn--gold' : 'btn--ghost') + '" id="mockNext">' +
            (st.qIdx === qs.length - 1 ? 'Завершить модуль' : 'Далее →') + '</button>' +
        '</div>' +
        '<div id="mockOverlays"></div>' +
      '</div>';

    renderQuestion(st);
    bindModule(root, st);
    startTimer(root, st);
    window.scrollTo(0, 0);
  }

  function renderQuestion(st) {
    var q = currentQuestions(st)[st.qIdx];
    var box = document.getElementById('mockQ');
    var keys = ['A', 'B', 'C', 'D'];
    box.innerHTML =
      (q.passage ? '<div class="mock-passage">' + q.passage + '</div>' : '') +
      '<div class="qcard glass">' +
        '<p class="qcard__num">' + (q.domain ? esc(q.domain) + ' · ' : '') + 'вопрос ' + (st.qIdx + 1) + '</p>' +
        '<p class="qcard__text">' + q.q + '</p>' +
        q.options.map(function (opt, i) {
          var sel = st.answers[st.sectionIdx][st.moduleIdx][st.qIdx] === i ? ' opt--sel' : '';
          return '<button class="opt' + sel + '" data-mopt="' + i + '">' +
            '<span class="opt__key">' + keys[i] + '</span><span>' + opt + '</span></button>';
        }).join('') +
      '</div>';

    box.querySelectorAll('[data-mopt]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        st.answers[st.sectionIdx][st.moduleIdx][st.qIdx] = +btn.dataset.mopt;
        saveDraft(st);
        renderQuestion(st);
      });
    });
  }

  function bindModule(root, st) {
    document.getElementById('mockExit').addEventListener('click', function () {
      var m = UI.modal(
        '<div class="modal__head"><h3>Выйти из пробника?</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
        '<p style="color:var(--dust);font-size:14px">Прогресс сохранён — продолжишь с этого же места, когда вернёшься.</p>' +
        '<div class="modal__foot"><button class="btn btn--ghost btn--full" data-close>Остаться</button>' +
        '<button class="btn btn--danger btn--full" id="exitYes">Сохранить и выйти</button></div>');
      m.el.querySelector('#exitYes').addEventListener('click', function () {
        m.close();
        teardown();
        if (location.hash === '#/mock') {
          /* хэш не менялся — route не сработает, рисуем интро сами */
          renderIntro(root, st.user);
        } else {
          location.hash = '#/mock';
        }
      });
    });
    document.getElementById('mockNext').addEventListener('click', function () {
      var qs = currentQuestions(st);
      if (st.qIdx < qs.length - 1) { st.qIdx++; saveDraft(st); renderModule(root, st); }
      else endModule(root, st);
    });
    document.getElementById('mockPrev').addEventListener('click', function () {
      if (st.qIdx > 0) { st.qIdx--; saveDraft(st); renderModule(root, st); }
    });
    document.getElementById('mockFlag').addEventListener('click', function () {
      var f = st.flags[st.sectionIdx][st.moduleIdx];
      f[st.qIdx] = !f[st.qIdx];
      saveDraft(st);
      var btn = document.getElementById('mockFlag');
      btn.classList.toggle('mock-flag--on', f[st.qIdx]);
    });
    document.getElementById('mockGrid').addEventListener('click', function () { showGrid(root, st); });
    if (document.getElementById('mockCalc')) {
      document.getElementById('mockCalc').addEventListener('click', toggleCalc);
      document.getElementById('mockRef').addEventListener('click', showReference);
    }
  }

  function showGrid(root, st) {
    var qs = currentQuestions(st);
    var flags = st.flags[st.sectionIdx][st.moduleIdx];
    var answers = st.answers[st.sectionIdx][st.moduleIdx];
    var cells = qs.map(function (_, i) {
      var cls = 'mock-grid__cell' + (answers[i] !== null ? ' is-answered' : '') + (flags[i] ? ' is-flagged' : '') + (i === st.qIdx ? ' is-cur' : '');
      return '<button class="' + cls + '" data-jump="' + i + '">' + (i + 1) + '</button>';
    }).join('');
    var answered = answers.filter(function (a) { return a !== null; }).length;

    var ov = document.createElement('div');
    ov.className = 'mock-overlay';
    ov.innerHTML =
      '<div class="mock-sheet">' +
        '<div class="modal__head"><h3>' + esc(sectionName(st.sectionIdx)) + ' · Module ' + (st.moduleIdx + 1) + '</h3>' +
        '<button class="icon-btn" id="gridClose">' + ic('x') + '</button></div>' +
        '<p class="mono" style="font-size:11px;color:var(--dust);margin-bottom:12px">отвечено ' + answered + ' из ' + qs.length + ' · жёлтая рамка — с флажком</p>' +
        '<div class="mock-grid">' + cells + '</div>' +
        '<button class="btn btn--gold btn--full" id="gridDone" style="margin-top:16px">К вопросам</button>' +
      '</div>';
    document.body.appendChild(ov);

    ov.querySelectorAll('[data-jump]').forEach(function (b) {
      b.addEventListener('click', function () {
        st.qIdx = +b.dataset.jump;
        saveDraft(st);
        ov.remove();
        renderModule(root, st);
      });
    });
    document.getElementById('gridClose').addEventListener('click', function () { ov.remove(); });
    document.getElementById('gridDone').addEventListener('click', function () { ov.remove(); });
  }

  /* ═══════════ ТАЙМЕР ═══════════ */

  function startTimer(root, st) {
    cleanup();
    var el = document.getElementById('mockTimerVal');
    function tick() {
      var left = Math.max(0, Math.round((st.endsAt - Date.now()) / 1000));
      if (el) el.textContent = UI.fmtDur(left);
      var box = document.getElementById('mockTimer');
      if (box && left <= 60) box.classList.add('runner__timer--low');
      if (left <= 0) { cleanup(); endModule(root, st, true); }
    }
    tick();
    timerId = setInterval(tick, 500);
  }

  function endModule(root, st, byTime) {
    cleanup();
    st.phase = 'moduleEnd';
    if (byTime) toast('Время модуля вышло — ответы сохранены', 'warn');
    renderModuleEnd(root, st);
  }
  function advance(root, st) { endModule(root, st, true); }

  /* адаптив: строим Module 2 по результату Module 1 (как в Bluebook) */
  function nextModule(root, st, sectionIdx, moduleIdx) {
    if (st.mock.generated && st.mock.adaptive && moduleIdx === 1) {
      var answered = st.answers[sectionIdx][0];
      var qs = (sectionIdx === 0 ? st.mock.rw : st.mock.math)[0];
      var correct = answered.reduce(function (acc, a, i) {
        return acc + (a === qs[i].correct ? 1 : 0);
      }, 0);
      var pct = correct / qs.length;
      st.mock.buildM2(sectionIdx, pct);
    }
    toModule(root, st, sectionIdx, moduleIdx);
  }

  function renderModuleEnd(root, st) {
    saveDraft(st);
    var lastOfSection = st.moduleIdx === 1;
    var lastOfExam = lastOfSection && st.sectionIdx === 1;
    if (lastOfExam) { finish(root, st); return; }

    var action;
    if (st.sectionIdx === 0 && st.moduleIdx === 0) {
      action = function () { nextModule(root, st, 0, 1); };
    } else if (st.sectionIdx === 0) {
      action = function () { toBreak(root, st); };
    } else {
      action = function () { nextModule(root, st, 1, 1); };
    }

    var goLabel = st.sectionIdx === 0 && st.moduleIdx === 1 ? 'К перерыву' : 'К Module ' + (st.moduleIdx + 2);
    var hint = '';
    if (st.mock.generated && st.moduleIdx === 0) {
      var answered = st.answers[st.sectionIdx][0];
      var qs = (st.sectionIdx === 0 ? st.mock.rw : st.mock.math)[0];
      var correct = answered.reduce(function (acc, a, i) { return acc + (a === qs[i].correct ? 1 : 0); }, 0);
      var hard = correct / qs.length >= 0.6;
      hint = '<p class="mono" style="font-size:11.5px;color:' + (hard ? 'var(--solar)' : 'var(--ion)') + ';margin-bottom:16px">адаптив: ' + correct + '/' + qs.length + ' в Module 1 → Module 2 ' + (hard ? 'HARD (высокий потолок балла)' : 'EASY (как на настоящем SAT при результате ниже 60%)') + '</p>';
    }

    root.innerHTML =
      '<div class="mock-shell"><div class="result glass">' +
        '<p class="eyebrow mono" style="margin-bottom:14px">[ модуль завершён ]</p>' +
        '<div class="result__verdict">Модуль ' + (st.moduleIdx + 1) + ' сдан ✦</div>' +
        '<p class="result__sub">Ответы сохранены. Вернуться к вопросам нельзя — так же на настоящем SAT.</p>' +
        hint +
        '<button class="btn btn--gold" id="mockGo">' + ic('play') + ' ' + goLabel + '</button>' +
      '</div></div>';
    document.getElementById('mockGo').addEventListener('click', action);
  }

  function toModule(root, st, sectionIdx, moduleIdx) {
    st.sectionIdx = sectionIdx;
    st.moduleIdx = moduleIdx;
    st.qIdx = 0;
    st.endsAt = Date.now() + moduleTime(sectionIdx, moduleIdx) * 60000 * TIME_SCALE;
    st.phase = 'module';
    saveDraft(st);
    renderModule(root, st);
  }

  function toBreak(root, st) {
    cleanup();
    var left = 10 * 60;
    root.innerHTML =
      '<div class="mock-shell"><div class="result glass">' +
        '<p class="eyebrow mono" style="margin-bottom:14px">[ перерыв ]</p>' +
        '<div class="result__verdict">10 минут отдыха ☕</div>' +
        '<p class="result__sub">Дальше — Math: 2 модуля по 35 минут. Калькулятор разрешён.</p>' +
        '<div class="result__ring" style="--pct:100;width:120px;height:120px;margin:0 auto 20px"><div><b id="brkVal">10:00</b></div></div>' +
        '<button class="btn btn--gold" id="brkSkip">Пропустить перерыв →</button>' +
      '</div></div>';
    document.getElementById('brkSkip').addEventListener('click', function () { toModule(root, st, 1, 0); });
    timerId = setInterval(function () {
      left--;
      var el = document.getElementById('brkVal');
      if (el) el.textContent = UI.fmtDur(Math.max(0, left));
      if (left <= 0) { cleanup(); toModule(root, st, 1, 0); }
    }, 1000);
  }

  /* ═══════════ ЗАВЕРШЕНИЕ ═══════════ */

  function finish(root, st) {
    cleanup();
    clearDraft();
    var flat = function (secIdx) { return st.answers[secIdx][0].concat(st.answers[secIdx][1]); };
    var rwFlat = flat(0), mathFlat = flat(1);
    var rwRaw = 0, mathRaw = 0;
    st.mock.rw[0].concat(st.mock.rw[1]).forEach(function (q, i) { if (rwFlat[i] === q.correct) rwRaw++; });
    st.mock.math[0].concat(st.mock.math[1]).forEach(function (q, i) { if (mathFlat[i] === q.correct) mathRaw++; });
    var rw = scale(st.mock.m2Variant && st.mock.m2Variant.rw === 'easy' ? RW_EASY_TABLE : RW_TABLE, rwRaw);
    var math = scale(st.mock.m2Variant && st.mock.m2Variant.math === 'easy' ? MATH_EASY_TABLE : MATH_TABLE, mathRaw);
    var durSec = Math.round((Date.now() - st.startedAt) / 1000);

    var result = {
      id: DB.newId('mk'), studentId: st.user.id, mockId: st.mock.id,
      total: rw + math, rw: rw, math: math,
      rwRaw: rwRaw, mathRaw: mathRaw, durSec: durSec,
      date: DB.todayIso(),
      answers: { rw: rwFlat, math: mathFlat, exam: st.mock.generated ? st.mock : undefined },
    };

    var before = DB.levelOf(st.user.xp || 0).index;
    DB.addXp(st.user.id, 50);
    DB.saveMockResult(result).then(function () {
      var after = DB.levelOf(DB.user(st.user.id).xp || 0);
      renderScores(root, result, before, after.index);
    });
  }

  /* ═══════════ ЭКРАН БАЛЛОВ ═══════════ */

  function renderScores(root, r, levelBefore, levelAfter) {
    teardown();
    var pct = Math.round((r.total - 400) / 1200 * 100);
    var variant = (r.answers && r.answers.exam && r.answers.exam.m2Variant) || {};
    root.innerHTML =
      '<div class="mock-shell"><div class="result glass">' +
        '<p class="eyebrow mono" style="margin-bottom:14px">[ твой балл · приблизительная шкала ]</p>' +
        '<div class="result__ring" style="--pct:0" id="mkRing"><div><b>' + r.total + '</b><span>400–1600</span></div></div>' +
        '<div class="mock-scores">' +
          '<div class="stat-tile glass"><b>' + r.rw + '</b><span>Reading &amp; Writing · ' + r.rwRaw + '/54</span></div>' +
          '<div class="stat-tile glass"><b>' + r.math + '</b><span>Math · ' + r.mathRaw + '/44</span></div>' +
        '</div>' +
        '<div class="badges" style="justify-content:center;margin:18px 0">' +
          '<span class="badge badge--on">' + ic('star') + ' +50 XP</span>' +
          (variant.rw || variant.math ? '<span class="badge">M2: ' + esc((variant.rw || '?') + ' / ' + (variant.math || '?')) + '</span>' : '') +
          (r.total >= 1400 ? '<span class="badge badge--on">' + ic('rocket') + ' 1400+ — уровень элиты!</span>'
            : r.total >= 1200 ? '<span class="badge badge--on">' + ic('rocket') + ' 1200+ — сильный результат</span>' : '') +
          (levelAfter > (levelBefore == null ? levelAfter : levelBefore)
            ? '<span class="badge badge--on">' + ic('rocket') + ' Новый уровень: ' + esc(DB.levelOf(DB.currentUser().xp).level.name) + '</span>' : '') +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
          '<a class="btn btn--gold" href="#/mock/review/' + r.id + '">Разбор всех вопросов</a>' +
          '<a class="btn btn--ghost" href="#/mock">К пробникам</a>' +
        '</div>' +
        '<p class="mono" style="font-size:11px;color:var(--dust-2);margin-top:16px">шкала приблизительная: настоящий SAT использует эквирование каждой версии экзамена</p>' +
      '</div></div>';
    window.scrollTo(0, 0);

    var ring = document.getElementById('mkRing'), cur = 400;
    requestAnimationFrame(function loop() {
      cur += (r.total - cur) * 0.1;
      if (Math.abs(r.total - cur) < 1) cur = r.total;
      ring.style.setProperty('--pct', (((cur - 400) / 1200) * 100).toFixed(1));
      ring.querySelector('b').textContent = Math.round(cur);
      if (cur !== r.total) requestAnimationFrame(loop);
    });
  }

  /* ═══════════ РАЗБОР ═══════════ */

  function renderReview(root, resultId) {
    var user = DB.currentUser();
    var r = DB.mockResult(resultId);
    if (!r || !user || r.studentId !== user.id) { location.hash = '#/mock'; return; }
    var mock = mockById(r.mockId) || (r.answers && r.answers.exam);
    if (!mock) { location.hash = '#/mock'; return; }

    var keys = ['A', 'B', 'C', 'D'];
    var idx = 0;
    function moduleBlock(secIdx, modIdx, modQuestions, flatOffset) {
      var answerArr = r.answers[secIdx === 0 ? 'rw' : 'math'];
      var items = modQuestions.map(function (q, i) {
        var a = answerArr[flatOffset + i];
        idx++;
        return '<div class="qcard glass" style="margin-bottom:12px">' +
          '<p class="qcard__num">' + (idx) + ' · ' + (a === q.correct ? '<span style="color:var(--green)">верно</span>' : a === null ? '<span style="color:var(--solar)">без ответа</span>' : '<span style="color:var(--red)">ошибка</span>') + '</p>' +
          (q.passage ? '<details class="mock-review-passage"><summary>пассаж</summary><div class="mock-passage" style="margin-top:8px">' + q.passage + '</div></details>' : '') +
          '<p class="qcard__text">' + q.q + '</p>' +
          q.options.map(function (opt, oi) {
            var cls = 'opt';
            if (oi === q.correct) cls += ' opt--right';
            else if (oi === a) cls += ' opt--wrong';
            return '<div class="' + cls + '"><span class="opt__key">' + keys[oi] + '</span><span>' + opt + '</span></div>';
          }).join('') +
          (q.explain ? '<div class="explain"><b>разбор</b>' + q.explain + '</div>' : '') +
          '</div>';
      }).join('');
      return '<p class="section-label"><span>' + esc(sectionName(secIdx)) + ' · Module ' + (modIdx + 1) + '</span></p>' + items;
    }

    var rwOff = 0, mathOff = 0;
    root.innerHTML =
      '<div class="page-head"><p class="eyebrow">[ разбор пробника ]</p>' +
      '<div class="page-head__row"><h1>' + r.total + ' · RW ' + r.rw + ' · Math ' + r.math + '</h1>' +
      '<a class="icon-btn" href="#/mock" aria-label="Назад">' + ic('back') + '</a></div></div>' +
      moduleBlock(0, 0, mock.rw[0], 0) +
      moduleBlock(0, 1, mock.rw[1], mock.rw[0].length) +
      moduleBlock(1, 0, mock.math[0], 0) +
      moduleBlock(1, 1, mock.math[1], mock.math[0].length) +
      '<a class="btn btn--ghost btn--full" href="#/mock" style="margin-top:14px">К пробникам</a>';
    window.scrollTo(0, 0);
  }

  /* ═══════════ КАЛЬКУЛЯТОР ═══════════ */

  var calcOpen = false;
  function toggleCalc() {
    calcOpen = !calcOpen;
    var el = document.getElementById('mockCalcPanel');
    if (el) el.remove();
    if (!calcOpen) return;
    var panel = document.createElement('div');
    panel.id = 'mockCalcPanel';
    panel.className = 'mock-calc';
    var keys = [
      ['sin(', 'cos(', 'tan(', 'C'],
      ['log(', 'ln(', 'π', '⌫'],
      ['7', '8', '9', '/'],
      ['4', '5', '6', '×'],
      ['1', '2', '3', '−'],
      ['0', '.', '√(', '+'],
      ['(', ')', '^', '='],
    ];
    panel.innerHTML =
      '<div class="mock-calc__disp" id="calcDisp">0</div>' +
      '<div class="mock-calc__pad">' +
        keys.map(function (row) {
          return '<div class="mock-calc__row">' + row.map(function (k) {
            var eq = k === '=';
            return '<button class="mock-calc__key' + (eq ? ' mock-calc__key--eq' : '') + '" data-k="' + k + '">' +
              (k === '×' ? '×' : k === '−' ? '−' : k) + '</button>';
          }).join('') + '</div>';
        }).join('') +
      '</div>';
    document.body.appendChild(panel);

    var expr = '';
    var ans = '0';
    var disp = panel.querySelector('#calcDisp');
    function render() { disp.textContent = expr || '0'; }
    panel.querySelectorAll('[data-k]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.k;
        if (k === 'C') expr = '';
        else if (k === '⌫') expr = expr.slice(0, -1);
        else if (k === '=') { var v = calcEval(expr); ans = String(v); expr = String(v); }
        else if (k === 'ans') expr += ans;
        else if (k === '−') expr += '-';
        else if (k === '×') expr += '*';
        else expr += k;
        render();
      });
    });
    render();
  }

  /* безопасный вычислитель выражений: токенизация + shunting-yard, без eval */
  function calcEval(src) {
    if (!src) return 0;
    var tokens = src.match(/(\d+\.?\d*|\.\d+|[a-zπ√]+|[()+\-*\/^%])/g) || [];
    var out = [], ops = [];
    var prec = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };
    var funcs = { 'sin': Math.sin, 'cos': Math.cos, 'tan': Math.tan, 'log': Math.log10, 'ln': Math.log, 'sqrt': Math.sqrt };
    var consts = { 'π': Math.PI, 'e': Math.E };
    var prevType = null;

    tokens.forEach(function (t) {
      if (/^[\d.]+$/.test(t)) { out.push(parseFloat(t)); prevType = 'num'; return; }
      if (consts[t] !== undefined) { out.push(consts[t]); prevType = 'num'; return; }
      if (funcs[t]) { ops.push(t); prevType = 'func'; return; }
      if (t === '√') { /* совместимость */ ops.push('sqrt'); prevType = 'func'; return; }
      if (t === '(') { ops.push(t); prevType = 'paren'; return; }
      if (t === ')') {
        while (ops.length && ops[ops.length - 1] !== '(') out.push(ops.pop());
        if (ops.length) ops.pop();
        if (ops.length && funcs[ops[ops.length - 1]]) out.push(ops.pop());
        prevType = 'num';
        return;
      }
      if (prec[t]) {
        /* унарный минус */
        if (t === '-' && (prevType === null || prevType === 'op' || prevType === 'paren')) { out.push(0); }
        while (ops.length && prec[ops[ops.length - 1]] >= prec[t] && ops[ops.length - 1] !== '(' && !funcs[ops[ops.length - 1]]) {
          out.push(ops.pop());
        }
        ops.push(t); prevType = 'op'; return;
      }
      prevType = 'op';
    });
    while (ops.length) out.push(ops.pop());

    var st = [];
    for (var i = 0; i < out.length; i++) {
      var tk = out[i];
      if (typeof tk === 'number') { st.push(tk); continue; }
      if (funcs[tk]) {
        var a = st.pop();
        st.push(funcs[tk](a === undefined ? 0 : a));
        continue;
      }
      if (prec[tk]) {
        var b = st.pop(), c = st.pop();
        if (b === undefined || c === undefined) return NaN;
        switch (tk) {
          case '+': st.push(c + b); break;
          case '-': st.push(c - b); break;
          case '*': st.push(c * b); break;
          case '/': st.push(c / b); break;
          case '%': st.push(c % b); break;
          case '^': st.push(Math.pow(c, b)); break;
        }
      }
    }
    var result = st.pop();
    return (typeof result === 'number' && isFinite(result))
      ? Math.round(result * 1e10) / 1e10 : (result || 0);
  }

  /* ═══════════ REFERENCE SHEET ═══════════ */

  function showReference() {
    UI.modal(
      '<div class="modal__head"><h3>Reference — формулы SAT</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
      '<div class="mock-ref">' +
        '<div><b>Circle</b><span>A = πr² &nbsp;·&nbsp; C = 2πr</span></div>' +
        '<div><b>Rectangle</b><span>A = lw &nbsp;·&nbsp; P = 2l + 2w</span></div>' +
        '<div><b>Triangle</b><span>A = ½bh &nbsp;·&nbsp; сумма углов = 180°</span></div>' +
        '<div><b>Pythagorean theorem</b><span>a² + b² = c²</span></div>' +
        '<div><b>Special right triangles</b><span>30°-60°-90°: x, x√3, 2x &nbsp;·&nbsp; 45°-45°-90°: x, x, x√2</span></div>' +
        '<div><b>Cube</b><span>V = s³ &nbsp;·&nbsp; поверхность = 6s²</span></div>' +
        '<div><b>Rectangular prism</b><span>V = lwh</span></div>' +
        '<div><b>Cylinder</b><span>V = πr²h</span></div>' +
        '<div><b>Sphere</b><span>V = (4/3)πr³</span></div>' +
        '<div><b>Cone</b><span>V = (1/3)πr²h</span></div>' +
        '<div><b>Trigonometry</b><span>sin = opp/hyp · cos = adj/hyp · tan = opp/adj</span></div>' +
      '</div>'
    );
  }

  return {
    renderIntro: renderIntro,
    renderReview: renderReview,
    renderResultById: function (root, resultId) {
      var r = DB.mockResult(resultId);
      if (!r) { location.hash = '#/mock'; return; }
      renderScores(root, r, null, null);
    },
    cleanup: teardown,
    teardown: teardown,
    convertForTests: { rw: RW_TABLE, math: MATH_TABLE, scale: scale },
  };
})();
