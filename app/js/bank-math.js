/* ═══════════════════════════════════════════════════════════
   VOSKHOD — банк Math-генераторов.
   Каждый генератор создаёт УНИКАЛЬНЫЙ вопрос: случайные числа,
   вычисленный правильный ответ, правдоподобные дистракторы,
   объяснение. make(difficulty) → {q, options, correct, explain}
   ═══════════════════════════════════════════════════════════ */

window.BANK_MATH = (function () {
  'use strict';

  function ri(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = ri(0, i);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }

  /* сборка вариантов: правильный + 3 уникальных дистрактора */
  function mc(correctNum, cands) {
    var correct = String(correctNum);
    var seen = {};
    seen[correct] = true;
    var distractors = [];
    for (var i = 0; i < cands.length && distractors.length < 3; i++) {
      var c = String(cands[i]);
      if (c === 'NaN' || c === 'undefined') continue;
      if (!seen[c]) { seen[c] = true; distractors.push(c); }
    }
    var bump = 1;
    while (distractors.length < 3) {
      var alt = String(Number(correctNum) + bump);
      if (!seen[alt]) { seen[alt] = true; distractors.push(alt); }
      bump = bump > 0 ? -(bump + 1) : -(bump - 1); /* +1, −2, +3… */
    }
    var options = shuffle([correct].concat(distractors));
    return { options: options, correct: options.indexOf(correct) };
  }

  var G = [];
  function reg(domain, difficulties, make) {
    G.push({ domain: domain, difficulties: difficulties, make: make });
  }

  /* ═══════════ ALGEBRA ═══════════ */

  reg('Algebra', ['easy'], function () {
    var a = ri(2, 9), x = ri(2, 12), b = ri(1, 20), c = a * x + b;
    var m = mc(x, [x + a, x - 1, c - b - a + 1]);
    return {
      q: 'If ' + a + 'x + ' + b + ' = ' + c + ', what is the value of x?',
      options: m.options, correct: m.correct,
      explain: a + 'x = ' + c + ' − ' + b + ' = ' + (c - b) + ' → x = ' + (c - b) + '/' + a + ' = ' + x + '.',
    };
  });

  reg('Algebra', ['medium'], function () {
    var x = ri(2, 9), a = ri(2, 5), b = ri(1, 6), d = pick([1, 2, 3]);
    var c = a; /* a(x+b) = c(x+d) подбирается: c = a, тогда xb = a d + c d − ... */
    /* строим от ответа: a(x+b) = k(x+d) → k(x+d) = a x + a b → k = a, ab = a d? нет.
       проще: (x + b) = d, линейное из скобок: p(x + b) = q → x = q/p − b */
    var p = ri(2, 6), inner = ri(2, 9), q = p * (x + b), discard = inner;
    var m = mc(x, [x + p, x - b, q / p + b]);
    return {
      q: 'If ' + p + '(x + ' + b + ') = ' + q + ', what is the value of x?',
      options: m.options, correct: m.correct,
      explain: 'x + ' + b + ' = ' + q + '/' + p + ' = ' + (x + b) + ' → x = ' + x + '.',
    };
  });

  reg('Algebra', ['easy'], function () {
    var x1 = ri(0, 4), y1 = ri(0, 8), dx = ri(1, 4), m = ri(1, 5);
    var x2 = x1 + dx, y2 = y1 + m * dx;
    var m2 = mc(m, [m + 1, dx, m * dx, -m]);
    return {
      q: 'A line passes through the points (' + x1 + ', ' + y1 + ') and (' + x2 + ', ' + y2 + '). What is the slope of the line?',
      options: m2.options, correct: m2.correct,
      explain: 'm = (' + y2 + ' − ' + y1 + ')/(' + x2 + ' − ' + x1 + ') = ' + (y2 - y1) + '/' + dx + ' = ' + m + '.',
    };
  });

  reg('Algebra', ['medium'], function () {
    var x = ri(2, 8), y = ri(2, 9), a = ri(2, 4), b = ri(1, 5);
    /* x + y = S, x − y = D */
    var S = x + y, D = x - y;
    var m = mc(x * y, [x + y, x - y, x]);
    return {
      q: 'In the system x + y = ' + S + ' and x − y = ' + D + ', what is the value of xy?',
      options: m.options, correct: m.correct,
      explain: 'Складываем: 2x = ' + (S + D) + ' → x = ' + x + '; y = ' + S + ' − ' + x + ' = ' + y + ' → xy = ' + (x * y) + '.',
    };
  });

  reg('Algebra', ['easy'], function () {
    var fee = ri(2, 9) * 5, per = ri(4, 15), m = ri(2, 10);
    var total = fee + per * m;
    var mm = mc(m, [m + 1, m - 1, Math.round(total / fee)]);
    return {
      q: 'A gym charges a one-time fee of $' + fee + ' plus $' + per + ' per month. If Maria paid a total of $' + total + ', for how many months m did she pay?',
      options: mm.options, correct: mm.correct,
      explain: fee + ' + ' + per + 'm = ' + total + ' → m = ' + m + '.',
    };
  });

  reg('Algebra', ['easy'], function () {
    var m = ri(2, 8), b = ri(1, 12), x = ri(1, 6);
    var y = m * x + b;
    var mm = mc(y, [y + m, b, m * x, y - b]);
    return {
      q: 'The function C = ' + m + 'n + ' + b + ' gives the total cost in dollars for n items. What is the total cost for ' + x + ' items?',
      options: mm.options, correct: mm.correct,
      explain: 'C = ' + m + '(' + x + ') + ' + b + ' = ' + y + '.',
    };
  });

  reg('Algebra', ['hard'], function () {
    var m1 = ri(2, 6), x1 = ri(0, 3), y1 = ri(0, 6);
    var perp = -1 / m1, b = y1 - perp * x1;
    var bFrac = (b % 1 === 0) ? String(b) : b.toFixed(2);
    var mm = mc(bFrac, [String(m1), String(-m1), String(y1)]);
    return {
      q: 'A line passes through the point (' + x1 + ', ' + y1 + ') and is perpendicular to the line y = ' + m1 + 'x − 4. What is the y-intercept of this line?',
      options: mm.options, correct: mm.correct,
      explain: 'Перпендикулярный наклон = −1/' + m1 + '. y = −(1/' + m1 + ')x + b; подставляем точку: b = ' + y1 + ' + (' + x1 + '/' + m1 + ') = ' + bFrac + '.',
    };
  });

  reg('Algebra', ['hard'], function () {
    var k = ri(2, 9);
    var mm = mc('for all values of x', ['for exactly one value of x', 'for no values of x', 'only when k = 0']);
    return {
      q: 'The equation k(x + 2) = kx + ' + (2 * k) + ' is true:',
      options: mm.options, correct: mm.correct,
      explain: 'Раскрываем: kx + ' + (2 * k) + ' = kx + ' + (2 * k) + ' — тождество, верно при любом x (k ≠ 0).',
    };
  });

  reg('Algebra', ['medium'], function () {
    var m = ri(2, 8), t = ri(2, 9), b = ri(1, 12);
    var mm = mc('x > ' + t, ['x < ' + t, 'x > ' + (t + 2), 'x < ' + (t - 2)]);
    return {
      q: 'Which inequality describes all solutions of ' + m + 'x − ' + (m * t - b) + ' > ' + b + '?',
      options: mm.options, correct: mm.correct,
      explain: m + 'x > ' + (m * t) + ' → x > ' + t + '.',
    };
  });

  reg('Algebra', ['medium'], function () {
    var c = ri(2, 9), d = ri(2, 9);
    var mm = mc(2 * c, [c + d, 2 * d, c]);
    return {
      q: 'If |x − ' + c + '| = ' + d + ', what is the sum of all solutions for x?',
      options: mm.options, correct: mm.correct,
      explain: 'x = ' + (c + d) + ' или x = ' + (c - d) + '; сумма = (' + (c + d) + ') + (' + (c - d) + ') = ' + (2 * c) + '.',
    };
  });

  reg('Algebra', ['easy'], function () {
    var rate = ri(3, 15), n = ri(4, 12), total = rate * n;
    var mm = mc(n, [total, total / rate + 1, n + 2]);
    return {
      q: 'A printer produces ' + rate + ' pages per minute. How many minutes will it take to produce ' + total + ' pages?',
      options: mm.options, correct: mm.correct,
      explain: total + ' ÷ ' + rate + ' = ' + n + ' минут.',
    };
  });

  reg('Algebra', ['hard'], function () {
    var a = ri(2, 5), b = ri(2, 8), x = ri(2, 6);
    var y = a * x - b;
    var mm = mc(y, [a * x + b, y + 1, b]);
    return {
      q: 'If y = ' + a + 'x − ' + b + ' and x = ' + x + ', what is y?',
      options: mm.options, correct: mm.correct,
      explain: 'y = ' + a + ' · ' + x + ' − ' + b + ' = ' + y + '.',
    };
  });

  /* ═══════════ ADVANCED MATH ═══════════ */

  reg('Advanced Math', ['medium'], function () {
    var r1 = ri(1, 6), r2 = ri(1, 6) * pick([1, -1]);
    var b = -(r1 + r2), c = r1 * r2;
    var mm = mc('x = ' + r1 + ' and x = ' + r2, ['x = ' + (-r1) + ' and x = ' + (-r2), 'x = ' + r1 + ' and x = ' + (-r2), 'x = ' + b + ' and x = ' + c]);
    return {
      q: 'What are the solutions of x² ' + (b >= 0 ? '+ ' + b : '− ' + Math.abs(b)) + ' ' + (c >= 0 ? '+ ' + c : '− ' + Math.abs(c)) + ' = 0?',
      options: mm.options, correct: mm.correct,
      explain: '(x − ' + r1 + ')(x − ' + r2 + ') = 0 → x = ' + r1 + ' или x = ' + r2 + '.',
    };
  });

  reg('Advanced Math', ['medium'], function () {
    var h = ri(1, 6), k = -ri(1, 9);
    var b = -2 * h, c = h * h + k;
    var mm = mc('(' + (-h) + ', ' + k + ')', ['(' + h + ', ' + k + ')', '(' + (-h) + ', ' + (-k) + ')', '(' + h + ', ' + (-k) + ')']);
    return {
      q: 'The parabola y = x² ' + (b >= 0 ? '+ ' + b : '− ' + Math.abs(b)) + 'x ' + (c >= 0 ? '+ ' + c : '− ' + Math.abs(c)) + ' has its vertex at:',
      options: mm.options, correct: mm.correct,
      explain: 'x = −b/2a = ' + h + '; y = (' + h + ')² ' + (b >= 0 ? '+' + b : '−' + Math.abs(b)) + '·' + h + ' ' + (k >= 0 ? '+' + k : '−' + Math.abs(k)) + ' = ' + k + ' → вершина (' + h + ', ' + k + ').',
    };
  });

  reg('Advanced Math', ['easy'], function () {
    var h = ri(1, 7), k = ri(-9, -1);
    var mm = mc('(' + (-h) + ', ' + k + ')', ['(' + h + ', ' + k + ')', '(' + (-h) + ', ' + (-k) + ')', '(0, ' + k + ')']);
    return {
      q: 'The vertex of the parabola y = (x ' + (h >= 0 ? '− ' + h : '+ ' + Math.abs(h)) + ')² ' + (k >= 0 ? '+ ' + k : '− ' + Math.abs(k)) + ' is at:',
      options: mm.options, correct: mm.correct,
      explain: 'Vertex form y = (x − h)² + k → вершина (' + (-h) + ', ' + k + ').',
    };
  });

  reg('Advanced Math', ['medium'], function () {
    var e1 = ri(4, 8), e2 = ri(1, e1 - 2);
    var mm = mc('x^' + (e1 - e2), ['x^' + (e1 + e2), 'x^' + (e1 * e2), 'x^' + e2]);
    return {
      q: 'Which expression is equivalent to x^' + e1 + ' / x^' + e2 + '? Assume x ≠ 0.',
      options: mm.options, correct: mm.correct,
      explain: 'При делении степеней показатели вычитаются: x^(' + e1 + ' − ' + e2 + ') = x^' + (e1 - e2) + '.',
    };
  });

  reg('Advanced Math', ['medium'], function () {
    var start = ri(2, 8) * 100, dbl = pick([2, 3]), t = ri(1, 3) * dbl;
    var mm = mc(start + ' · 2^' + (t / dbl), [start + ' · 2^' + t, start + ' · ' + (t / dbl), '2^' + t]);
    return {
      q: 'A population of ' + start + ' bacteria doubles every ' + dbl + ' hours. Which equation gives P, the population after t hours?',
      options: ['P = ' + start + ' · 2^(t/' + dbl + ')', 'P = ' + start + ' · 2^t', 'P = ' + start + ' + ' + dbl + 't', 'P = ' + (start * 2) + ' · t'], correct: 0,
      explain: 'Каждые ' + dbl + ' ч — умножение на 2 → показатель t/' + dbl + '.',
    };
  });

  reg('Advanced Math', ['medium'], function () {
    var a = ri(2, 5), b = ri(1, 4), x = ri(2, 6);
    var fa = a * x * x, g = x - b;
    var mm = mc(fa, [a * x, fa + b, (x - b) * (x - b)]);
    return {
      q: 'If f(x) = ' + a + 'x² and g(x) = x − ' + b + ', what is f(g(' + x + '))?',
      options: mm.options, correct: mm.correct,
      explain: 'g(' + x + ') = ' + g + '; f(' + g + ') = ' + a + ' · ' + g + '² = ' + fa + '.',
    };
  });

  reg('Advanced Math', ['hard'], function () {
    var h = ri(2, 5), k = ri(2, 6);
    var mm = mc('(x − ' + (h - 1) + ')² + ' + (k - 2), ['(x − ' + (h + 1) + ')² + ' + (k + 2), '(x + ' + (h - 1) + ')² + ' + (k - 2), '(x − ' + (h - 1) + ')² + ' + (k + 2)]);
    return {
      q: 'The graph of y = (x − ' + h + ')² + ' + k + ' is shifted 1 unit left and 2 units down. What is the new equation?',
      options: mm.options, correct: mm.correct,
      explain: 'Влево: x − ' + h + ' + 1 = x − ' + (h - 1) + '; вниз: ' + k + ' − 2 = ' + (k - 2) + '.',
    };
  });

  reg('Advanced Math', ['hard'], function () {
    var x = ri(4, 9), a = ri(1, 3);
    /* √(x+a) = x − b, подбираем b так, что x — корень: (x−b)² = x+a → b = x − √(x+a) — не всегда целый.
       Генерируем наоборот: b = ri, x = b + s, s = √(x+a) → x + a = s² → a = s² − x */
    var s = ri(2, 6), bb = ri(0, 2);
    x = bb + s;
    var aa = s * s - x;
    var mm = mc(x, [s, bb, x + aa]);
    return {
      q: 'If √(' + x + ' + ' + aa + ') = x − ' + bb + ', what is the value of x?',
      options: mm.options, correct: mm.correct,
      explain: 'Возводим в квадрат: x + ' + aa + ' = (x − ' + bb + ')² → x = ' + x + ' (проверка: √' + (x + aa) + ' = ' + s + ' = ' + x + ' − ' + bb + ' ✓). Посторонний корень отброшен проверкой.',
    };
  });

  reg('Advanced Math', ['hard'], function () {
    var r1 = ri(1, 5), r2 = -ri(1, 5);
    var mm = mc('x² ' + (-(r1 + r2) >= 0 ? '+ ' + (-(r1 + r2)) : '− ' + Math.abs(r1 + r2)) + 'x ' + (r1 * r2 >= 0 ? '+ ' + r1 * r2 : '− ' + Math.abs(r1 * r2)) + ' = 0',
      ['x² + ' + (r1 + r2) + 'x − ' + r1 * r2 + ' = 0', 'x² − ' + r1 * r2 + 'x + ' + (r1 + r2) + ' = 0', 'x² + ' + r1 * r2 + 'x = 0']);
    return {
      q: 'A quadratic equation has roots ' + r1 + ' and ' + r2 + '. Which equation is it?',
      options: mm.options, correct: mm.correct,
      explain: '(x − ' + r1 + ')(x + ' + Math.abs(r2) + ') = x² ' + (-(r1 + r2) >= 0 ? '+ ' : '− ') + Math.abs(r1 + r2) + 'x ' + (r1 * r2 >= 0 ? '+ ' : '− ') + Math.abs(r1 * r2) + '.',
    };
  });

  reg('Advanced Math', ['hard'], function () {
    var h = ri(1, 5), p = ri(1, 4);
    var c = h * h - p; /* x² − 2h x + c имеет ровно один корень при c = h² */
    var mm = mc(h * h, [h, h * h + p, p]);
    return {
      q: 'For what value of c does x² − ' + (2 * h) + 'x + c = 0 have exactly one real solution?',
      options: mm.options, correct: mm.correct,
      explain: 'Дискриминант = 0: (2h)² − 4c = 0 → c = h² = ' + (h * h) + '.',
    };
  });

  /* ═══════════ PROBLEM-SOLVING AND DATA ANALYSIS ═══════════ */

  reg('Problem-Solving and Data Analysis', ['easy'], function () {
    var old_ = ri(4, 20) * 10, drop = ri(10, 40);
    var nw = Math.round(old_ * (100 - drop) / 100);
    var mm = mc(drop + '%', [(100 - drop) + '%', (drop - 5) + '%', (drop + 5) + '%']);
    return {
      q: 'A price fell from $' + old_ + ' to $' + nw + '. What was the approximate percent decrease?',
      options: mm.options, correct: mm.correct,
      explain: '(' + old_ + ' − ' + nw + ')/' + old_ + ' ≈ ' + drop + '%.',
    };
  });

  reg('Problem-Solving and Data Analysis', ['medium'], function () {
    var n = ri(4, 6), mean = ri(6, 15);
    var sum = mean * n, known = [], s = 0;
    for (var i = 0; i < n - 1; i++) { var v = ri(2, mean + 8); known.push(v); s += v; }
    var missing = sum - s;
    var mm = mc(missing, [missing + 1, mean, sum]);
    return {
      q: 'The average (arithmetic mean) of ' + n + ' numbers is ' + mean + '. If ' + (n - 1) + ' of the numbers are ' + known.join(', ') + ', what is the missing number?',
      options: mm.options, correct: mm.correct,
      explain: 'Сумма = ' + n + ' × ' + mean + ' = ' + sum + '; известные дают ' + s + ' → пропущено ' + missing + '.',
    };
  });

  reg('Problem-Solving and Data Analysis', ['medium'], function () {
    var vals = [ri(1, 9), ri(10, 19), ri(20, 29), ri(30, 39), ri(40, 49)];
    var add = ri(50, 90);
    var sorted = vals.slice().sort(function (a, b) { return a - b; });
    var oldMed = sorted[2];
    var all = vals.concat([add]).sort(function (a, b) { return a - b; });
    var newMed = (all[2] + all[3]) / 2;
    var mm = mc(newMed, [oldMed, add, (all[3] + all[4]) / 2]);
    return {
      q: 'The median of the list ' + vals.join(', ') + ' is ' + oldMed + '. If the number ' + add + ' is added to the list, the new median is:',
      options: mm.options, correct: mm.correct,
      explain: 'Отсортировано: ' + all.join(', ') + ' → медиана = (' + all[2] + ' + ' + all[3] + ')/2 = ' + newMed + '.',
    };
  });

  reg('Problem-Solving and Data Analysis', ['easy'], function () {
    var red = ri(2, 8), blue = ri(2, 8), green = ri(2, 8);
    var total = red + blue + green;
    var mm = mc(red + '/' + total, [blue + '/' + total, red + '/' + blue, green + '/' + total]);
    return {
      q: 'A jar contains ' + red + ' red, ' + blue + ' blue, and ' + green + ' green marbles. One marble is drawn at random. What is the probability that it is red?',
      options: mm.options, correct: mm.correct,
      explain: 'P = ' + red + '/' + total + '.',
    };
  });

  reg('Problem-Solving and Data Analysis', ['hard'], function () {
    var r = ri(3, 6), b = ri(3, 6), g = ri(2, 5);
    var total = r + b + g;
    var p = (r / total) * ((r - 1) / (total - 1));
    var pFrac = simplifyFraction(r * (r - 1), total * (total - 1));
    var mm = mc(pFrac, [(r / total).toFixed(2), ((r - 1) / total).toFixed(2), simplifyFraction(r, total - 1)]);
    return {
      q: 'A jar contains ' + r + ' red and ' + b + ' blue marbles' + (g ? ' and ' + g + ' green marbles' : '') + '. Two marbles are drawn at random without replacement. What is the probability that both are red?',
      options: mm.options, correct: mm.correct,
      explain: '(' + r + '/' + total + ') × (' + (r - 1) + '/' + (total - 1) + ') = ' + pFrac + ' ≈ ' + p.toFixed(3) + '.',
    };
  });

  function simplifyFraction(n, d) {
    var g = gcd(n, d);
    return (n / g) + '/' + (d / g);
  }

  reg('Problem-Solving and Data Analysis', ['medium'], function () {
    var unit = ri(15, 90), n1 = ri(2, 6), n2 = n1 + ri(2, 5);
    var mm = mc(unit * n2, [unit * n1, unit + n2, unit * (n2 - n1)]);
    return {
      q: 'A recipe for ' + n1 + ' servings uses ' + unit * n1 + ' grams of flour. At the same rate, how many grams of flour are needed for ' + n2 + ' servings?',
      options: mm.options, correct: mm.correct,
      explain: unit * n1 + '/' + n1 + ' = ' + unit + ' г на порцию → ' + unit + ' × ' + n2 + ' = ' + (unit * n2) + ' г.',
    };
  });

  reg('Problem-Solving and Data Analysis', ['medium'], function () {
    var slope = ri(3, 9), base = ri(10, 60), x = ri(4, 12);
    var y = slope * x + base;
    var mm = mc(y, [slope * x, y + slope, base]);
    return {
      q: 'The line of best fit for a scatterplot is y = ' + slope + 'x + ' + base + ', where x is hours studied and y is the exam score. What score does the model predict for ' + x + ' hours of studying?',
      options: mm.options, correct: mm.correct,
      explain: 'y = ' + slope + ' · ' + x + ' + ' + base + ' = ' + y + '.',
    };
  });

  reg('Problem-Solving and Data Analysis', ['medium'], function () {
    var sampled = ri(2, 5) * 40, pct = pick([30, 40, 55, 60, 70, 75]);
    var inSample = Math.round(sampled * pct / 100);
    var school = sampled * ri(6, 12);
    var est = Math.round(school * pct / 100 / 10) * 10;
    var mm = mc('about ' + est, ['about ' + inSample, 'about ' + school, 'about ' + (est + 500)]);
    return {
      q: 'In a random sample of ' + sampled + ' students, ' + inSample + ' supported a new schedule. The school has ' + school + ' students. If the sample is representative, approximately how many students support the new schedule?',
      options: mm.options, correct: mm.correct,
      explain: inSample + '/' + sampled + ' = ' + pct + '% → ' + pct + '% × ' + school + ' ≈ ' + est + '.',
    };
  });

  reg('Problem-Solving and Data Analysis', ['medium'], function () {
    var sd = ri(2, 9), add = ri(5, 30);
    var mm = mc(sd, [sd + add, add, sd * 2]);
    return {
      q: 'Data set A has a standard deviation of ' + sd + '. In data set B, every value of A is increased by ' + add + '. What is the standard deviation of B?',
      options: mm.options, correct: mm.correct,
      explain: 'Сдвиг на константу не меняет разброс → SD = ' + sd + '.',
    };
  });

  /* ═══════════ GEOMETRY AND TRIGONOMETRY ═══════════ */

  reg('Geometry and Trigonometry', ['easy'], function () {
    var a = ri(25, 80);
    var mm = mc(180 - a, [90 - a, a, 360 - a]);
    return {
      q: 'Two angles of a triangle measure ' + a + '° and 55°. What is the measure of the third angle?',
      options: mm.options, correct: mm.correct,
      explain: '180° − (' + a + '° + 55°) = ' + (180 - a - 55) + '°.',
    };
  });

  reg('Geometry and Trigonometry', ['medium'], function () {
    var r = ri(3, 12);
    var mm = mc(r, [2 * r, r * r, r / 2]);
    return {
      q: 'A circle has an area of ' + r * r + 'π square units. What is its radius?',
      options: mm.options, correct: mm.correct,
      explain: 'πr² = ' + r * r + 'π → r = ' + r + '.',
    };
  });

  reg('Geometry and Trigonometry', ['hard'], function () {
    var a = ri(1, 6), b = ri(1, 6), r = ri(2, 9);
    var mm = mc('(' + a + ', ' + (-b) + '), r = ' + r, ['(' + (-a) + ', ' + b + '), r = ' + r, '(' + a + ', ' + b + '), r = ' + (r * r), '(' + (-a) + ', ' + (-b) + '), r = ' + r]);
    return {
      q: 'The circle (x − ' + a + ')² + (y + ' + b + ')² = ' + r * r + ' has center and radius:',
      options: mm.options, correct: mm.correct,
      explain: 'Форма (x − h)² + (y − k)² = r² → центр (' + a + ', ' + (-b) + '), r = ' + r + '.',
    };
  });

  reg('Geometry and Trigonometry', ['easy'], function () {
    var leg = ri(2, 12);
    var mm = mc(leg + '√2', [leg + '√3', 2 * leg, leg * 2 + '√2']);
    return {
      q: 'In a 45°-45°-90° triangle, each leg measures ' + leg + ' units. What is the length of the hypotenuse?',
      options: mm.options, correct: mm.correct,
      explain: 'Гипотенуза = leg × √2 = ' + leg + '√2.',
    };
  });

  reg('Geometry and Trigonometry', ['medium'], function () {
    var x = ri(2, 9);
    var mm = mc(2 * x, [x + '√3', x + '√2', x * x], );
    return {
      q: 'In a 30°-60°-90° triangle, the side opposite the 30° angle measures ' + x + '. What is the hypotenuse?',
      options: mm.options, correct: mm.correct,
      explain: 'Отношение x : x√3 : 2x → гипотенуза 2x = ' + (2 * x) + '.',
    };
  });

  reg('Geometry and Trigonometry', ['medium'], function () {
    var opp = ri(3, 5) * pick([1, 1]), adj = ri(5, 12);
    var hyp2 = opp * opp + adj * adj;
    var hyp = Math.sqrt(hyp2);
    if (hyp % 1 !== 0) { adj = 12; opp = 5; hyp = 13; }
    var mm = mc(opp + '/' + hyp, [adj + '/' + hyp, opp + '/' + adj, hyp + '/' + opp]);
    return {
      q: 'In right triangle ABC, the angle C = 90°, AB = ' + hyp + ', and BC = ' + opp + '. What is sin(A)?',
      options: mm.options, correct: mm.correct,
      explain: 'sin(A) = противолежащий/гипотенуза = ' + opp + '/' + hyp + '.',
    };
  });

  reg('Geometry and Trigonometry', ['medium'], function () {
    var r = ri(2, 7), h = ri(4, 12);
    var mm = mc(r * r + 'π · ' + h, [r + 'π · ' + h, '2π' + r + ' · ' + h, r * r + 'π'], );
    return {
      q: 'A cylinder has a radius of ' + r + ' and a height of ' + h + '. Which expression gives its volume?',
      options: [r * r + 'π · ' + h, r + 'π · ' + h, '2 · ' + r + 'π · ' + h, r * r + 'π · ' + (h + r)], correct: 0,
      explain: 'V = πr²h = π · ' + r + '² · ' + h + '.',
    };
  });

  reg('Geometry and Trigonometry', ['hard'], function () {
    var k = ri(2, 4), area = 9;
    var newArea = area * k * k;
    var mm = mc(newArea, [9 * k, 9 + k, 3 * k * 3]);
    return {
      q: 'Two similar triangles have a scale factor of 1:' + k + ' (small to large). If the area of the small triangle is 9 square units, what is the area of the large triangle?',
      options: mm.options, correct: mm.correct,
      explain: 'Площадь растёт как k²: 9 × ' + k + '² = ' + newArea + '.',
    };
  });

  reg('Geometry and Trigonometry', ['easy'], function () {
    var a = ri(3, 9), b = ri(4, 12);
    var hyp2 = a * a + b * b, hyp = Math.sqrt(hyp2);
    if (hyp % 1 !== 0) { a = 6; b = 8; hyp = 10; }
    var mm = mc(hyp, [a + b, hyp + 1, Math.abs(b - a)]);
    return {
      q: 'A right triangle has legs of ' + a + ' and ' + b + '. What is the length of the hypotenuse?',
      options: mm.options, correct: mm.correct,
      explain: 'a² + b² = ' + a * a + ' + ' + b * b + ' = ' + hyp * hyp + ' → c = ' + hyp + '.',
    };
  });

  reg('Geometry and Trigonometry', ['medium'], function () {
    var k = ri(2, 5), side = ri(3, 9);
    var mm = mc(side * k, [side + k, side * k * k, Math.round(side / k)]);
    return {
      q: 'Two similar triangles have a scale factor of 1:' + k + '. A side of the small triangle measures ' + side + '. What is the corresponding side of the large triangle?',
      options: mm.options, correct: mm.correct,
      explain: 'Стороны масштабируются линейно: ' + side + ' × ' + k + ' = ' + side * k + '.',
    };
  });

  reg('Geometry and Trigonometry', ['hard'], function () {
    var r = ri(3, 9), deg = pick([60, 90, 120]);
    var frac = simplifyFraction(deg, 360);
    var area = (Math.PI * r * r * deg / 360);
    var mm = mc(frac + ' · πr²', [frac + ' · 2πr', 'πr²', frac + ' · πr']);
    return {
      q: 'A sector of a circle with radius r has a central angle of ' + deg + '°. Which expression gives the area of the sector?',
      options: mm.options, correct: mm.correct,
      explain: 'Сектор = доля круга ' + deg + '/360 = ' + frac + ' → площадь ' + frac + ' · πr².',
    };
  });

  reg('Algebra', ['medium'], function () {
    var m = ri(2, 8), x = ri(1, 4), b = ri(2, 15);
    var y = m * x + b;
    var mm = mc('(' + x + ', ' + y + ')', ['(' + y + ', ' + x + ')', '(' + x + ', ' + (y + m) + ')', '(' + (x + 1) + ', ' + y + ')']);
    return {
      q: 'The line y = ' + m + 'x + ' + b + ' passes through which point?',
      options: mm.options, correct: mm.correct,
      explain: 'Подставляем x = ' + x + ': y = ' + m + ' · ' + x + ' + ' + b + ' = ' + y + '.',
    };
  });

  reg('Advanced Math', ['medium'], function () {
    var x = ri(2, 6), k = ri(2, 5);
    var val = k * x * x;
    var mm = mc(val, [k * x, 2 * k * x, val + k]);
    return {
      q: 'If f(x) = ' + k + 'x², what is f(' + x + ')?',
      options: mm.options, correct: mm.correct,
      explain: 'f(' + x + ') = ' + k + ' · ' + x + '² = ' + val + '.',
    };
  });

  reg('Problem-Solving and Data Analysis', ['easy'], function () {
    var old_ = ri(20, 60), growth = ri(5, 25);
    var nw = old_ + growth;
    var pct = Math.round(growth / old_ * 100);
    var mm = mc('about ' + pct + '%', ['about ' + (pct + 10) + '%', 'about ' + growth + '%', 'about ' + Math.max(5, pct - 10) + '%']);
    return {
      q: 'The number of library visitors rose from ' + old_ + ' to ' + nw + ' per week. What was the approximate percent increase?',
      options: mm.options, correct: mm.correct,
      explain: growth + '/' + old_ + ' ≈ ' + pct + '%.',
    };
  });

  /* ═══════════ доступ наружу ═══════════ */

  return {
    all: G,
    /* выдаёт count вопросов нужной сложности, генераторы без повторов в одной выдаче */
    draw: function (difficulty, count) {
      var pool = G.filter(function (g) {
        return g.difficulties.indexOf(difficulty) !== -1;
      });
      pool = shuffle(pool.slice());
      var out = [], i = 0, guard = 0;
      while (out.length < count && guard < count * 20) {
        guard++;
        if (i >= pool.length) { pool = shuffle(pool.slice()); i = 0; }
        var q = pool[i].make();
        q.domain = pool[i].domain;
        q.difficulty = difficulty;
        q.calc = true;
        out.push(q);
        i++;
      }
      return out;
    },
    /* тест-хук: прогнать генератор валидатором */
    _ri: ri,
  };
})();
