/* ═══════════════════════════════════════════════════════════
   VOSKHOD Orbit — тесты: раннер, результат, разбор, конструктор
   ═══════════════════════════════════════════════════════════ */

window.Tests = (function () {
  'use strict';

  var esc = UI.esc, ic = UI.ic, toast = UI.toast;
  var timerId = null;

  function cleanup() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  /* ═══════════ РАННЕР ═══════════ */

  function renderRunner(root, testId) {
    var test = DB.test(testId);
    var user = DB.currentUser();
    if (!test || !user || user.role !== 'student') { location.hash = '#/tests'; return; }

    var st = {
      test: test,
      idx: 0,
      answers: new Array(test.questions.length).fill(null),
      startedAt: Date.now(),
      deadline: Date.now() + (test.timeMin || 10) * 60000,
      finished: false,
    };

    function render() {
      var q = test.questions[st.idx];
      var answered = st.answers[st.idx] !== null;
      var last = st.idx === test.questions.length - 1;
      var dots = test.questions.map(function (_, i) {
        var cls = 'qdots-' + i;
        var state = st.answers[i] !== null ? ' is-done' : (i === st.idx ? ' is-cur' : '');
        return '<i class="' + state.trim() + '"></i>';
      }).join('');

      root.innerHTML =
        '<div class="runner">' +
          '<div class="runner__head">' +
            '<button class="icon-btn" data-act="quit" aria-label="Выйти из теста">' + ic('x') + '</button>' +
            '<div class="runner__title">' + esc(test.title) + '</div>' +
            '<span class="runner__timer" id="timer">' + ic('clock') + '<span id="timerVal">–:––</span></span>' +
          '</div>' +
          '<div class="qdots">' + dots + '</div>' +
          '<div class="qcard glass">' +
            '<p class="qcard__num">вопрос ' + (st.idx + 1) + ' / ' + test.questions.length + '</p>' +
            '<p class="qcard__text">' + esc(q.q) + '</p>' +
            '<div id="opts">' + renderOpts(q, st.answers[st.idx], answered) + '</div>' +
            '<div id="explainBox"></div>' +
          '</div>' +
          '<div class="runner__nav">' +
            (answered
              ? '<button class="btn btn--gold btn--full" data-act="next">' + (last ? 'Завершить тест ✦' : 'Следующий вопрос') + '</button>'
              : '') +
          '</div>' +
        '</div>';

      bindQuestion();
      startTimer();
    }

    function renderOpts(q, sel, answered) {
      var keys = ['A', 'B', 'C', 'D', 'E', 'F'];
      return q.options.map(function (opt, i) {
        var cls = 'opt';
        var shown = answered ? (i === q.correct ? ' opt--right' : (i === sel ? ' opt--wrong' : '')) : (i === sel ? ' opt--sel' : '');
        return '<button class="opt' + shown + '" data-opt="' + i + '"' + (answered ? ' disabled' : '') + '>' +
          '<span class="opt__key">' + keys[i] + '</span><span>' + esc(opt) + '</span></button>';
      }).join('');
    }

    function bindQuestion() {
      var q = test.questions[st.idx];

      root.querySelectorAll('[data-opt]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (st.answers[st.idx] !== null) return;
          var i = +btn.dataset.opt;
          st.answers[st.idx] = i;
          stopTimer();
          root.querySelector('#opts').innerHTML = renderOpts(q, i, true);
          var ok = i === q.correct;
          root.querySelector('#explainBox').innerHTML =
            '<div class="explain"><b>' + (ok ? '✓ верно · +10 XP' : 'разбор') + '</b>' + esc(q.explain || '') + '</div>';
          root.querySelector('.runner__nav').innerHTML =
            '<button class="btn btn--gold btn--full" data-act="next">' +
            (st.idx === test.questions.length - 1 ? 'Завершить тест ✦' : 'Следующий вопрос') + '</button>';
          bindNext();
          updateDots();
        });
      });

      root.querySelector('[data-act="quit"]').addEventListener('click', function () {
        var m = UI.modal(
          '<div class="modal__head"><h3>Выйти из теста?</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
          '<p style="color:var(--dust);font-size:14px">Прогресс попытки не сохранится — вопросы можно будет пройти заново.</p>' +
          '<div class="modal__foot"><button class="btn btn--ghost btn--full" data-close>Остаться</button>' +
          '<button class="btn btn--danger btn--full" id="quitYes">Выйти</button></div>'
        );
        m.el.querySelector('#quitYes').addEventListener('click', function () {
          m.close(); cleanup(); location.hash = '#/tests';
        });
      });

      bindNext();
    }

    function bindNext() {
      var btn = root.querySelector('[data-act="next"]');
      if (btn) btn.addEventListener('click', function () {
        if (st.idx < test.questions.length - 1) { st.idx++; render(); }
        else finish();
      });
    }

    function updateDots() {
      root.querySelectorAll('.qdots i').forEach(function (el, i) {
        el.className = st.answers[i] !== null ? 'is-done' : (i === st.idx ? 'is-cur' : '');
      });
    }

    function startTimer() {
      stopTimer();
      var el = root.querySelector('#timerVal'), box = root.querySelector('#timer');
      function tick() {
        var left = Math.max(0, Math.floor((st.deadline - Date.now()) / 1000));
        if (el) el.textContent = UI.fmtDur(left);
        if (left <= 60 && box) box.classList.add('runner__timer--low');
        if (left <= 0) { stopTimer(); finish(true); }
      }
      tick();
      timerId = setInterval(tick, 1000);
    }
    function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

    function finish(byTimeout) {
      if (st.finished) return;
      st.finished = true;
      cleanup();
      var score = st.answers.reduce(function (acc, a, i) {
        return acc + (a === test.questions[i].correct ? 1 : 0);
      }, 0);
      var durSec = Math.round((Date.now() - st.startedAt) / 1000);

      var before = DB.levelOf(user.xp || 0).index;
      DB.addXp(user.id, score * 10);
      var attempt = {
        id: 'a' + Date.now().toString(36),
        testId: test.id, studentId: user.id,
        score: score, max: test.questions.length,
        date: new Date().toISOString().slice(0, 10),
        durSec: durSec, answers: st.answers.slice(),
      };
      DB.addAttempt(attempt);
      if (byTimeout) toast('Время вышло — попытка засчитана', 'warn');
      renderResult(root, attempt, test, before);
    }

    render();
  }

  /* ═══════════ РЕЗУЛЬТАТ ═══════════ */

  function renderResult(root, attempt, test, levelBefore) {
    var user = DB.currentUser();
    var lvlAfter = DB.levelOf(DB.user(user.id).xp || 0);
    var pct = Math.round(attempt.score / attempt.max * 100);
    var verdict = pct >= 90 ? 'Блестящий запуск ✦'
      : pct >= 70 ? 'Выход на орбиту'
      : pct >= 50 ? 'Курс проложен'
      : 'Доработаем курс';
    var sub = pct >= 90 ? 'Так держать — миссия близко'
      : pct >= 70 ? 'Ещё немного до полного сгорания'
      : pct >= 50 ? 'База есть — загляни в разбор ошибок'
      : 'Не страшно. Разбор ошибок — лучший тренажёр';

    root.innerHTML =
      '<div class="runner"><div class="result glass">' +
        '<div class="result__ring" style="--pct:0" id="ring"><div><b>' + attempt.score + '/' + attempt.max + '</b><span>' + pct + '%</span></div></div>' +
        '<div class="result__verdict">' + verdict + '</div>' +
        '<p class="result__sub">' + sub + '</p>' +
        '<div class="badges" style="justify-content:center;margin-bottom:24px">' +
          '<span class="badge badge--on">' + ic('star') + ' +' + (attempt.score * 10) + ' XP</span>' +
          (lvlAfter.index > (levelBefore == null ? lvlAfter.index : levelBefore)
            ? '<span class="badge badge--on">' + ic('rocket') + ' Новый уровень: ' + esc(lvlAfter.level.name) + '</span>'
            : '<span class="badge">' + ic('rocket') + ' ' + esc(lvlAfter.level.name) + '</span>') +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
          '<a class="btn btn--ghost" href="#/tests">К списку тестов</a>' +
          '<button class="btn btn--gold" id="reviewBtn">Разбор ошибок</button>' +
        '</div>' +
      '</div></div>';

    /* мягкая анимация кольца */
    var ring = root.querySelector('#ring'), cur = 0;
    requestAnimationFrame(function loop() {
      cur += (pct - cur) * 0.12;
      if (Math.abs(pct - cur) < 0.5) cur = pct;
      ring.style.setProperty('--pct', cur.toFixed(1));
      if (cur !== pct) requestAnimationFrame(loop);
    });

    root.querySelector('#reviewBtn').addEventListener('click', function () {
      renderReview(root, test, attempt.answers);
    });
  }

  /* ═══════════ РАЗБОР ═══════════ */

  function renderReview(root, test, answers) {
    var keys = ['A', 'B', 'C', 'D', 'E', 'F'];
    var html = test.questions.map(function (q, qi) {
      var a = answers ? answers[qi] : null;
      var opts = q.options.map(function (opt, i) {
        var cls = 'opt';
        if (i === q.correct) cls += ' opt--right';
        else if (i === a) cls += ' opt--wrong';
        return '<div class="' + cls + '"><span class="opt__key">' + keys[i] + '</span><span>' + esc(opt) + '</span></div>';
      }).join('');
      return '<div class="qcard glass" style="margin-bottom:12px">' +
        '<p class="qcard__num">вопрос ' + (qi + 1) + ' · ' + (a === q.correct ? '<span style="color:var(--green)">верно</span>' : '<span style="color:var(--red)">ошибка</span>') + '</p>' +
        '<p class="qcard__text">' + esc(q.q) + '</p>' + opts +
        (q.explain ? '<div class="explain"><b>разбор</b>' + esc(q.explain) + '</div>' : '') +
        '</div>';
    }).join('');

    root.innerHTML =
      '<div class="runner">' +
        '<div class="runner__head">' +
          '<a class="icon-btn" href="#/tests" aria-label="Назад">' + ic('back') + '</a>' +
          '<div class="runner__title">Разбор: ' + esc(test.title) + '</div>' +
        '</div>' + html +
        '<a class="btn btn--ghost btn--full" href="#/tests" style="margin-top:14px">К списку тестов</a>' +
      '</div>';
    window.scrollTo(0, 0);
  }

  /* ═══════════ КОНСТРУКТОР (преподаватель) ═══════════ */

  function renderBuilder(root, testId) {
    var user = DB.currentUser();
    if (!user || user.role !== 'teacher') { location.hash = '#/tests'; return; }

    var src = testId ? DB.test(testId) : null;
    var st = src
      ? {
          id: src.id, title: src.title, subject: src.subject, timeMin: src.timeMin,
          assignedGroups: src.assignedGroups.slice(),
          questions: JSON.parse(JSON.stringify(src.questions)),
          authorId: src.authorId,
        }
      : {
          id: 'q' + Date.now().toString(36), title: '', subject: 'SAT Math', timeMin: 10,
          assignedGroups: DB.groupsFor(user).map(function (g) { return g.id; }),
          questions: [{ q: '', options: ['', '', '', ''], correct: 0, explain: '' }],
          authorId: user.id,
        };

    function render() {
      var groupBoxes = DB.groupsFor(user).map(function (g) {
        var on = st.assignedGroups.indexOf(g.id) !== -1;
        return '<label class="opt-row' + (on ? ' opt-row--right' : '') + '" style="padding:6px 0;cursor:pointer">' +
          '<input type="checkbox" data-group="' + g.id + '" ' + (on ? 'checked' : '') + ' style="display:none">' +
          '<span class="opt-row__radio"></span><span>' + esc(g.name) + '</span></label>';
      }).join('');

      var qRows = st.questions.map(function (q, qi) {
        var opts = q.options.map(function (opt, oi) {
          return '<div class="opt-row' + (q.correct === oi ? ' opt-row--right' : '') + '">' +
            '<button type="button" class="opt-row__radio" data-correct="' + qi + ':' + oi + '" title="Отметить правильным" aria-label="Отметить правильным"></button>' +
            '<input class="input" data-opt="' + qi + ':' + oi + '" value="' + esc(opt) + '" placeholder="Вариант ' + 'ABCD'[oi] + '">' +
            '</div>';
        }).join('');
        return '<div class="qrow glass" style="margin-bottom:12px">' +
          '<div class="qrow__head"><b>ВОПРОС ' + (qi + 1) + '</b>' +
            '<button type="button" class="icon-btn icon-btn--danger" data-delq="' + qi + '" aria-label="Удалить вопрос">' + ic('trash') + '</button></div>' +
          '<textarea class="input" data-q="' + qi + '" placeholder="Текст вопроса">' + esc(q.q) + '</textarea>' +
          opts +
          '<input class="input" data-explain="' + qi + '" value="' + esc(q.explain || '') + '" placeholder="Разбор (показывается после ответа)">' +
          '</div>';
      }).join('');

      root.innerHTML =
        '<div class="page-head">' +
          '<p class="eyebrow">' + (src ? 'редактирование теста' : 'конструктор теста') + '</p>' +
          '<div class="page-head__row"><h1>' + (src ? 'Редактировать' : 'Новый тест') + '</h1>' +
          '<a class="icon-btn" href="#/tests" aria-label="Назад">' + ic('back') + '</a></div>' +
        '</div>' +
        '<div class="glass card stack" style="margin-bottom:16px">' +
          '<label class="field"><span class="field__label">название</span>' +
            '<input class="input" id="tbTitle" value="' + esc(st.title) + '" placeholder="SAT Math · Тема урока"></label>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<label class="field"><span class="field__label">предмет</span>' +
              '<select class="input" id="tbSubject">' +
                ['SAT Math', 'SAT R/W', 'Milliy Sertifikat', 'English', 'Другое'].map(function (s) {
                  return '<option ' + (st.subject === s ? 'selected' : '') + '>' + s + '</option>';
                }).join('') + '</select></label>' +
            '<label class="field"><span class="field__label">время, мин</span>' +
              '<input class="input" id="tbTime" type="number" min="1" max="180" value="' + st.timeMin + '"></label>' +
          '</div>' +
          '<div class="field"><span class="field__label">кому доступен</span>' + groupBoxes + '</div>' +
        '</div>' +
        '<div id="qRows">' + qRows + '</div>' +
        '<button class="btn btn--ghost btn--full" id="addQ" style="margin-top:2px">' + ic('plus') + ' Добавить вопрос</button>' +
        '<button class="btn btn--gold btn--full" id="saveTest" style="margin-top:12px">Сохранить тест ✦</button>' +
        '<p class="mono" style="text-align:center;font-size:11px;color:var(--dust-2);margin-top:12px">тест появится у учеников выбранных групп сразу после сохранения</p>';

      bind();
    }

    function bind() {
      root.querySelector('#tbTitle').addEventListener('input', function (e) { st.title = e.target.value; });
      root.querySelector('#tbSubject').addEventListener('change', function (e) { st.subject = e.target.value; });
      root.querySelector('#tbTime').addEventListener('input', function (e) { st.timeMin = +e.target.value || 10; });

      root.querySelectorAll('[data-group]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var id = cb.dataset.group;
          var i = st.assignedGroups.indexOf(id);
          if (cb.checked && i === -1) st.assignedGroups.push(id);
          if (!cb.checked && i !== -1) st.assignedGroups.splice(i, 1);
          render();
        });
      });

      root.querySelectorAll('[data-q]').forEach(function (ta) {
        ta.addEventListener('input', function () { st.questions[+ta.dataset.q].q = ta.value; });
      });
      root.querySelectorAll('[data-opt]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var p = inp.dataset.opt.split(':');
          st.questions[+p[0]].options[+p[1]] = inp.value;
        });
      });
      root.querySelectorAll('[data-explain]').forEach(function (inp) {
        inp.addEventListener('input', function () { st.questions[+inp.dataset.explain].explain = inp.value; });
      });
      root.querySelectorAll('[data-correct]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var p = btn.dataset.correct.split(':');
          st.questions[+p[0]].correct = +p[1];
          render();
        });
      });
      root.querySelectorAll('[data-delq]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (st.questions.length <= 1) { toast('В тесте должен остаться хотя бы один вопрос', 'warn'); return; }
          st.questions.splice(+btn.dataset.delq, 1);
          render();
        });
      });

      root.querySelector('#addQ').addEventListener('click', function () {
        st.questions.push({ q: '', options: ['', '', '', ''], correct: 0, explain: '' });
        render();
        var rows = root.querySelectorAll('.qrow');
        rows[rows.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      root.querySelector('#saveTest').addEventListener('click', function () {
        var errors = [];
        if (!st.title.trim()) errors.push('название теста');
        var clean = [];
        st.questions.forEach(function (q, i) {
          var opts = q.options.map(function (o) { return o.trim(); });
          var filled = opts.filter(Boolean).length;
          if (!q.q.trim()) { errors.push('текст вопроса ' + (i + 1)); return; }
          if (filled < 2) { errors.push('минимум 2 варианта в вопросе ' + (i + 1)); return; }
          if (!opts[q.correct]) { errors.push('правильный вариант в вопросе ' + (i + 1) + ' пустой'); return; }
          clean.push({ q: q.q.trim(), options: opts, correct: q.correct, explain: (q.explain || '').trim() });
        });
        if (!st.assignedGroups.length) errors.push('выберите хотя бы одну группу');
        if (errors.length) {
          toast('Заполните: ' + errors.slice(0, 3).join('; ') + (errors.length > 3 ? '…' : ''), 'warn');
          return;
        }
        DB.saveTest({
          id: st.id, title: st.title.trim(), subject: st.subject, timeMin: Math.max(1, st.timeMin),
          assignedGroups: st.assignedGroups.slice(), questions: clean,
          authorId: st.authorId, created: 1,
        });
        toast(src ? 'Тест обновлён' : 'Тест сохранён — ученики его уже видят ✦');
        location.hash = '#/tests';
      });
    }

    render();
  }

  /* ═══════════ МОДАЛКА РЕЗУЛЬТАТОВ (преподаватель) ═══════════ */

  function showAttempts(testId) {
    var test = DB.test(testId);
    if (!test) return;
    var attempts = DB.attemptsForTest(testId).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    var rows = attempts.map(function (a) {
      var u = DB.user(a.studentId);
      var pct = Math.round(a.score / a.max * 100);
      var cls = pct >= 70 ? 'attempt__score--good' : pct < 50 ? 'attempt__score--bad' : '';
      return '<div class="attempt">' +
        '<span class="attempt__score ' + cls + '">' + a.score + '/' + a.max + '</span>' +
        '<div class="attempt__main"><b>' + esc(u ? u.name : '?') + '</b>' +
        '<span>' + UI.dayLabel(a.date) + ' · ' + Math.round(a.durSec / 60) + ' мин</span></div></div>';
    }).join('');

    UI.modal(
      '<div class="modal__head"><h3>' + esc(test.title) + '</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
      (attempts.length
        ? '<div class="stack">' + rows + '</div>'
        : '<div class="empty">' + ic('clipboard') + '<b>Пока никто не решал</b><p>Как только ученики пройдут тест, результаты появятся здесь</p></div>')
    );
  }

  return { renderRunner: renderRunner, renderReview: renderReview, renderBuilder: renderBuilder, showAttempts: showAttempts, cleanup: cleanup };
})();
