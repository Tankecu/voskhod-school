/* ═══════════════════════════════════════════════════════════
   VOSKHOD Orbit — банк тестов (EN). Статический контент,
   поставляется вместе с приложением. custom-тесты живут в базе.
   assignedGroups: ['*'] = доступен всем группам.
   ═══════════════════════════════════════════════════════════ */

window.TEST_BANK = [

  /* ═════════ SAT MATH ═════════ */

  {
    id: 'b1', title: 'SAT Math · Percentages & Proportions', subject: 'SAT Math', authorId: null,
    assignedGroups: ['*'], timeMin: 12, theory: { course: 'sat-math', topic: 'percentages' },
    questions: [
      { q: 'A jacket cost $180. The price was first reduced by 25%, and then the new price was increased by 20%. What is the price now?', options: ['$180', '$172', '$162', '$168'], correct: 2, explain: '180 × 0.75 = 135; 135 × 1.2 = $162. The 20% increase applies to the NEW price, not the original one.' },
      { q: 'If 3 pens cost the same as 2 notebooks, and one notebook costs 90 cents, what is the cost of one pen (in cents)?', options: ['45', '60', '72', '75'], correct: 1, explain: '2 notebooks = 180 cents → 180 ÷ 3 = 60 cents per pen.' },
      { q: 'A recipe for 6 servings requires 2.5 cups of flour. How much flour is needed for 9 servings?', options: ['3 cups', '3.25 cups', '3.5 cups', '3.75 cups'], correct: 3, explain: 'Per serving: 2.5 ÷ 6. For 9 servings: 2.5 × 9/6 = 3.75 cups.' },
      { q: 'A number x is increased by 40%, then decreased by 40%. The result is 588. What is x?', options: ['588', '620', '700', '750'], correct: 2, explain: 'x × 1.4 × 0.6 = 0.84x = 588 → x = 700. A +40% and −40% pair does NOT return the original number.' },
      { q: 'A map scale is 1 cm = 5 km. Two cities are 4.6 cm apart on the map. What is the actual distance?', options: ['20.3 km', '23 km', '25 km', '46 km'], correct: 1, explain: '4.6 × 5 = 23 km.' },
      { q: 'A car covered 30% of a trip on day one, 25% on day two, and the remaining 135 km on day three. How long was the whole trip?', options: ['270 km', '300 km', '320 km', '360 km'], correct: 1, explain: 'Remaining = 100% − 55% = 45% → 0.45x = 135 → x = 300 km.' },
      { q: 'y is directly proportional to x. When x = 4, y = 14. What is y when x = 10?', options: ['28', '32', '35', '40'], correct: 2, explain: 'k = 14/4 = 3.5 → y = 3.5 × 10 = 35.' },
      { q: 'A subscription price rose from $48 to $60. By what percent did it increase?', options: ['20%', '25%', '80%', '125%'], correct: 1, explain: '(60 − 48) / 48 = 0.25 → 25%. Always divide by the ORIGINAL value.' },
    ],
  },
  {
    id: 'b2', title: 'SAT Math · Linear Equations & Inequalities', subject: 'SAT Math', authorId: null,
    assignedGroups: ['*'], timeMin: 10, theory: { course: 'sat-math', topic: 'linear' },
    questions: [
      { q: 'If 2x + 5 = 3x − 8, what is the value of x?', options: ['−13', '−3', '3', '13'], correct: 3, explain: '5 + 8 = 3x − 2x → x = 13.' },
      { q: 'System: x + y = 10 and x − y = 4. What is xy?', options: ['21', '24', '25', '30'], correct: 0, explain: 'Add the equations: 2x = 14 → x = 7, y = 3 → xy = 21.' },
      { q: 'What is the slope of the line 3y = 6x + 12?', options: ['2', '3', '4', '6'], correct: 0, explain: 'Divide by 3: y = 2x + 4 → slope = 2.' },
      { q: 'For what value of a does ax + 3 = 5x + 3 have infinitely many solutions?', options: ['0', '3', '5', 'Any value'], correct: 2, explain: 'Identity requires a = 5: then both sides are 5x + 3 for every x.' },
      { q: 'Which inequality describes all solutions of |2x − 6| ≤ 4?', options: ['1 ≤ x ≤ 5', '−5 ≤ x ≤ −1', '2 ≤ x ≤ 4', 'x ≤ 1 or x ≥ 5'], correct: 0, explain: '−4 ≤ 2x − 6 ≤ 4 → 2 ≤ 2x ≤ 10 → 1 ≤ x ≤ 5.' },
      { q: 'A phone plan costs $20 plus $0.05 per minute. Which expression gives the total cost of m minutes?', options: ['20m + 0.05', '0.05m + 20', '25m', '20 − 0.05m'], correct: 1, explain: 'Fixed fee + rate × minutes = 0.05m + 20.' },
      { q: 'Line l passes through (1, 2) and (3, 10). Line m is perpendicular to l. What is the slope of m?', options: ['−4', '−1/4', '1/4', '4'], correct: 1, explain: 'Slope of l = (10 − 2)/(3 − 1) = 4. Perpendicular slope = −1/4 (negative reciprocal).' },
    ],
  },
  {
    id: 'b3', title: 'SAT Math · Functions & Quadratics', subject: 'SAT Math', authorId: null,
    assignedGroups: ['*'], timeMin: 10, theory: { course: 'sat-math', topic: 'functions' },
    questions: [
      { q: 'If f(x) = 2x + 1, what is f(f(2))?', options: ['7', '9', '11', '13'], correct: 2, explain: 'f(2) = 5, then f(5) = 11.' },
      { q: 'The vertex of the parabola y = (x − 3)² − 4 is at:', options: ['(3, −4)', '(−3, −4)', '(3, 4)', '(−3, 4)'], correct: 0, explain: 'Vertex form y = (x − h)² + k has vertex (h, k) = (3, −4).' },
      { q: 'What are the solutions of x² − 5x + 6 = 0?', options: ['x = 1 and x = 6', 'x = 2 and x = 3', 'x = −2 and x = −3', 'x = 0 and x = 5'], correct: 1, explain: 'Factor: (x − 2)(x − 3) = 0 → x = 2 or x = 3.' },
      { q: 'For the function g(x) = x² − 4x, what is the minimum value of g?', options: ['−4', '−2', '0', '4'], correct: 0, explain: 'Vertex: x = −b/2a = 2 → g(2) = 4 − 8 = −4.' },
      { q: 'If f(x) = x² + k and f(3) = 14, what is k?', options: ['5', '9', '14', '23'], correct: 0, explain: '9 + k = 14 → k = 5.' },
      { q: 'The graph of y = f(x) is shifted 2 units up and 3 units right. The new function is:', options: ['f(x − 3) + 2', 'f(x + 3) + 2', 'f(x − 3) − 2', 'f(x + 2) + 3'], correct: 0, explain: 'Right shift subtracts inside: f(x − 3); up shift adds outside: + 2.' },
      { q: 'A quadratic has roots 4 and −1. Which is its equation?', options: ['x² − 3x − 4 = 0', 'x² + 3x − 4 = 0', 'x² − 4x − 1 = 0', 'x² − 5x + 4 = 0'], correct: 0, explain: '(x − 4)(x + 1) = x² − 3x − 4.' },
    ],
  },
  {
    id: 'b4', title: 'SAT Math · Data & Probability', subject: 'SAT Math', authorId: null,
    assignedGroups: ['*'], timeMin: 9, theory: { course: 'sat-math', topic: 'data' },
    questions: [
      { q: 'Test scores: 72, 85, 90, 85, 68, 90, 95. What is the median?', options: ['85', '86', '90', '88.6'], correct: 0, explain: 'Sorted: 68, 72, 85, 85, 90, 90, 95 → middle value = 85. (88.6 is the mean.)' },
      { q: 'A bag has 4 red and 6 blue marbles. Two marbles are drawn at random without replacement. What is the probability both are red?', options: ['4/25', '2/15', '1/5', '9/25'], correct: 1, explain: '(4/10) × (3/9) = 12/90 = 2/15.' },
      { q: 'A survey of 400 students found 62% prefer online lessons. About how many students prefer online lessons?', options: ['186', '248', '262', '310'], correct: 1, explain: '0.62 × 400 = 248.' },
      { q: 'The average (arithmetic mean) of 5 numbers is 12. If one number, 20, is removed, what is the average of the remaining 4?', options: ['8', '10', '11', '12'], correct: 1, explain: 'Sum = 60; 60 − 20 = 40; 40 ÷ 4 = 10.' },
      { q: 'A fair die is rolled once. What is the probability of rolling a number greater than 4?', options: ['1/6', '1/3', '1/2', '2/3'], correct: 1, explain: 'Favorable: {5, 6} → 2/6 = 1/3.' },
      { q: 'In a scatterplot, the line of best fit is y = 4x + 20, where x = hours studied and y = test score. What score does the model predict for 5 hours?', options: ['40', '45', '140', '120'], correct: 0, explain: 'y = 4(5) + 20 = 40.' },
    ],
  },

  /* ═════════ SAT READING & WRITING ═════════ */

  {
    id: 'b5', title: 'SAT R/W · Vocabulary in Context', subject: 'SAT R/W', authorId: null,
    assignedGroups: ['*'], timeMin: 8, theory: { course: 'sat-rw', topic: 'vocab' },
    questions: [
      { q: 'The scientist’s claims were ___ by decades of careful research, so few colleagues dared to challenge them.', options: ['undermined', 'buttressed', 'obscured', 'dispersed'], correct: 1, explain: 'Buttressed = supported/strengthened. Decades of research → colleagues don’t dare argue.' },
      { q: 'Rather than ___ the problem, the committee postponed any real discussion until next year.', options: ['addressing', 'addressed', 'to address', 'address'], correct: 0, explain: 'Rather than + gerund: rather than addressing.' },
      { q: 'The novel’s plot is ___, but its characters make it unforgettable.', options: ['compelling', 'conventional', 'lucid', 'profound'], correct: 1, explain: 'Contrast signal "but": ordinary plot vs memorable characters → conventional.' },
      { q: 'The professor is known for ___ explanations: even complex ideas become simple.', options: ['lucid', 'verbose', 'obscure', 'tedious'], correct: 0, explain: 'Lucid = clear. The colon introduces the clue: complex ideas become simple.' },
      { q: 'Ecologists warned that the wetland’s fragile ecosystem could be ___ by even minor pollution.', options: ['bolstered', 'disrupted', 'preserved', 'ignored'], correct: 1, explain: 'Fragile + pollution → disrupted (upset the balance).' },
      { q: 'The word "hackneyed" most nearly means:', options: ['original', 'overused', 'expensive', 'careful'], correct: 1, explain: 'Hackneyed = lacking freshness because of overuse.' },
      { q: 'Although the data seemed ___ at first, a second analysis revealed a clear pattern.', options: ['coherent', 'random', 'convincing', 'obvious'], correct: 1, explain: 'Although signals contrast: no clear pattern at first → random.' },
      { q: 'The director’s ___ approach — shooting scenes in a single take — puzzled actors used to many retakes.', options: ['unorthodox', 'meticulous', 'tentative', 'conventional'], correct: 0, explain: 'A method that puzzles people used to the norm is unorthodox (unusual).' },
    ],
  },
  {
    id: 'b6', title: 'SAT R/W · Transitions & Sentence Logic', subject: 'SAT R/W', authorId: null,
    assignedGroups: ['*'], timeMin: 8, theory: { course: 'sat-rw', topic: 'transitions' },
    questions: [
      { q: 'Regular exercise improves mood. ___, it also enhances memory and sleep quality.', options: ['However', 'Moreover', 'Instead', 'Nevertheless'], correct: 1, explain: 'Adding a similar idea → Moreover (addition).' },
      { q: 'The vaccine is highly effective; ___, it must be stored at very low temperatures, which complicates transport.', options: ['therefore', 'likewise', 'however', 'similarly'], correct: 2, explain: 'Positive fact then a complication → contrast → however.' },
      { q: 'The startup cut costs dramatically. ___, its profits did not improve.', options: ['Consequently', 'Nevertheless', 'Therefore', 'Hence'], correct: 1, explain: 'Expected effect did not happen → Nevertheless (contrast with expectation).' },
      { q: 'Choose the sentence that is grammatically correct.', options: ['Between you and I, the plan is risky.', 'Between you and me, the plan is risky.', 'Between yourself and I, the plan is risky.', 'Between I and you, the plan is risky.'], correct: 1, explain: 'After a preposition use object pronouns: between you and ME.' },
      { q: 'The results were surprising; ___, the team repeated the experiment three more times.', options: ['in contrast', 'as a result', 'for instance', 'in addition'], correct: 1, explain: 'Surprising results CAUSE rechecking → as a result (cause-effect).' },
      { q: '___ studying every evening, Maya also joined a weekend debate club.', options: ['Because of', 'In addition to', 'Despite', 'Instead of'], correct: 1, explain: 'Two activities together → In addition to + gerund.' },
      { q: 'Some critics praised the film’s originality; ___ dismissed it as style over substance.', options: ['others', 'the other', 'another', 'other'], correct: 0, explain: 'Some… others — parallel plural pronoun.' },
    ],
  },
  {
    id: 'b7', title: 'SAT R/W · Command of Evidence & Inference', subject: 'SAT R/W', authorId: null,
    assignedGroups: ['*'], timeMin: 9, theory: { course: 'sat-rw', topic: 'evidence' },
    questions: [
      { q: 'A passage states that urban bee populations declined 40% after pesticide bans were relaxed. The most reasonable inference is:', options: ['Pesticides likely harm urban bees', 'Bees moved to rural areas', 'Bans improve bee health', 'Urban bees are extinct'], correct: 0, explain: 'Relaxed bans (more pesticides) → decline. Careful: correlation, but "most reasonable" inference links pesticides to harm.' },
      { q: 'An author writes: "Not everyone agrees, but the evidence keeps piling up." The author’s attitude is best described as:', options: ['openly dismissive', 'cautiously convinced', 'completely neutral', 'openly hostile'], correct: 1, explain: 'Acknowledges disagreement yet trusts accumulating evidence → cautiously convinced.' },
      { q: 'Which claim would the author of a passage criticizing "quick-fix study apps" most likely support?', options: ['Apps replace teachers', 'Consistent practice beats shortcuts', 'All apps are useless', 'Tests should be banned'], correct: 1, explain: 'Criticism of quick fixes implies support for steady, consistent practice — the moderate option.' },
      { q: 'A scientist’s data show coral bleaching rises as water temperature rises. This relation is best described as:', options: ['a positive correlation', 'a negative correlation', 'no correlation', 'proof of causation by currents'], correct: 0, explain: 'Both increase together → positive correlation. Correlation alone does not prove full causation.' },
      { q: '"While the museum’s funding doubled, attendance barely grew." The sentence primarily serves to:', options: ['praise the funding increase', 'highlight a mismatch between money and results', 'explain museum history', 'attack museum staff'], correct: 1, explain: 'Doubling money vs flat attendance → contrast emphasizing a mismatch.' },
      { q: 'The best evidence that a program worked would be:', options: ['participant testimonials', 'a rise in scores measured before and after', 'the program’s popularity', 'its low cost'], correct: 1, explain: 'Measured before/after change is direct quantitative evidence.' },
    ],
  },

  /* ═════════ GRAMMAR ═════════ */

  {
    id: 'b8', title: 'Grammar · Tenses Essentials', subject: 'Grammar', authorId: null,
    assignedGroups: ['*'], timeMin: 8, theory: { course: 'grammar', topic: 'tenses' },
    questions: [
      { q: 'I ___ my homework already, so I can go for a walk.', options: ['did', 'have done', 'was doing', 'do'], correct: 1, explain: '"Already" signals Present Perfect: have done.' },
      { q: 'She ___ in Tashkent since 2019.', options: ['lives', 'lived', 'has lived', 'is living'], correct: 2, explain: '"Since 2019" = period continuing until now → Present Perfect.' },
      { q: 'By the time we arrived, the lecture ___.', options: ['already started', 'has already started', 'had already started', 'was already starting'], correct: 2, explain: 'Finished before another past event → Past Perfect.' },
      { q: 'Listen! Someone ___ the piano upstairs.', options: ['plays', 'is playing', 'played', 'has played'], correct: 1, explain: 'Happening right now → Present Continuous.' },
      { q: 'Water ___ at 100 degrees Celsius.', options: ['boils', 'is boiling', 'boiled', 'has boiled'], correct: 0, explain: 'General fact → Present Simple.' },
      { q: 'We ___ this movie three times this month.', options: ['saw', 'have seen', 'had seen', 'see'], correct: 1, explain: '"This month" = unfinished time period → Present Perfect.' },
      { q: 'While I ___ dinner, the phone rang.', options: ['cooked', 'was cooking', 'have cooked', 'cook'], correct: 1, explain: 'Longer background action interrupted → Past Continuous.' },
      { q: 'Tomorrow at 5 pm I ___ for my SAT exam.', options: ['will study', 'will be studying', 'study', 'am studied'], correct: 1, explain: 'Action in progress at a future time → Future Continuous.' },
    ],
  },
  {
    id: 'b9', title: 'Grammar · Conditionals & Modals', subject: 'Grammar', authorId: null,
    assignedGroups: ['*'], timeMin: 8, theory: { course: 'grammar', topic: 'conditionals' },
    questions: [
      { q: 'If it ___ tomorrow, we will stay at home.', options: ['will rain', 'rains', 'would rain', 'rained'], correct: 1, explain: 'First Conditional: if + Present Simple, will + verb.' },
      { q: 'If I ___ you, I would apply for the scholarship.', options: ['am', 'was', 'were', 'will be'], correct: 2, explain: 'Second Conditional → were for all persons (subjunctive).' },
      { q: 'If she had studied, she ___ the exam.', options: ['would pass', 'will pass', 'would have passed', 'passes'], correct: 2, explain: 'Third Conditional: if + had V3, would have V3.' },
      { q: 'You ___ smoke here — it’s forbidden.', options: ['mustn’t', 'don’t have to', 'shouldn’t have', 'needn’t'], correct: 0, explain: 'Prohibition = mustn’t. "Don’t have to" means it’s optional.' },
      { q: 'The lights are off. They ___ be asleep already.', options: ['can’t', 'must', 'shouldn’t', 'needn’t'], correct: 1, explain: 'Logical deduction from evidence → must.' },
      { q: 'Students ___ use dictionaries during the exam — it’s against the rules.', options: ['mustn’t', 'needn’t', 'don’t need to', 'couldn’t'], correct: 0, explain: 'Against the rules → prohibition → mustn’t.' },
      { q: 'I wish I ___ more time to prepare.', options: ['have', 'had', 'will have', 'would have'], correct: 1, explain: 'wish + Past Simple expresses regret about the present.' },
    ],
  },

  /* ═════════ TOEFL ═════════ */

  {
    id: 'b10', title: 'TOEFL · Academic Reading Mini-Test', subject: 'TOEFL', authorId: null,
    assignedGroups: ['*'], timeMin: 10, theory: { course: 'toefl', topic: 'reading' },
    questions: [
      { q: 'In academic texts, the phrase "by contrast" signals that the next idea will be:', options: ['an example', 'an opposite', 'a cause', 'a summary'], correct: 1, explain: 'By contrast = opposition. Expect an idea in the opposite direction.' },
      { q: 'A passage says universities "are increasingly adopting blended learning". "Blended learning" most likely means:', options: ['only online courses', 'a mix of online and in-person study', 'difficult courses', 'group sports'], correct: 1, explain: 'Blended = mixed: part online, part in person. Use context clues.' },
      { q: 'The main idea of a paragraph is usually found in:', options: ['the last word', 'the topic sentence, often first or second', 'a footnote', 'the longest sentence'], correct: 1, explain: 'TOEFL paragraphs typically open with a topic sentence.' },
      { q: '"The experiment corroborated earlier findings." The word "corroborated" is closest to:', options: ['contradicted', 'confirmed', 'questioned', 'replaced'], correct: 1, explain: 'Corroborate = confirm, support with evidence.' },
      { q: 'A question asks: "Why does the author mention 19th-century factories?" This is likely to:', options: ['test vocabulary', 'provide a historical example supporting the claim', 'change the topic', 'summarize the passage'], correct: 1, explain: 'Authors cite historical cases as supporting examples — a classic TOEFL "purpose" question.' },
      { q: 'The pronoun "this trend" at the start of a sentence refers to:', options: ['the next sentence', 'the idea described right before', 'the title', 'the last word of the sentence'], correct: 1, explain: 'Demonstrative + noun points BACK to the previously stated idea.' },
    ],
  },
  {
    id: 'b11', title: 'TOEFL · Writing & Speaking Skills', subject: 'TOEFL', authorId: null,
    assignedGroups: ['*'], timeMin: 8, theory: { course: 'toefl', topic: 'writing' },
    questions: [
      { q: 'In an integrated essay, the reading claims X and the lecture contradicts it. Your essay should:', options: ['defend the reading', 'present the lecture’s points that challenge X', 'give your own opinion', 'summarize both equally as true'], correct: 1, explain: 'Integrated task: the lecture challenges the reading — your job is to report HOW.' },
      { q: 'The best topic sentence for an independent essay about remote work is:', options: ['I will talk about remote work.', 'Remote work offers employees flexibility that improves productivity.', 'Remote work is a topic.', 'There are many opinions.'], correct: 1, explain: 'A topic sentence makes ONE specific claim the paragraph will develop.' },
      { q: 'For a 45-second independent speaking task, the strongest structure is:', options: ['list 6 ideas quickly', 'state opinion → 2 reasons with brief examples → restate', 'describe the prompt aloud', 'stay silent, then speak fast'], correct: 1, explain: 'Opinion + two supported reasons + short conclusion fits 45 seconds.' },
      { q: 'Which sentence is most appropriate for academic writing?', options: ['Kids kinda like online classes.', 'A considerable number of students prefer online classes.', 'Online classes are super cool!!!', 'You must believe online classes rock.'], correct: 1, explain: 'Academic register: formal, no slang, no exclamation marks.' },
      { q: 'The word "furthermore" is used to:', options: ['contrast ideas', 'add a supporting point', 'show time order', 'give an example'], correct: 1, explain: 'Furthermore = in addition — adds another supporting point.' },
      { q: 'In the independent essay, the conclusion should:', options: ['introduce brand-new arguments', 'restate the thesis and summarize key points', 'apologize for mistakes', 'ask the reader a question only'], correct: 1, explain: 'Conclusions restate the position and wrap up — no new arguments.' },
    ],
  },

  /* ═════════ VOCABULARY ═════════ */

  {
    id: 'b12', title: 'Academic Vocabulary Drill', subject: 'Vocabulary', authorId: null,
    assignedGroups: ['*'], timeMin: 8, theory: { course: 'sat-rw', topic: 'vocab' },
    questions: [
      { q: '"Ambiguous" most nearly means:', options: ['clear', 'open to multiple interpretations', 'aggressive', 'ambitious'], correct: 1, explain: 'Ambiguous = having more than one meaning.' },
      { q: '"To advocate" means to:', options: ['publicly support', 'criticize harshly', 'avoid', 'sell'], correct: 0, explain: 'Advocate (for) = speak in favor of.' },
      { q: 'A "pragmatic" solution is one that is:', options: ['idealistic', 'practical', 'expensive', 'temporary'], correct: 1, explain: 'Pragmatic = focused on what works in practice.' },
      { q: '"The policy was implemented" means it was:', options: ['suggested', 'put into action', 'criticized', 'cancelled'], correct: 1, explain: 'Implement = carry out, put into effect.' },
      { q: '"Substantial" evidence is:', options: ['tiny', 'considerable', 'fake', 'recent'], correct: 1, explain: 'Substantial = large in amount or degree.' },
      { q: '"To undermine confidence" means to:', options: ['strengthen it', 'weaken it', 'measure it', 'express it'], correct: 1, explain: 'Undermine = weaken gradually, often secretly.' },
      { q: 'A "redundant" sentence is one that:', options: ['repeats what was already said', 'is very short', 'is poetic', 'is false'], correct: 0, explain: 'Redundant = unnecessary repetition.' },
      { q: '"Explicit" information is:', options: ['stated directly', 'hidden', 'complex', 'spoken'], correct: 0, explain: 'Explicit = stated clearly and directly (opposite: implicit).' },
    ],
  },

  /* ═════════ MILLIY SERTIFIKAT ═════════ */

  {
    id: 'b13', title: 'Milliy Sertifikat · Grammar Check', subject: 'Milliy Sertifikat', authorId: null,
    assignedGroups: ['*'], timeMin: 8, theory: { course: 'grammar', topic: 'tenses' },
    questions: [
      { q: 'Choose the correct variant: "He ___ to school every day."', options: ['go', 'goes', 'is going', 'gone'], correct: 1, explain: 'Habitual action, third person singular → goes.' },
      { q: '"There ___ a lot of students in the hall."', options: ['is', 'are', 'was', 'be'], correct: 1, explain: 'Plural subject (students) → are.' },
      { q: 'The comparative form of "good" is:', options: ['gooder', 'more good', 'better', 'best'], correct: 2, explain: 'Irregular: good → better → best.' },
      { q: '"I have lived here ___ ten years."', options: ['since', 'for', 'during', 'from'], correct: 1, explain: 'Period of time → for; starting point → since.' },
      { q: 'Passive voice of "They built the bridge in 1990":', options: ['The bridge built in 1990.', 'The bridge was built in 1990.', 'The bridge is built in 1990.', 'The bridge has built in 1990.'], correct: 1, explain: 'Past Simple Passive: was/were + V3.' },
      { q: '"She is interested ___ modern art."', options: ['about', 'in', 'on', 'for'], correct: 1, explain: 'Fixed preposition: interested IN.' },
      { q: '"If I ___ more time, I would learn Italian."', options: ['have', 'had', 'will have', 'would have'], correct: 1, explain: 'Second Conditional: if + Past Simple, would + verb.' },
    ],
  },

  /* ═════════ DIAGNOSTIC ═════════ */

  {
    id: 'b14', title: 'Full Diagnostic · Mixed Checkpoint', subject: 'Diagnostic', authorId: null,
    assignedGroups: ['*'], timeMin: 14, theory: null,
    questions: [
      { q: 'If 4(x − 2) = 2x + 10, then x =', options: ['7', '9', '3', '18'], correct: 1, explain: '4x − 8 = 2x + 10 → 2x = 18 → x = 9.' },
      { q: 'A price falls from $80 to $68. The percent decrease is:', options: ['12%', '15%', '17.6%', '85%'], correct: 1, explain: '12/80 = 0.15 → 15%.' },
      { q: '√144 + 3² =', options: ['21', '15', '147', '24'], correct: 0, explain: '12 + 9 = 21.' },
      { q: 'The mean of 3, 7, 8, 10, 12 is:', options: ['8', '8.5', '9', '10'], correct: 0, explain: 'Sum = 40 → 40 ÷ 5 = 8.' },
      { q: '"The proposal was met with ___ silence." (best fit)', options: ['stunned', 'stunning', 'stunt', 'staunch'], correct: 0, explain: 'Stunned silence — shocked reaction. Staunch means loyal.' },
      { q: 'Neither the students nor the teacher ___ ready.', options: ['were', 'was', 'are', 'have'], correct: 1, explain: 'With neither…nor the verb agrees with the NEARER subject (teacher, singular) → was.' },
      { q: 'She has been working here ___ 2020.', options: ['for', 'since', 'from', 'during'], correct: 1, explain: 'Starting point → since.' },
      { q: 'y varies inversely with x. When x = 6, y = 4. What is y when x = 8?', options: ['2', '3', '5.33', '12'], correct: 1, explain: 'xy = 24 → y = 24/8 = 3.' },
      { q: 'A right triangle has legs 5 and 12. The hypotenuse is:', options: ['13', '14', '15', '17'], correct: 0, explain: '5-12-13 is a classic Pythagorean triple.' },
      { q: 'The probability of at least one head in two fair coin flips is:', options: ['1/2', '2/3', '3/4', '1/3'], correct: 2, explain: 'P(at least one) = 1 − P(no heads) = 1 − 1/4 = 3/4.' },
    ],
  },
];
