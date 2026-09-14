# Привязка генераторов bank-math.js к темам curriculum + новые генераторы
import io, re

p = 'js/bank-math.js'
s = io.open(p, encoding='utf-8').read()

# 1. Новая сигнатура reg
old_reg = """  var G = [];
  function reg(domain, difficulties, make) {
    G.push({ domain: domain, difficulties: difficulties, make: make });
  }"""
new_reg = """  var G = [];
  function reg(topic, domain, difficulties, make) {
    G.push({ topic: topic, domain: domain, difficulties: difficulties, make: make });
  }"""
assert old_reg in s, 'reg def not found'
s = s.replace(old_reg, new_reg)

# 2. Последовательная привязка тем к reg() вызовам (в порядке объявления в файле)
topics = [
    'a1',  # linSolveEasy
    'a1',  # p(x+b)=q
    'a5',  # slope from points
    'a3',  # system xy
    'a4',  # gym months
    'a4',  # C = mn + b
    'a5',  # perpendicular y-intercept
    'a3',  # identity k(x+2)
    'a2',  # inequality
    'b5',  # |x-c| sum
    'c2',  # printer rate
    'a1',  # y = ax - b eval
    'b2',  # quad roots factoring
    'b2',  # vertex std form
    'b2',  # vertex form
    'b4',  # exponent rules
    'b4',  # exponential model
    'b1',  # f(g(x))
    'b3',  # transform shift
    'b4',  # radical equation
    'b2',  # roots -> equation
    'b2',  # one real solution
    'c1',  # percent decrease
    'c3',  # mean missing
    'c3',  # median change
    'c4',  # probability basic
    'c4',  # probability no replace
    'c2',  # recipe proportion
    'c5',  # line of best fit
    'c5',  # survey inference
    'c3',  # standard deviation
    'd1',  # triangle angle
    'd3',  # circle radius from area
    'd3',  # circle equation
    'd2',  # 45-45-90
    'd2',  # 30-60-90
    'e1',  # sin
    'd4',  # cylinder volume
    'd4',  # scale area
    'd1',  # pythagorean
    'd5',  # similar side
    'd3',  # sector
    'a5',  # line through point
    'b1',  # f(x)=kx^2
    'c1',  # percent increase
]

# последовательная замена reg('Domain', -> reg('topic', 'Domain',
parts = re.split(r"(reg\(')", s)
# parts: [до, "reg('", после, "reg('", ...]
count = (len(parts) - 1) // 2
assert count == len(topics), f'reg calls: {count}, topics: {len(topics)}'
out = [parts[0]]
for i in range(count):
    out.append(parts[1 + i * 2])                      # "reg('"
    seg = parts[2 + i * 2]                            # 'Domain', [...], fn...
    out.append(topics[i] + "', " + seg)               # вставляем topic перед доменом
s = ''.join(out)

# 3. draw(topic, difficulty, count)
old_draw = """    draw: function (difficulty, count) {
      var pool = G.filter(function (g) {
        return g.difficulties.indexOf(difficulty) !== -1;
      });"""
new_draw = """    draw: function (topic, difficulty, count) {
      var pool = G.filter(function (g) {
        return (topic === '*' || g.topic === topic) &&
          g.difficulties.indexOf(difficulty) !== -1;
      });"""
assert old_draw in s, 'draw not found'
s = s.replace(old_draw, new_draw)

# 4. Новые генераторы на пробелы покрытия (перед "доступ наружу")
new_gens = '''
  /* ═══════════ ДОБАВКА: покрытие тем учебного плана ═══════════ */

  reg('a2', 'Algebra', ['medium'], function () {
    var m = ri(2, 6), cap = ri(3, 9) * 10, fee = ri(1, 5) * 10;
    var mm = mc('m ≤ ' + Math.floor((cap - fee) / m), ['m ≥ ' + Math.floor((cap - fee) / m), 'm ≤ ' + (Math.floor((cap - fee) / m) + 1), 'm ≥ 0']);
    return {
      q: 'A service charges $' + fee + ' plus $' + m + ' per hour. A customer can spend at most $' + cap + '. Which inequality shows the number of hours h they can afford?',
      options: mm.options, correct: mm.correct,
      explain: fee + ' + ' + m + 'h ≤ ' + cap + ' → h ≤ ' + Math.floor((cap - fee) / m) + '. «At most» → ≤.',
    };
  });

  reg('a3', 'Algebra', ['medium'], function () {
    var big = ri(10, 40), diff = ri(1, 9);
    var small = big - diff;
    var mm = mc(big, [small, big + small, diff]);
    return {
      q: 'Two numbers have a sum of ' + (big + small) + ' and a difference of ' + diff + '. What is the LARGER number?',
      options: mm.options, correct: mm.correct,
      explain: 'Складываем уравнения: 2x = ' + (big + small) + ' → большее x = ' + big + '.',
    };
  });

  reg('b1', 'Advanced Math', ['medium'], function () {
    var x = ri(2, 6), k = ri(2, 9);
    var val = x * x + k * x;
    var mm = mc(k, [val, k + x, x * x]);
    return {
      q: 'If f(x) = x² + kx and f(' + x + ') = ' + val + ', what is k?',
      options: mm.options, correct: mm.correct,
      explain: x * x + ' + ' + x + 'k = ' + val + ' → k = ' + k + '.',
    };
  });

  reg('b4', 'Advanced Math', ['medium'], function () {
    var x = ri(2, 8), add = ri(3, 12);
    var mm = mc(x, [x + add, add - x, add]);
    return {
      q: 'If 2^(' + x + 'x) = 2^(' + x + 'x + ' + add + ') − 2^' + add + ', what is the value of x?',
      options: mm.options, correct: mm.correct,
      explain: 'Правая часть: 2^' + add + ' · (2^((' + x + '−1)x) − 1)… проще: равенство степеней двойки при одинаковых показателях. Показатели равны: ' + x + 'x = ' + x + 'x + ' + add + ' − ' + add + ' → x = ' + x + '.',
    };
  });

  reg('b5', 'Advanced Math', ['medium'], function () {
    var a = ri(2, 6), c = ri(3, 12);
    var x1 = c + a, x2 = c - a;
    var mm = mc(x1, [x2, c, 2 * c]);
    return {
      q: 'If |' + a + 'x − ' + a * c + '| = ' + a * c + ', what is the LARGER solution for x?',
      options: mm.options, correct: mm.correct,
      explain: '|' + a + 'x − ' + a * c + '| = ' + a * c + ' → ' + a + 'x = ' + (a * c + a * c) + ' или ' + a + 'x = 0 → x = ' + x1 + ' или x = 0. Большее — ' + x1 + '.',
    };
  });

  reg('c1', 'Problem-Solving and Data Analysis', ['medium'], function () {
    var p = ri(1, 4) * 5;
    var loss = p * p / 100;
    var mm = mc(loss + '%', [p + '%', (2 * p) + '%', '0%']);
    return {
      q: 'A value is increased by ' + p + '% and then decreased by ' + p + '%. By what percent is the final value different from the original?',
      options: mm.options, correct: mm.correct,
      explain: '(1 + ' + p / 100 + ')(1 − ' + p / 100 + ') = 1 − ' + p / 100 + '² → потеря ' + loss + '%.',
    };
  });

  reg('d3', 'Geometry and Trigonometry', ['medium'], function () {
    var r = ri(3, 10);
    var mm = mc(2 * r + 'π', [r * r + 'π', r + 'π', 4 * r + 'π']);
    return {
      q: 'A circle has an area of ' + r * r + 'π. What is its circumference?',
      options: mm.options, correct: mm.correct,
      explain: 'r² = ' + r * r + ' → r = ' + r + ' → C = 2πr = ' + 2 * r + 'π.',
    };
  });

  reg('d5', 'Geometry and Trigonometry', ['medium'], function () {
    var a = ri(30, 85);
    var mm = mc(a + '°', [(90 - a) + '°', (180 - a) + '°', (a + 10) + '°']);
    return {
      q: 'Two parallel lines are cut by a transversal. One of the angles measures ' + a + '°. What is the measure of its corresponding angle (соответственный угол)?',
      options: mm.options, correct: mm.correct,
      explain: 'Соответственные углы при параллельных прямых равны → ' + a + '°.',
    };
  });

  reg('e1', 'Geometry and Trigonometry', ['medium'], function () {
    var mm = mc('12/13', ['5/13', '5/12', '13/12']);
    return {
      q: 'In right triangle ABC, the angle C = 90°, AB = 13, and BC = 5. What is cos(A)?',
      options: mm.options, correct: mm.correct,
      explain: 'AC = √(169 − 25) = 12. cos(A) = прилежащий/гипотенуза = AC/AB = 12/13.',
    };
  });

  reg('e2', 'Geometry and Trigonometry', ['medium'], function () {
    var mm = mc('12', ['13', '5', '17']);
    return {
      q: 'A 13-meter ladder leans against a wall with its base 5 meters from the wall. How high up the wall does the ladder reach?',
      options: mm.options, correct: mm.correct,
      explain: 'Пифагор: √(13² − 5²) = √144 = 12 м.',
    };
  });

  reg('e3', 'Advanced Math', ['medium'], function () {
    var k = ri(2, 9);
    var mm = mc('x + ' + k, ['x − ' + k, 'x', 'x + ' + (k * k)]);
    return {
      q: 'Which expression is equivalent to (x² − ' + k * k + ')/(x − ' + k + ') for x ≠ ' + k + '?',
      options: mm.options, correct: mm.correct,
      explain: 'Разность квадратов: (x − ' + k + ')(x + ' + k + ')/(x − ' + k + ') = x + ' + k + '.',
    };
  });

  reg('e4', 'Algebra', ['hard'], function () {
    var price = ri(4, 12) * 10, p = pick([10, 20, 25]), coupon = ri(1, 4) * 5;
    var after = price * (100 - p) / 100;
    var fin = after - coupon;
    var mm = mc(fin, [after, price - coupon, price * (100 - p) / 100 + coupon]);
    return {
      q: 'An item costs $' + price + '. Its price is reduced by ' + p + '%, and then a $' + coupon + ' coupon is applied. What is the final price?',
      options: mm.options, correct: mm.correct,
      explain: price + ' · ' + (100 - p) + '/100 = ' + after + '; затем − ' + coupon + ' → $' + fin + '.',
    };
  });

'''
anchor = '  /* ═══════════ доступ наружу ═══════════ */'
assert anchor in s
s = s.replace(anchor, new_gens + anchor)

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('patched: topics assigned,', count, 'regs + 12 new generators')
