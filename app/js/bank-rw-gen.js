/* ═══════════════════════════════════════════════════════════
   VOSKHOD — генераторы Standard English Conventions / Expression
   of Ideas. Каждый make() → уникальный вопрос со случайными
   подлежащими, маркерами времени и переходами.
   sh(arr, correct) перемешивает варианты и сам находит индекс
   правильного ответа.
   ═══════════════════════════════════════════════════════════ */

window.BANK_RW_GEN = (function () {
  'use strict';

  function ri(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(a) { return a[ri(0, a.length - 1)]; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function sh(arr, correctVal) {
    var options = shuffle(arr.slice());
    return { options: options, correct: options.indexOf(correctVal) };
  }

  var SUBJECTS = ['The curator of the museum', 'A team of volunteers', 'The mayor’s assistant', 'The collection of letters', 'A group of engineers', 'The director of the program', 'The organizer of the festival', 'A panel of judges'];

  var G = [];
  function reg(domain, difficulties, make) { G.push({ domain: domain, difficulties: difficulties, make: make }); }

  /* 1. SVA: единственное число с along with */
  reg('Standard English Conventions', ['easy', 'medium'], function () {
    var s = pick(SUBJECTS), verb = pick([['is', 'are'], ['was', 'were'], ['has', 'have']]);
    var sing = pick(['remarkably well documented', 'open to the public', 'difficult to translate', 'under review']);
    return Object.assign(sh([verb[0], verb[1], verb[0] + ' been', verb[1] + ' been'], verb[0]), {
      q: s + ', along with several assistants, ______ ' + sing + '.<br><br>Which choice completes the text so that it conforms to the conventions of Standard English?',
      explain: 'Подлежащее «' + s + '» — единственное число; фраза с along with не меняет число глагола → ' + verb[0] + '.',
    });
  });

  /* 2. SVA: neither nor */
  reg('Standard English Conventions', ['medium'], function () {
    var pair = pick([
      [['the sailors', 'were'], ['the captain', 'was']],
      [['the students', 'were'], ['the teacher', 'was']],
      [['the pilots', 'were'], ['the mechanic', 'was']],
      [['the delegates', 'were'], ['the chairman', 'was']],
    ]);
    var far = pair[0], near_ = pair[1];
    return Object.assign(sh([near_[1], far[1], near_[1] + ' been', 'is being'], near_[1]), {
      q: 'Neither ' + far[0] + ' nor ' + near_[0] + ' ______ aware of the storm’s approach.<br><br>Which choice completes the text so that it conforms to the conventions of Standard English?',
      explain: 'С neither…nor глагол согласуется с ближайшим подлежащим («' + near_[0] + '») → ' + near_[1] + '.',
    });
  });

  /* 3. Времена: since/for */
  reg('Standard English Conventions', ['easy', 'medium'], function () {
    var city = pick(['Tashkent', 'Samarkand', 'Almaty', 'Bishkek', 'Astana', 'Dushanbe']);
    var year = ri(1995, 2020), yrs = new Date().getFullYear() - year;
    var marker = pick(['since ' + year, 'for over ' + yrs + ' years']);
    return Object.assign(sh(['has lived', 'lives', 'lived', 'is living'], 'has lived'), {
      q: 'She ______ in ' + city + ' ' + marker + '.<br><br>Which choice completes the text so that it conforms to the conventions of Standard English?',
      explain: '«' + marker + '» — период, продолжающийся до настоящего момента → Present Perfect: has lived.',
    });
  });

  /* 4. Past Simple vs Present Perfect */
  reg('Standard English Conventions', ['medium'], function () {
    var person = pick(['The novelist', 'The architect', 'The biologist', 'The composer']);
    var year = ri(1960, 2015);
    return Object.assign(sh(['wrote', 'has written', 'writes', 'was writing'], 'wrote'), {
      q: person + ' ______ her most famous work in ' + year + ', decades before it was adapted for film.<br><br>Which choice completes the text so that it conforms to the conventions of Standard English?',
      explain: 'Указан закрытый момент в прошлом (' + year + ') → Past Simple: wrote.',
    });
  });

  /* 5. its / it's */
  reg('Standard English Conventions', ['easy'], function () {
    var thing = pick(['The museum', 'The theater', 'The library', 'The gallery']);
    return Object.assign(sh(['its', 'it’s', 'its’', 'it is'], 'its'), {
      q: thing + ' announced that ______ winter schedule will include weekend tours.<br><br>Which choice completes the text so that it conforms to the conventions of Standard English?',
      explain: 'Притяжательное местоимение its (без апострофа); it’s = it is.',
    });
  });

  /* 6. fewer / less */
  reg('Standard English Conventions', ['medium'], function () {
    var countable = pick([['visitors', 'fewer'], ['complaints', 'fewer'], ['passengers', 'fewer'], ['delays', 'fewer']]);
    var uncountable = pick([['traffic', 'less'], ['noise', 'less'], ['pollution', 'less']]);
    var right = countable[1] + ' … ' + uncountable[1];
    return Object.assign(sh([right, uncountable[1] + ' … ' + countable[1], 'fewer … fewer', 'less … less'], right), {
      q: 'The new timetable produced ______ ' + countable[0] + ' and ______ ' + uncountable[0] + ' at the station.<br><br>Which choice completes the text so that it conforms to the conventions of Standard English?',
      explain: 'Исчисляемые (' + countable[0] + ') → fewer; неисчисляемые (' + uncountable[0] + ') → less.',
    });
  });

  /* 7. Запятая + FANBOYS */
  reg('Standard English Conventions', ['medium'], function () {
    var fan = pick(['and', 'but', 'so']);
    var right = 'dawn, ' + fan + ' the';
    return Object.assign(sh([right, 'dawn ' + fan + ' the', 'dawn; ' + fan + ' the', 'dawn the'], right), {
      q: 'The expedition set out at dawn, ______ the weather turned by noon.<br><br>Which choice completes the text so that it conforms to the conventions of Standard English?',
      explain: 'Две самостоятельные клаузы → запятая + союз: dawn, ' + fan + ' the weather…',
    });
  });

  /* 8. Вводная фраза → запятая */
  reg('Standard English Conventions', ['medium'], function () {
    var intro = pick(['After the restoration was complete', 'Once the votes were counted', 'When the excavation ended', 'Before the results were published']);
    return Object.assign(sh([intro + ',', intro, intro + ';', intro + ':'], intro + ','), {
      q: '______ the team published its findings in a peer-reviewed journal.<br><br>Which choice completes the text so that it conforms to the conventions of Standard English?',
      explain: 'Вводная зависимая клауза отделяется запятой.',
    });
  });

  /* 9. who / which */
  reg('Standard English Conventions', ['medium'], function () {
    var person = pick(['The astronomer', 'The cartographer', 'The naturalist', 'The engineer']);
    var thing = pick(['the telescope', 'the map', 'the manuscript', 'the bridge']);
    var deed = pick(['taught at the university', 'wrote three treatises', 'led the expedition', 'funded the workshop']);
    return Object.assign(sh(['who', 'which', 'whose', 'whom'], 'who'), {
      q: person + ' ______ designed the instrument also ' + deed + ' that improved ' + thing + '.<br><br>Which choice completes the text so that it conforms to the conventions of Standard English?',
      explain: 'Относительное местоимение для человека в роли подлежащего → who.',
    });
  });

  /* 10. Переход: добавление */
  reg('Expression of Ideas', ['easy', 'medium'], function () {
    var pair = pick([
      ['reduces energy costs', 'improves air quality for riders', 'Moreover'],
      ['shortens commute times', 'lowers stress for passengers', 'Furthermore'],
      ['preserves historic facades', 'attracts new businesses to the district', 'In addition'],
    ]);
    return Object.assign(sh([pair[2], 'However', 'Meanwhile', 'In contrast'], pair[2]), {
      q: 'The tram line ' + pair[0] + '. ______, it ' + pair[1] + '.<br><br>Which choice completes the text with the most logical transition?',
      explain: 'Второе преимущество дополняет первое → переход добавления ' + pair[2] + '.',
    });
  });

  /* 11. Переход: контраст */
  reg('Expression of Ideas', ['medium'], function () {
    var pair = pick([
      ['was expected to fail', 'became a model for the region', 'Yet'],
      ['drew few visitors at first', 'now anchors the city’s tourism', 'Nevertheless'],
      ['began as a single classroom', 'grew into a university', 'Still'],
    ]);
    return Object.assign(sh([pair[2], 'Therefore', 'Moreover', 'For instance'], pair[2]), {
      q: 'The program ' + pair[0] + '. ______, it ' + pair[1] + '.<br><br>Which choice completes the text with the most logical transition?',
      explain: 'Ожидание и реальность противоположны → переход контраста ' + pair[2] + '.',
    });
  });

  /* 12. Переход: причина-следствие */
  reg('Expression of Ideas', ['medium', 'hard'], function () {
    var pair = pick([
      ['The bridge inspection revealed corrosion', 'the city closed two lanes', 'As a result'],
      ['Attendance fell for a third season', 'the theater revised its programming', 'Consequently'],
      ['The river flooded twice in a decade', 'engineers redesigned the levees', 'Therefore'],
    ]);
    return Object.assign(sh([pair[2], 'Nevertheless', 'Similarly', 'In contrast'], pair[2]), {
      q: pair[0] + '. ______, ' + pair[1].charAt(0).toLowerCase() + pair[1].slice(1) + '.<br><br>Which choice completes the text with the most logical transition?',
      explain: 'Причина → следствие → ' + pair[2] + '.',
    });
  });

  /* 13. than I / than me */
  reg('Standard English Conventions', ['hard'], function () {
    return Object.assign(sh(['I', 'me', 'myself', 'mine'], 'I'), {
      q: 'The curator was more skeptical about the dating than ______, so she ordered a second analysis.<br><br>Which choice completes the text so that it conforms to the conventions of Standard English?',
      explain: 'Than — сравнение с подлежащим (than I [was]) → субъектное местоимение I.',
    });
  });

  /* 14. Параллелизм not only… but also */
  reg('Standard English Conventions', ['medium', 'hard'], function () {
    var pair = pick([
      ['restored the frescoes', 'rebuilt the dome'],
      ['digitized the manuscripts', 'translated the marginalia'],
      ['mapped the ruins', 'catalogued the artifacts'],
    ]);
    var right = 'not only ' + pair[0] + ' but also ' + pair[1];
    return Object.assign(sh([
      right,
      'not only ' + pair[0] + ' but also they ' + pair[1],
      'not only ' + pair[0] + ' but also to ' + pair[1],
      'not only did ' + pair[0] + ' but also ' + pair[1],
    ], right), {
      q: 'The foundation ______ , drawing visitors from three countries.<br><br>Which choice completes the text so that it conforms to the conventions of Standard English?',
      explain: 'not only… but also требует параллельных форм: not only ' + pair[0] + ' but also ' + pair[1] + '.',
    });
  });

  /* 15. Переход: пример */
  reg('Expression of Ideas', ['easy'], function () {
    var pair = pick([
      ['Ancient roads followed the contours of the land', 'the via publica climbed ridges rather than crossing valleys', 'For instance'],
      ['Medieval ports grew around river mouths', 'London and Bruges began as river towns', 'For example'],
    ]);
    return Object.assign(sh([pair[2], 'However', 'Nevertheless', 'Therefore'], pair[2]), {
      q: pair[0] + '. ______, ' + pair[1].charAt(0).toLowerCase() + pair[1].slice(1) + '.<br><br>Which choice completes the text with the most logical transition?',
      explain: 'Второе предложение — пример первого → ' + pair[2] + '.',
    });
  });

  /* 16. whose / who's */
  reg('Standard English Conventions', ['medium'], function () {
    return Object.assign(sh(['whose', 'who’s', 'whos’', 'who is'], 'whose'), {
      q: 'The historian ______ lectures on the Silk Road won a national award will speak at the conference.<br><br>Which choice completes the text so that it conforms to the conventions of Standard English?',
      explain: 'Whose — притяжательное («чьи лекции»); who’s = who is.',
    });
  });

  return {
    all: G,
    draw: function (difficulty, count) {
      var pool = G.filter(function (g) { return g.difficulties.indexOf(difficulty) !== -1; });
      var out = [];
      for (var i = 0; i < count && pool.length; i++) {
        var g = pool[ri(0, pool.length - 1)];
        var q = g.make();
        q.domain = g.domain;
        q.difficulty = difficulty;
        out.push(q);
      }
      return out;
    },
  };
})();
