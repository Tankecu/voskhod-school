/* ═══════════════════════════════════════════════════════════
   VOSKHOD SAT Practice #1 — Math (44 вопроса). 2 модуля × 22.
   Калькулятор разрешён на всех вопросах (как на цифровом SAT).
   ═══════════════════════════════════════════════════════════ */

window.MOCK_SAT_1_MATH = [

  /* ═════════ MODULE 1 (22) ═════════ */
  [
    {
      domain: 'Algebra', calc: true,
      q: 'If 3x − 7 = 14, what is the value of x?',
      options: ['5', '7', '9', '21'], correct: 1,
      explain: '3x = 21 → x = 7.',
    },
    {
      domain: 'Algebra', calc: true,
      q: 'A line passes through the points (2, 5) and (6, 13). What is the slope of the line?',
      options: ['2', '3', '4', '8'], correct: 0,
      explain: 'm = (13 − 5)/(6 − 2) = 8/4 = 2.',
    },
    {
      domain: 'Algebra', calc: true,
      q: 'The system y = 2x + 1 and y = −x + 7 has the solution (x, y). What is the value of y?',
      options: ['3', '4', '5', '7'], correct: 2,
      explain: '2x + 1 = −x + 7 → 3x = 6 → x = 2 → y = 2(2) + 1 = 5.',
    },
    {
      domain: 'Algebra', calc: true,
      q: 'A taxi ride costs $3.50 plus $1.20 per mile. Which inequality shows the number of miles m that can be ridden for at most $20?',
      options: ['3.5 + 1.2m ≤ 20', '3.5m + 1.2 ≤ 20', '1.2m − 3.5 ≤ 20', '3.5 + 1.2m ≥ 20'], correct: 0,
      explain: 'Total cost 3.50 + 1.20m must be at most 20 → ≤ 20.',
    },
    {
      domain: 'Algebra', calc: true,
      q: 'The equation C = 25n + 80 models the cost in dollars of renting a hall for a party with n guests. What does the number 80 represent in the equation?',
      options: [
        'The cost per guest',
        'A fixed fee that does not depend on the number of guests',
        'The maximum number of guests',
        'The total cost for 80 guests',
      ], correct: 1,
      explain: 'In y = mx + b form, the constant 80 is the y-intercept — the fixed starting fee.',
    },
    {
      domain: 'Algebra', calc: true,
      q: 'If x/4 + 3 = 7, what is the value of x?',
      options: ['4', '10', '16', '40'], correct: 2,
      explain: 'x/4 = 4 → x = 16.',
    },
    {
      domain: 'Algebra', calc: true,
      q: 'Water flows into a tank at a rate of 12 liters per minute. The tank initially contains 30 liters. Which equation gives V, the volume of water after m minutes?',
      options: ['V = 12m + 30', 'V = 30m + 12', 'V = 12m − 30', 'V = 42m'], correct: 0,
      explain: 'Initial amount + rate × time: V = 12m + 30.',
    },
    {
      domain: 'Algebra', calc: true,
      q: 'Which value of x satisfies the inequality 5 − 2x < 11?',
      options: ['x > −3', 'x < −3', 'x > 3', 'x < 3'], correct: 0,
      explain: '−2x < 6 → dividing by −2 flips the sign → x > −3.',
    },
    {
      domain: 'Advanced Math', calc: true,
      q: 'If f(x) = x² − 3x, what is f(5)?',
      options: ['10', '15', '25', '40'], correct: 0,
      explain: 'f(5) = 25 − 15 = 10.',
    },
    {
      domain: 'Advanced Math', calc: true,
      q: 'What are the solutions of x² − x − 12 = 0?',
      options: ['x = 3 and x = −4', 'x = −3 and x = 4', 'x = 2 and x = −6', 'x = 6 and x = −2'], correct: 1,
      explain: '(x − 4)(x + 3) = 0 → x = 4 or x = −3.',
    },
    {
      domain: 'Advanced Math', calc: true,
      q: 'Which expression is equivalent to (x⁵)(x³)/x²?',
      options: ['x⁶', 'x¹⁵', 'x⁷·⁵', 'x¹⁰'], correct: 0,
      explain: 'x⁵⁺³⁻² = x⁶.',
    },
    {
      domain: 'Advanced Math', calc: true,
      q: 'The parabola y = (x + 2)² − 9 has its vertex at:',
      options: ['(−2, −9)', '(2, −9)', '(−2, 9)', '(2, 9)'], correct: 0,
      explain: 'Vertex form y = (x − h)² + k → vertex (−2, −9).',
    },
    {
      domain: 'Advanced Math', calc: true,
      q: 'A population of bacteria doubles every 3 hours and starts at 500. Which equation gives P, the population after t hours?',
      options: ['P = 500 · 2^(t/3)', 'P = 500 · 2^(3t)', 'P = 1000t', 'P = 500 + 2t'], correct: 0,
      explain: 'Exponential doubling: multiplier 2^(t/3) applied every 3 hours.',
    },
    {
      domain: 'Problem-Solving and Data Analysis', calc: true,
      q: 'A jacket’s price was reduced from $120 to $84. What was the percent decrease?',
      options: ['26%', '30%', '36%', '43%'], correct: 1,
      explain: '(120 − 84)/120 = 36/120 = 0.30 → 30%.',
    },
    {
      domain: 'Problem-Solving and Data Analysis', calc: true,
      q: 'The numbers 4, 8, 10, 14 have an average of 9. If 20 is added to the set, what is the new average?',
      options: ['10', '11', '11.2', '12'], correct: 2,
      explain: 'Sum = 36; new sum = 56; 56 ÷ 5 = 11.2.',
    },
    {
      domain: 'Problem-Solving and Data Analysis', calc: true,
      q: 'A jar contains 5 red, 3 blue, and 4 green marbles. One marble is drawn at random. What is the probability that it is NOT blue?',
      options: ['1/3', '3/12', '9/12', '5/12'], correct: 2,
      explain: 'Not blue: 9 of 12 → 3/4.',
    },
    {
      domain: 'Problem-Solving and Data Analysis', calc: true,
      q: 'A recipe for 4 people uses 300 grams of rice. At the same rate, how many grams of rice are needed for 10 people?',
      options: ['600', '700', '750', '800'], correct: 2,
      explain: '300/4 = 75 g per person → 75 × 10 = 750 g.',
    },
    {
      domain: 'Geometry and Trigonometry', calc: true,
      q: 'Two angles of a triangle measure 47° and 68°. What is the measure of the third angle?',
      options: ['55°', '65°', '75°', '115°'], correct: 1,
      explain: '180 − (47 + 68) = 65°.',
    },
    {
      domain: 'Geometry and Trigonometry', calc: true,
      q: 'A circle has an area of 49π square meters. What is its radius?',
      options: ['7 m', '14 m', '24.5 m', '98 m'], correct: 0,
      explain: 'πr² = 49π → r² = 49 → r = 7.',
    },
    {
      domain: 'Geometry and Trigonometry', calc: true,
      q: 'In a 45°-45°-90° triangle, each leg measures 6 cm. What is the length of the hypotenuse?',
      options: ['6√2 cm', '6√3 cm', '12 cm', '9 cm'], correct: 0,
      explain: 'Hypotenuse = leg × √2 = 6√2.',
    },
    {
      domain: 'Geometry and Trigonometry', calc: true,
      q: 'A cylinder has a radius of 3 meters and a height of 10 meters. Which expression gives its volume?',
      options: ['90π', '30π', '60π', '9π'], correct: 0,
      explain: 'V = πr²h = π · 9 · 10 = 90π.',
    },
    {
      domain: 'Problem-Solving and Data Analysis', calc: true,
      q: 'The scatterplot of hours studied (x) versus exam score (y) has the line of best fit y = 6.5x + 40. What score does the line predict for a student who studies 6 hours?',
      options: ['46', '66', '79', '86'], correct: 2,
      explain: 'y = 6.5(6) + 40 = 39 + 40 = 79.',
    },
  ],

  /* ═════════ MODULE 2 (22) — сложнее ═════════ */
  [
    {
      domain: 'Algebra', calc: true,
      q: 'What is the solution set of the equation |2x − 5| = 9?',
      options: ['{−2, 7}', '{2, 7}', '{−7, 2}', '{−2, −7}'], correct: 0,
      explain: '2x − 5 = 9 → x = 7; 2x − 5 = −9 → x = −2.',
    },
    {
      domain: 'Algebra', calc: true,
      q: 'The line y = −0.5x + b passes through the point (4, −1). What is b?',
      options: ['−3', '1', '3', '5'], correct: 1,
      explain: '−1 = −0.5(4) + b → −1 = −2 + b → b = 1.',
    },
    {
      domain: 'Algebra', calc: true,
      q: 'A car depreciates in value according to the model V = 24,000 − 1,800t, where t is years. After how many years will the value first fall below $10,000?',
      options: ['7', '8', '13', '14'], correct: 1,
      explain: '24,000 − 1,800t < 10,000 → 1,800t > 14,000 → t > 7.78 → first below at t = 8.',
    },
    {
      domain: 'Algebra', calc: true,
      q: 'For what value of k does the equation 3(x + 4) = 2(x − 1) + x + k have infinitely many solutions?',
      options: ['14', '12', '−14', '10'], correct: 0,
      explain: 'Right side: 3x + k − 2. Identity requires 12 = k − 2 → k = 14.',
    },
    {
      domain: 'Advanced Math', calc: true,
      q: 'The function h(x) = (x − 4)² + 7 is shifted 3 units left and 2 units down. What is the new function?',
      options: ['h(x) = (x − 1)² + 5', 'h(x) = (x − 7)² + 5', 'h(x) = (x − 1)² + 9', 'h(x) = (x + 1)² + 5'], correct: 0,
      explain: 'Left 3: x − 4 + 3 = x − 1; down 2: 7 − 2 = 5.',
    },
    {
      domain: 'Advanced Math', calc: true,
      q: 'If f(x) = 2x² and g(x) = x − 3, what is f(g(5))?',
      options: ['4', '8', '32', '98'], correct: 1,
      explain: 'g(5) = 5 − 3 = 2; f(2) = 2 · 2² = 8.',
    },
    {
      domain: 'Advanced Math', calc: true,
      q: 'The quadratic y = x² − 6x + 11 can be written as y = (x − 3)² + k. What is k?',
      options: ['2', '−2', '9', '11'], correct: 0,
      explain: 'x² − 6x + 9 + 2 → k = 2. Vertex (3, 2).',
    },
    {
      domain: 'Advanced Math', calc: true,
      q: 'If 4^x = 32, what is the value of x?',
      options: ['2.5', '3', '5', '8'], correct: 0,
      explain: '4^x = 2^(2x) = 2⁵ → 2x = 5 → x = 2.5.',
    },
    {
      domain: 'Advanced Math', calc: true,
      q: 'What is the value of x in the equation √(x + 3) = x − 3?',
      options: ['1', '6', '13', '6 or 1'], correct: 1,
      explain: 'x + 3 = x² − 6x + 9 → x² − 7x + 6 = 0 → x = 1 or 6. Check: x = 1 gives √4 = −2 (false); x = 6 gives √9 = 3 ✓.',
    },
    {
      domain: 'Algebra', calc: true,
      q: 'A line passes through (−2, 3) and is perpendicular to y = 2x − 1. At what point does this line cross the x-axis?',
      options: ['(−4, 0)', '(4, 0)', '(0, 4)', '(−0.5, 0)'], correct: 1,
      explain: 'Perpendicular slope = −1/2. y − 3 = −0.5(x + 2) → set y = 0: −3 = −0.5x − 1 → x = 4.',
    },
    {
      domain: 'Problem-Solving and Data Analysis', calc: true,
      q: 'A survey of 200 students found 120 support the new schedule. The school has 3,500 students. If the sample is representative, approximately how many students in the school support the schedule?',
      options: ['1,200', '2,100', '2,400', '2,800'], correct: 1,
      explain: '120/200 = 0.6 → 0.6 × 3,500 = 2,100.',
    },
    {
      domain: 'Problem-Solving and Data Analysis', calc: true,
      q: 'Data set A has a standard deviation of 2. A new data set B is created by adding 10 to every value in A. What is the standard deviation of B?',
      options: ['2', '12', '10', '20'], correct: 0,
      explain: 'Adding a constant shifts data but does not change spread → SD stays 2.',
    },
    {
      domain: 'Problem-Solving and Data Analysis', calc: true,
      q: 'The median of the list 3, 5, 7, 9, 11 is 7. If the number 100 is added to the list, the new median is:',
      options: ['7', '8', '9', '100'], correct: 1,
      explain: 'Sorted: 3, 5, 7, 9, 11, 100 → middle two values are 7 and 9 → median = 8.',
    },
    {
      domain: 'Problem-Solving and Data Analysis', calc: true,
      q: 'In a class of 30 students, 18 play football, 15 play chess, and 6 play both. How many students play neither?',
      options: ['3', '6', '9', '12'], correct: 0,
      explain: 'Football or chess = 18 + 15 − 6 = 27 → neither = 30 − 27 = 3.',
    },
    {
      domain: 'Geometry and Trigonometry', calc: true,
      q: 'The circle (x − 2)² + (y + 5)² = 36 has center and radius:',
      options: ['(2, −5), r = 6', '(−2, 5), r = 6', '(2, −5), r = 36', '(−2, −5), r = 6'], correct: 0,
      explain: 'Center (2, −5), radius √36 = 6.',
    },
    {
      domain: 'Geometry and Trigonometry', calc: true,
      q: 'In a 30°-60°-90° triangle, the side opposite 30° measures 5. What is the length of the hypotenuse?',
      options: ['5√3', '10', '5√2', '15'], correct: 1,
      explain: 'Ratio x : x√3 : 2x → hypotenuse = 2x = 10.',
    },
    {
      domain: 'Geometry and Trigonometry', calc: true,
      q: 'In right triangle ABC, angle C = 90°, AB = 13, and BC = 5. What is sin(A)?',
      options: ['5/13', '12/13', '5/12', '13/12'], correct: 0,
      explain: 'sin(A) = opposite/hypotenuse = BC/AB = 5/13.',
    },
    {
      domain: 'Geometry and Trigonometry', calc: true,
      q: 'Two similar triangles have a scale factor of 3:5 (small to large). If the area of the small triangle is 27 square units, what is the area of the large one?',
      options: ['45', '75', '81', '125'], correct: 1,
      explain: 'Area scales by the square: (5/3)² = 25/9 → 27 × 25/9 = 75.',
    },
    {
      domain: 'Algebra', calc: true,
      q: 'If a = 3b and c = a/2, what is c in terms of b?',
      options: ['1.5b', '2b', '6b', 'b/2'], correct: 0,
      explain: 'c = a/2 = 3b/2 = 1.5b.',
    },
    {
      domain: 'Advanced Math', calc: true,
      q: 'The graph of y = f(x) is shown passing through (1, 2), (2, 4), (3, 8) with a smooth curve. Which type of function best models these points?',
      options: ['Exponential growth', 'Linear', 'Quadratic opening down', 'Constant'], correct: 0,
      explain: 'y doubles as x increases by 1: 2, 4, 8 → exponential 2^x.',
    },
    {
      domain: 'Advanced Math', calc: true,
      q: 'Which is equivalent to (x² − 9)/(x + 3) for x ≠ −3?',
      options: ['x − 3', 'x + 3', 'x² − 3', '1/(x + 3)'], correct: 0,
      explain: 'Factor: (x − 3)(x + 3)/(x + 3) = x − 3.',
    },
    {
      domain: 'Algebra', calc: true,
      q: 'A phone plan costs $30 monthly plus $0.10 per gigabyte over 5 GB. If a customer paid $38 last month, how many gigabytes over the limit did they use?',
      options: ['38', '80', '8', '5'], correct: 1,
      explain: '38 − 30 = 8 → 8 / 0.10 = 80 GB over the limit.',
    },
  ],
];
