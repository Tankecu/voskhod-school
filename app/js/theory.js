/* ═══════════════════════════════════════════════════════════
   VOSKHOD Orbit — библиотека теории.
   Русские объяснения с английскими терминами — как на уроках.
   Классы внутри body: .th-formula .th-ex .th-tip
   ═══════════════════════════════════════════════════════════ */

window.THEORY = [

  {
    id: 'sat-info', title: 'О цифровом SAT', icon: '◈', color: 'gold',
    topics: [
      {
        id: 'format', title: 'Как устроен цифровой SAT', minutes: 7, test: null,
        body: '<p>С 2024 года SAT сдаётся <b>только на компьютере</b> — через приложение College Board под названием <b>Bluebook</b>. Наш пробник повторяет его структуру.</p>' +
          '<h4>Структура экзамена</h4>' +
          '<div class="th-formula">Reading &amp; Writing: 2 модуля × 27 вопросов × 32 мин<br>перерыв 10 минут<br>Math: 2 модуля × 22 вопроса × 35 мин<br>итого: 98 вопросов · 134 минуты · шкала 400–1600</div>' +
          '<h4>Адаптивность — главная фишка</h4>' +
          '<p>Сложность <b>Module 2</b> зависит от результата Module 1: решил первый модуль хорошо — получишь более сложный (и более «дорогой») второй. Поэтому первые вопросы модуля 1 критически важны: они выбирают твою траекторию.</p>' +
          '<h4>Что можно в Bluebook</h4><ul>' +
          '<li>Двигаться по вопросам <b>внутри модуля</b> в любом порядке, ставить флажки «вернуться позже»</li>' +
          '<li>Между модулями <b>нельзя вернуться назад</b> — ответы блокируются</li>' +
          '<li>В Math — встроенный <b>графический калькулятор</b> Desmos и справочник формул на любом вопросе</li>' +
          '<li>Секундомер модуля всегда на экране; время не переносится между модулями</li></ul>' +
          '<h4>Стратегия</h4><ul>' +
          '<li>Трать на лёгкие вопросы 30–40 секунд, копи время на сложные в конце</li>' +
          '<li>Флажок — не признание поражения, а инструмент: сомневаешься — пометь и иди дальше</li>' +
          '<li>Пропуск без штрафа: пустых ответов лучше не оставлять — угадай в конце</li>' +
          '<li>Баллы: каждая секция 200–800. Примерно 60% правильных с учётом адаптива дают около 550–600</li></ul>' +
          '<div class="th-tip">Пробник в разделе «Пробник» — это полный формат: 98 вопросов, таймеры, калькулятор, формулы. Сдай его до того, как сядешь за настоящий Bluebook — формат перестанет пугать.</div>',
      },
    ],
  },

  {
    id: 'sat-math', title: 'SAT Math', icon: '∑', color: 'math',
    topics: [
      {
        id: 'percentages', title: 'Percentages & Proportions', minutes: 12, test: 'b1',
        body: '<p>Проценты — самая частая тема первого модуля SAT Math. Главная формула:</p>' +
          '<div class="th-formula">part = percent × whole</div>' +
          '<p><b>Percent change</b> всегда считается от <i>исходного</i> значения:</p>' +
          '<div class="th-formula">%change = (new − old) / old × 100%</div>' +
          '<div class="th-ex"><b>Пример.</b> Цена выросла с $48 до $60. (60−48)/48 = 0.25 → <b>+25%</b>. Обратная ошибка — делить на 60.</div>' +
          '<p><b>Последовательные изменения не складываются:</b> +25% и −20% дают 1.25 × 0.80 = 1.00 — вернулись к исходной цене. А +40% и −40% дают 0.84 — потеряли 16%.</p>' +
          '<div class="th-tip">Лайфхак: рост на 1/n компенсируется падением на 1/(n+1). +25% (=1/4) гасится −20% (=1/5).</div>' +
          '<p><b>Direct proportion:</b> y = kx. Найди k по одной паре значений, подставь вторую. <b>Inverse:</b> xy = k — перемножь пару.</p>' +
          '<div class="th-ex"><b>Пример.</b> y ∝ x, при x=4 → y=14. Тогда k=3.5, при x=10 → y=35.</div>',
      },
      {
        id: 'linear', title: 'Linear Equations & Inequalities', minutes: 12, test: 'b2',
        body: '<p>Форма прямой: <b>y = mx + b</b>, где m — slope (наклон), b — y-intercept.</p>' +
          '<div class="th-formula">slope m = (y₂ − y₁) / (x₂ − x₁)</div>' +
          '<p>Параллельные прямые: одинаковый m. Перпендикулярные: m₂ = −1/m₁.</p>' +
          '<div class="th-ex"><b>Пример.</b> Прямая через (1,2) и (3,10): m = 8/2 = 4. Перпендикуляр к ней: −1/4.</div>' +
          '<h4>Особые случаи</h4><ul>' +
          '<li><b>Infinitely many solutions:</b> уравнение — тождество (5x+3 = 5x+3 → коэффициенты равны).</li>' +
          '<li><b>No solution:</b> x сокращается, а остаток ложный (0 = 7).</li>' +
          '<li><b>System:</b> сложи уравнения, чтобы убрать переменную.</li></ul>' +
          '<div class="th-ex"><b>Пример.</b> x+y=10, x−y=4 → складываем: 2x=14, x=7, y=3.</div>' +
          '<h4>Модуль и неравенства</h4>' +
          '<div class="th-formula">|A| &lt; B ⟺ −B &lt; A &lt; B &nbsp;&nbsp;|A| &gt; B ⟺ A &gt; B или A &lt; −B</div>' +
          '<div class="th-tip">В словесных задачах («plan costs $20 plus $0.05 per minute») фиксированная часть — b, а ставка за единицу — m: cost = 0.05m + 20.</div>',
      },
      {
        id: 'functions', title: 'Functions & Quadratics', minutes: 14, test: 'b3',
        body: '<p>Функция — это машина: f(x) = 2x+1 означает «подставь x, получи результат». f(2) = 5. Запись f(f(2)) читается изнутри: f(2)=5, потом f(5)=11.</p>' +
          '<h4>Вершина параболы</h4>' +
          '<div class="th-formula">y = a(x − h)² + k → вершина (h, k)<br>y = ax² + bx + c → x = −b / 2a</div>' +
          '<div class="th-ex"><b>Пример.</b> y = x² − 4x: x = 4/2 = 2, y = 4 − 8 = <b>−4</b> — минимальное значение.</div>' +
          '<h4>Разложение (factoring)</h4>' +
          '<p>x² − 5x + 6 = (x − 2)(x − 3) → корни 2 и 3. Ищи два числа с суммой −5 и произведением 6.</p>' +
          '<h4>Сдвиги графика</h4><ul>' +
          '<li>f(x − 3) — сдвиг <b>вправо</b> на 3 (внутри минус = вправо!)</li>' +
          '<li>f(x) + 2 — сдвиг <b>вверх</b> на 2</li>' +
          '<li>По корням: корни r₁, r₂ → a(x−r₁)(x−r₂)</li></ul>' +
          '<div class="th-tip">Вопрос «при каком k бесконечно много решений» = тождество: приравняй коэффициенты.</div>',
      },
      {
        id: 'data', title: 'Data, Statistics & Probability', minutes: 10, test: 'b4',
        body: '<h4>Средние</h4>' +
          '<div class="th-formula">mean = сумма / количество<br>median = середина отсортированного ряда<br>mode = самое частое значение</div>' +
          '<div class="th-ex"><b>Пример.</b> Среднее пяти чисел = 12 → сумма 60. Убрали 20 → (60−20)/4 = 10.</div>' +
          '<h4>Вероятность</h4>' +
          '<div class="th-formula">P = благоприятные / все возможные<br>P(A и B) = P(A) × P(B) — независимые<br>P(хотя бы один) = 1 − P(ни одного)</div>' +
          '<div class="th-ex"><b>Пример.</b> Две красные из 4 красных и 6 синих: (4/10)×(3/9) = 2/15 — без возврата второй шанс уменьшается.</div>' +
          '<h4>Линия тренда (line of best fit)</h4>' +
          '<p>Уравнение y = 4x + 20 — это <i>прогноз модели</i>: подставь x и получи предсказанное y. Interpolation — внутри данных, extrapolation — снаружи (менее надёжно).</p>' +
          '<div class="th-tip">Вопросы про «обоснованность вывода»: корреляция ≠ причинность. Правильный ответ обычно осторожный по формулировке.</div>',
      },
    ],
  },

  {
    id: 'sat-rw', title: 'SAT Reading & Writing', icon: '✦', color: 'eng',
    topics: [
      {
        id: 'vocab', title: 'Vocabulary in Context', minutes: 10, test: 'b5',
        body: '<p>SAT не спрашивает редкие слова — он проверяет, умеешь ли ты выбрать <i>точное значение по контексту</i>. Алгоритм:</p>' +
          '<ol><li>Закрой варианты. Прочитай предложение и придумай своё слово.</li>' +
          '<li>Найди <b>сигналы</b>: but / however / although — контраст; so / therefore / colon (:) — пояснение или следствие.</li>' +
          '<li>Подставляй свой синоним в каждый вариант.</li></ol>' +
          '<div class="th-ex"><b>Пример.</b> «The professor is known for ___ explanations: even complex ideas become simple.» После двоеточия пояснение «сложное становится простым» → нужно слово «ясный» → <b>lucid</b>.</div>' +
          '<h4>Слова-фавориты SAT</h4>' +
          '<p>buttressed (подкреплён), lucid (ясный), conventional (обычный), unorthodox (необычный), ambiguous (двусмысленный), pragmatic (практичный), undermine (подрывать), corroborate (подтверждать), meticulous (дотошный), redundant (избыточный).</p>' +
          '<div class="th-tip">Учи слова не списками, а парами контрастов: lucid↔obscure, conventional↔unorthodox, explicit↔implicit. Пары держатся в памяти вдвое дольше.</div>',
      },
      {
        id: 'transitions', title: 'Transitions & Sentence Logic', minutes: 10, test: 'b6',
        body: '<p>Переходы (transitions) — это дорожные знаки логики. Определи отношение двух частей — и выбери знак:</p>' +
          '<table class="th-table"><tr><th>Отношение</th><th>Слова</th></tr>' +
          '<tr><td>Добавление</td><td>moreover, furthermore, in addition, likewise</td></tr>' +
          '<tr><td>Контраст</td><td>however, nevertheless, by contrast, still</td></tr>' +
          '<tr><td>Причина → следствие</td><td>therefore, consequently, as a result, thus</td></tr>' +
          '<tr><td>Пример</td><td>for instance, for example</td></tr>' +
          '<tr><td>Уступка</td><td>although, even though, despite</td></tr></table>' +
          '<div class="th-ex"><b>Пример.</b> «The startup cut costs dramatically. ___, its profits did not improve.» Ожидали рост прибыли, его нет → контраст с ожиданием → <b>Nevertheless</b>.</div>' +
          '<h4>Грамматика рядом</h4><ul>' +
          '<li>После предпозиции — объектные местоимения: between <b>you and me</b>.</li>' +
          '<li>rather than + глагол-ing: rather than <b>addressing</b>.</li>' +
          '<li>Some… others…: парные местоимения.</li></ul>' +
          '<div class="th-tip">Спойлер-метод: не читай варианты, пока не понял отношение частей своими словами. SAT ловит тех, кто выбирает «красивое» слово без логики.</div>',
      },
      {
        id: 'evidence', title: 'Command of Evidence & Inference', minutes: 12, test: 'b7',
        body: '<p><b>Inference</b> — вывод, который <i>обязательно следует</i> из текста, не больше и не меньше. Ищи ответ «в аккуратной середине»: слишком сильные формулировки (always, never, proof) — ловушка.</p>' +
          '<div class="th-ex"><b>Пример.</b> «Популяции пчёл упали на 40% после ослабления запрета на пестициды» → осторожный вывод: пестициды, вероятно, вредят. Вывод «пестициды убивают всех пчёл» — слишком сильный.</div>' +
          '<h4>Типы вопросов</h4><ul>' +
          '<li><b>Purpose</b>: «зачем автор упоминает X?» — почти всегда: как пример/доказательство основной мысли.</li>' +
          '<li><b>Attitude</b>: тон автора — по модальным словам («evidence keeps piling up» = осторожная убеждённость).</li>' +
          '<li><b>Data</b>: корреляция обе растут → positive correlation; измеренные данные до/после — лучшее доказательство.</li></ul>' +
          '<div class="th-tip">Правило умеренности: в вопросах на inference правильный ответ почти никогда не содержит always, never, must, proof. Ищи cautiously, likely, suggests.</div>',
      },
    ],
  },

  {
    id: 'grammar', title: 'English Grammar', icon: '⬡', color: 'math',
    topics: [
      {
        id: 'tenses', title: 'Tenses: система времён', minutes: 14, test: 'b8',
        body: '<p>В английском 12 времён, но SAT/Milliy/TOEFL проверяют в основном 6. Ориентируйся на <b>маркеры</b>:</p>' +
          '<table class="th-table"><tr><th>Время</th><th>Маркеры</th><th>Пример</th></tr>' +
          '<tr><td>Present Simple</td><td>every day, usually, факты</td><td>Water <b>boils</b> at 100°C.</td></tr>' +
          '<tr><td>Present Continuous</td><td>now, at the moment, Listen!</td><td>Someone <b>is playing</b> the piano.</td></tr>' +
          '<tr><td>Present Perfect</td><td>already, just, yet, since, for, this month</td><td>I <b>have done</b> my homework already.</td></tr>' +
          '<tr><td>Past Simple</td><td>yesterday, in 1990, ago</td><td>They <b>built</b> the bridge in 1990.</td></tr>' +
          '<tr><td>Past Continuous</td><td>while, when (фоновое действие)</td><td>While I <b>was cooking</b>, the phone rang.</td></tr>' +
          '<tr><td>Past Perfect</td><td>by the time, before (в прошлом)</td><td>The lecture <b>had started</b> before we arrived.</td></tr></table>' +
          '<div class="th-tip">since + точка начала (since 2019), for + длительность (for ten years). «This month/week» = незакрытый период → Present Perfect.</div>' +
          '<div class="th-ex"><b>Пример-ловушка.</b> «I saw this movie three times» — ошибка: результат важен сейчас → «I <b>have seen</b> this movie three times».</div>',
      },
      {
        id: 'conditionals', title: 'Conditionals & Modals', minutes: 12, test: 'b9',
        body: '<h4>Три основных условных</h4>' +
          '<div class="th-formula">1st: If + Present Simple → will + V (реальный шанс)<br>2nd: If + Past Simple → would + V (нереально сейчас)<br>3rd: If + had V3 → would have V3 (нереально в прошлом)</div>' +
          '<div class="th-ex"><b>Примеры.</b> If it <b>rains</b>, we will stay. / If I <b>were</b> you, I would apply. / If she <b>had studied</b>, she <b>would have passed</b>.</div>' +
          '<p>Во втором типе be = <b>were</b> для всех лиц: If I were you.</p>' +
          '<h4>Модальные глаголы</h4><ul>' +
          '<li><b>mustn’t</b> — запрещено ≠ <b>don’t have to</b> — необязательно</li>' +
          '<li><b>must</b> — уверенный вывод по признакам: «The lights are off. They must be asleep.»</li>' +
          '<li><b>can’t</b> — «не может быть»: That can’t be true!</li></ul>' +
          '<h4>wish</h4>' +
          '<p>wish + Past Simple — сожаление о настоящем: I wish I <b>had</b> more time. wish + Past Perfect — о прошлом: I wish I <b>had studied</b> harder.</p>' +
          '<div class="th-tip">Двойное «would» в if-части — всегда ошибка: ❌ If I would have… → ✅ If I had…</div>',
      },
    ],
  },

  {
    id: 'toefl', title: 'TOEFL', icon: '◎', color: 'eng',
    topics: [
      {
        id: 'reading', title: 'Academic Reading', minutes: 12, test: 'b10',
        body: '<p>Академические тексты построены строго: у абзаца есть <b>topic sentence</b> — обычно первое или второе предложение. Начинай поиск главной мысли именно там.</p>' +
          '<h4>Служебные слова-указатели</h4><ul>' +
          '<li>by contrast / however — будет противоположность</li>' +
          '<li>for instance — сейчас будет пример</li>' +
          '<li>this trend / this approach — местоимение указывает <b>назад</b>, на предыдущую мысль</li></ul>' +
          '<h4>Типы вопросов</h4><ul>' +
          '<li><b>Vocabulary in context:</b> подставь свой синоним, а не «словарное» значение.</li>' +
          '<li><b>Purpose:</b> «Why does the author mention…?» — почти всегда «как пример, поддерживающий идею».</li>' +
          '<li><b>Inference:</b> вывод строго из текста, без внешних знаний.</li></ul>' +
          '<div class="th-ex"><b>Пример.</b> «Universities are increasingly adopting blended learning» → blended = смешанное (часть онлайн, часть очно). Контекст важнее словаря.</div>' +
          '<div class="th-tip">Тайминг TOEFL Reading: ~1.5 минуты на вопрос. Не зависай: пометь и возвращайся позже.</div>',
      },
      {
        id: 'writing', title: 'Writing & Speaking', minutes: 12, test: 'b11',
        body: '<h4>Integrated Essay (20 мин)</h4>' +
          '<p>Reading утверждает X → лекция <b>противоречит</b> X. Твоя задача — не мнение, а точный отчёт: «According to the lecture…, which casts doubt on the reading’s claim that…».</p>' +
          '<h4>Independent Essay (30 мин)</h4>' +
          '<div class="th-formula">Intro (тезис) → П1 (reason + example) → П2 (reason + example) → Conclusion</div>' +
          '<p>Topic sentence = одно конкретное утверждение: ❌ «I will talk about remote work» → ✅ «Remote work offers employees flexibility that improves productivity.»</p>' +
          '<h4>Speaking 45 секунд</h4>' +
          '<div class="th-formula">Opinion (1 фраза) → Reason 1 + пример (15 сек) → Reason 2 + пример (15 сек) → Wrap-up</div>' +
          '<h4>Академический регистр</h4><ul>' +
          '<li>❌ kinda, super cool, you must believe → ✅ a considerable number of, moreover</li>' +
          '<li> furthermore = добавить пункт; however = контраст</li>' +
          '<li>Заключение = restate thesis, без новых аргументов</li></ul>' +
          '<div class="th-tip">Шаблоны — твой друг на экзамене: заготовь вступительные фразы заранее и экономь 3 минуты на организацию.</div>',
      },
    ],
  },

  {
    id: 'milliy', title: 'Milliy Sertifikat', icon: '⬡', color: 'gold',
    topics: [
      {
        id: 'format', title: 'Как устроен экзамен', minutes: 8, test: 'b13',
        body: '<p><b>Milliy Sertifikat</b> — национальный сертификат Узбекистана по английскому (и математике). Уровни B2/C1 открывают президентские и государственные программы, квоты и гранты.</p>' +
          '<h4>Из чего состоит экзамен</h4><ul>' +
          '<li><b>Reading</b> — понимание текстов возрастающей сложности</li>' +
          '<li><b>Writing</b> — письмо (email/essay) на B2+ лексике</li>' +
          '<li><b>Listening</b> — диалоги и монологи в реальном темпе</li>' +
          '<li><b>Speaking</b> — беседа с экзаменатором</li></ul>' +
          '<p>Хорошая новость: формат сильно пересекается с TOEFL, поэтому подготовка идёт параллельно.</p>' +
          '<div class="th-tip">Сертификат бессрочный по уровню, но программы требуют «свежую» дату сдачи — планируй за 6–8 месяцев до дедлайна заявки.</div>',
      },
      {
        id: 'strategy', title: 'Стратегия подготовки', minutes: 10, test: 'b13',
        body: '<p>Экзамен проверяет <b>уровень языка</b>, а не знание хитростей. Поэтому траектория такая:</p>' +
          '<ol><li><b>Грамматический каркас</b> (месяцы 1–2): времена, conditionals, модальные глаголы — без этого Reading превращается в угадывание.</li>' +
          '<li><b>Лексика по темам</b> (месяцы 2–5): education, technology, environment — топики экзамена предсказуемы.</li>' +
          '<li><b>Формат</b> (последние 2 месяца): пробники по таймеру, разбор ошибок, разговорная практика еженедельно.</li></ol>' +
          '<h4>Ежедневный минимум (60–90 мин)</h4><ul>' +
          '<li>20 мин — грамматика: одна тема + 10 предложений письменно</li>' +
          '<li>20 мин — чтение: одна статья + выписать 5 новых слов</li>' +
          '<li>15 мин — аудирование (подкаст/сериал с субтитрами)</li>' +
          '<li>10 мин — говорение вслух: перескажи день по-английски</li></ul>' +
          '<div class="th-tip">Speaking растёт только от говорения вслух. 10 минут монолога в день дают больше, чем час молчаливого чтения правил.</div>',
      },
    ],
  },
];
