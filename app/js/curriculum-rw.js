/* ═══════════════════════════════════════════════════════════
   VOSKHOD — учебный план SAT Reading & Writing + Эссе.
   Темы соответствуют доменам банка вопросов (bank-rw.js).
   mode:'written' — письменные работы с проверкой преподавателя.
   ═══════════════════════════════════════════════════════════ */

window.CURRICULUM_RW_BLOCKS = [

  /* ═══════ БЛОК F: READING ═══════ */
  {
    id: 'F',
    title: 'SAT Reading',
    icon: '✦',
    color: 'eng',
    desc: 'Информация и идеи, структура текста, слова в контексте.',
    topics: [
      {
        id: 'f1',
        title: 'Information & Ideas',
        domain: 'Information and Ideas',
        body: '<p>Главную мысль ищи в <b>topic sentence</b> — первое-второе предложение. Выводы делай только из текста: правильный ответ всегда осторожен.</p>' +
          '<div class="th-ex"><b>Пример.</b> «Пчёлы упали на 40% после ослабления запрета» → осторожный вывод: пестициды, вероятно, вредят. Категоричное «уничтожают всех» — ловушка.</div>' +
          '<h4>Command of Evidence</h4>' +
          '<div class="th-formula">измеренные данные до/после = лучшее доказательство работы программы</div>' +
          '<div class="th-tip">В inference-вопросах вычёркивай варианты с always, never, proof — правильный ответ осторожен: «may», «suggests».</div>',
      },
      {
        id: 'f2',
        title: 'Craft & Structure',
        domain: 'Craft and Structure',
        body: '<p>Три типа вопросов: слова в контексте, цель упоминания, структура текста.</p>' +
          '<h4>Слова в контексте</h4>' +
          '<p>Закрой варианты, придумай своё слово, найди сигналы (but/colon/although) и подбирай.</p>' +
          '<div class="th-ex"><b>Пример.</b> «известна ___ объяснениями: даже сложное становится простым» → lucid (ясный).</div>' +
          '<h4>Цель упоминания</h4>' +
          '<p>«Why does the author mention X» — почти всегда: как конкретный пример, поддерживающий тезис абзаца.</p>' +
          '<div class="th-tip">Учи слова парами контрастов: lucid↔obscure, conventional↔unorthodox, explicit↔implicit.</div>',
      },
    ],
  },

  /* ═══════ БЛОК G: EXPRESSION & CONVENTIONS ═══════ */
  {
    id: 'G',
    title: 'Expression & Conventions',
    icon: '⌁',
    color: 'eng',
    desc: 'Переходы, логика предложений и грамматические нормы — самые «формульные» баллы.',
    topics: [
      {
        id: 'g1',
        title: 'Transitions & Logic',
        domain: 'Expression of Ideas',
        body: '<p>Переходы — дорожные знаки логики. Определи отношение частей и выбери знак:</p>' +
          '<div class="th-formula">добавление: moreover, furthermore · контраст: however, nevertheless · следствие: therefore, as a result · пример: for instance</div>' +
          '<div class="th-ex"><b>Пример.</b> «Прибыль не выросла» после «расходы сократили» — ожидание нарушено → Nevertheless.</div>' +
          '<div class="th-tip">Не читай варианты, пока не понял отношение частей своими словами — SAT ловит «красивые» слова без логики.</div>',
      },
      {
        id: 'g2',
        title: 'Standard English Conventions',
        domain: 'Standard English Conventions',
        body: '<h4>Границы предложений</h4>' +
          '<div class="th-formula">две клаузы: точка с запятой · запятая + FANBOYS · двоеточие для пояснения</div>' +
          '<h4>Согласование</h4>' +
          '<ul><li>each/neither/nor → ближайшее подлежащее</li>' +
          '<li>«list of items IS» — предлогная фраза не меняет число</li></ul>' +
          '<h4>Частые ловушки</h4>' +
          '<ul><li>its (притяжательное) ≠ it’s (it is)</li>' +
          '<li>fewer (исчисляемые) / less (неисчисляемые)</li>' +
          '<li>between you and ME (объектный падеж)</li>' +
          '<li>Инверсия: Rarely HAS it been…</li></ul>' +
          '<div class="th-tip">Параллелизм: not only X but also Y — одинаковые грамматические формы по обе стороны.</div>',
      },
    ],
  },

  /* ═══════ БЛОК H: ЭССЕ И ПИСЬМО ═══════ */
  {
    id: 'H',
    title: 'Эссе и письмо',
    icon: '✉',
    color: 'gold',
    desc: 'Цифровой SAT эссе не имеет, но поступление и TOEFL — имеют. Пишешь — преподаватель проверяет.',
    topics: [
      {
        id: 'h1',
        title: 'Personal Statement',
        mode: 'written',
        minWords: 200,
        prompt: 'Напиши фрагмент личного заявления (200–250 слов) на тему: момент, который изменил твоё отношение к учёбе. Покажи, а не расскажи: конкретная сцена, детали, вывод.',
        body: '<p>Личное заявление — не список достижений, а <b>одна сцена, которая тебя показывает</b>.</p>' +
          '<div class="th-formula">Hook (сцена) → конфликт/поворот → что изменилось → связь с будущим</div>' +
          '<div class="th-ex"><b>Слабо.</b> «Я всегда любил математику и усердно учился.»<br><b>Сильно.</b> «В 2 часа ночи я переписывал задачу седьмой раз — и впервые заметил в ней узор.»</div>' +
          '<div class="th-tip">Показывай через детали: не «я упорный», а сцена, где упорство видно без слов.</div>',
      },
      {
        id: 'h2',
        title: 'Supplemental Essay «Why Us»',
        mode: 'written',
        minWords: 150,
        prompt: 'Напиши фрагмент эссе «Why us» (150–200 слов) для университета своей мечты: конкретная программа или профессор + чем именно ты подойдёшь им.',
        body: '<p>«Why us» проверяет, что ты изучил университет. Формула сильного ответа:</p>' +
          '<div class="th-formula">1 конкретная программа/ресурс + твой опыт + что ты принесёшь им</div>' +
          '<div class="th-ex"><b>Пример.</b> Не «у вас сильный факультет», а «лаборатория профессора X изучает именно то, чем я занимался в олимпиадном проекте».</div>' +
          '<div class="th-tip">Общие фразы («great campus», «renowned faculty») — маркер слабого эссе. Конкретика = балл.</div>',
      },
      {
        id: 'h3',
        title: 'TOEFL Independent Writing',
        mode: 'written',
        minWords: 180,
        prompt: 'Напиши independent-эссе (180+ слов): «Do you agree: students learn more online than in classrooms?» Тезис + 2 причины с примерами + вывод.',
        body: '<div class="th-formula">Intro (тезис) → П1 (reason + example) → П2 (reason + example) → Conclusion</div>' +
          '<p>Топик-сентенс каждого абзаца — одно конкретное утверждение. Академический регистр: без слэнга и восклицаний.</p>' +
          '<div class="th-tip">Шаблоны экономят минуты: заготовь вступительные фразы и связки (furthermore, however, for instance).</div>',
      },
      {
        id: 'h4',
        title: 'Аргументативное эссе',
        mode: 'written',
        minWords: 200,
        prompt: 'Напиши аргументативный фрагмент (200+ слов) на тему: «Should admissions tests be optional?» Контраргумент обязателен + опровержение.',
        body: '<p>Сильное аргументативное эссе признаёт <b>контраргумент</b> и разбирает его — это главный признак зрелого письма.</p>' +
          '<div class="th-formula">Тезис → аргументы → «Admittedly, …» контраргумент → опровержение → вывод</div>' +
          '<div class="th-tip">Admittedly / While it is true that — слова, которые показывают комиссии: ты видишь другую сторону.</div>',
      },
    ],
  },
];

/* ═══════════ реестр предметов ═══════════ */

window.CURRICULUM_ALL = (function () {
  var subs = [];
  if (window.CURRICULUM && window.CURRICULUM.blocks) {
    subs.push({ id: 'sat-math', name: 'SAT Math', icon: '∑', blocks: window.CURRICULUM.blocks });
  }
  subs.push({ id: 'sat-rw', name: 'SAT R&W', icon: '✦', blocks: window.CURRICULUM_RW_BLOCKS.slice(0, 2) });
  subs.push({ id: 'writing', name: 'Эссе', icon: '✉', blocks: window.CURRICULUM_RW_BLOCKS.slice(2) });

  subs.forEach(function (s) {
    s.blocks.forEach(function (b) {
      b.subject = s.id;
      b.subjectName = s.name;
      b.topics.forEach(function (t) { t.subject = s.id; });
    });
  });

  function allBlocks() {
    var out = [];
    subs.forEach(function (s) { out = out.concat(s.blocks); });
    return out;
  }
  function allTopics() {
    var out = [];
    allBlocks().forEach(function (b) {
      b.topics.forEach(function (t) { out.push({ block: b, topic: t }); });
    });
    return out;
  }
  function topicById(id) {
    var list = allTopics();
    for (var i = 0; i < list.length; i++) if (list[i].topic.id === id) return list[i];
    return null;
  }
  function subjectById(id) {
    return subs.find(function (s) { return s.id === id; }) || null;
  }

  return { subjects: subs, allBlocks: allBlocks, allTopics: allTopics, topicById: topicById, subjectById: subjectById };
})();
