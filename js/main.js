/* ═══════════════════════════════════════════════════════════
   VOSKHOD — интерактив: живая траектория, boot-секвенция,
   reveal-анимации, счётчики, FAQ, форма, курсор, магнит-кнопки
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isDesktop = window.matchMedia('(min-width: 960px)').matches;

  /* ── контакты: поменять здесь в одном месте ──────────────── */
  var CONTACTS = {
    telegram: 'https://t.me/voskhod_placeholder',
    whatsapp: 'https://wa.me/998000000000',
    instagram: 'https://instagram.com/voskhod.placeholder'
  };

  /* ═══════════ boot-секвенция ═══════════ */

  (function boot() {
    var bootEl = document.getElementById('boot');
    if (!bootEl) return;
    if (reducedMotion || sessionStorage.getItem('voskhod-booted')) {
      bootEl.remove();
      return;
    }
    sessionStorage.setItem('voskhod-booted', '1');
    var done = function () {
      bootEl.classList.add('boot--done');
      setTimeout(function () { bootEl.remove(); }, 800);
    };
    setTimeout(done, 2300);
    bootEl.addEventListener('click', done);
  })();

  /* ═══════════ кастомный курсор ═══════════ */

  (function cursor() {
    if (reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var el = document.querySelector('.cursor');
    if (!el) return;
    document.body.classList.add('has-cursor');
    var ring = el.querySelector('.cursor__ring');
    var dot = el.querySelector('.cursor__dot');
    var x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;

    addEventListener('pointermove', function (e) { x = e.clientX; y = e.clientY; }, { passive: true });

    (function loop() {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(loop);
    })();

    document.addEventListener('mouseover', function (e) {
      var t = e.target;
      if (t.closest && t.closest('a, button, summary, input, select, .btn')) {
        el.classList.add('cursor--active');
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest('a, button, summary, input, select, .btn')) {
        el.classList.remove('cursor--active');
      }
    });
    document.addEventListener('mouseleave', function () { el.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { el.style.opacity = '1'; });
  })();

  /* ═══════════ шапка и мобильное меню ═══════════ */

  (function header() {
    var header = document.getElementById('header');
    var burger = document.getElementById('burger');
    var nav = document.getElementById('nav');
    if (!header) return;

    var onScroll = function () {
      header.classList.toggle('header--scrolled', scrollY > 12);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (burger && nav) {
      burger.addEventListener('click', function () {
        var open = nav.classList.toggle('nav--open');
        burger.classList.toggle('burger--open', open);
        burger.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) {
          nav.classList.remove('nav--open');
          burger.classList.remove('burger--open');
          burger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    }
  })();

  /* ═══════════ reveal по скроллу ═══════════ */

  (function reveals() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    /* каскадная задержка внутри групповых контейнеров */
    var groups = ['.cards', '.quotes', '.stats', '.faq__list', '.stages'];
    groups.forEach(function (sel) {
      var parent = document.querySelector(sel);
      if (!parent) return;
      parent.querySelectorAll('.reveal').forEach(function (el, i) {
        el.style.setProperty('--reveal-delay', Math.min(i * 0.09, 0.4) + 's');
      });
    });

    if (reducedMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ═══════════ живая траектория (сигнатура сайта) ═══════════ */

  (function trajectory() {
    if (!isDesktop || reducedMotion) return;

    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.id = 'trajectorySvg';
    svg.setAttribute('aria-hidden', 'true');
    var style = svg.style;
    style.position = 'absolute';
    style.inset = '0';
    style.zIndex = '-1';
    style.pointerEvents = 'none';
    style.width = '100%';
    style.height = '100%';
    document.body.appendChild(svg);

    var defs = document.createElementNS(NS, 'defs');
    var grad = document.createElementNS(NS, 'linearGradient');
    grad.id = 'trajGrad';
    grad.setAttribute('gradientUnits', 'userSpaceOnUse');
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    var x2 = document.createElementNS(NS, 'stop');
    x2.setAttribute('offset', '0'); x2.setAttribute('stop-color', '#67E8F9');
    var mid = document.createElementNS(NS, 'stop');
    mid.setAttribute('offset', '0.55'); mid.setAttribute('stop-color', '#8B5CF6');
    var end = document.createElementNS(NS, 'stop');
    end.setAttribute('offset', '1'); end.setAttribute('stop-color', '#F5C24B');
    grad.appendChild(x2); grad.appendChild(mid); grad.appendChild(end);
    defs.appendChild(grad);
    svg.appendChild(defs);

    var path = document.createElementNS(NS, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'url(#trajGrad)');
    path.setAttribute('stroke-width', '1.6');
    path.setAttribute('stroke-dasharray', '5 9');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('opacity', '0.75');
    svg.appendChild(path);

    /* светящийся след за аппаратом: подложка с толстым штрихом */
    var glowPath = path.cloneNode();
    glowPath.setAttribute('stroke-width', '7');
    glowPath.setAttribute('opacity', '0.14');
    glowPath.setAttribute('filter', 'blur(3px)');
    svg.insertBefore(glowPath, path);

    /* аппарат — ядро + ореол */
    var probe = document.createElementNS(NS, 'g');
    var halo = document.createElementNS(NS, 'circle');
    halo.setAttribute('r', '14');
    halo.setAttribute('fill', '#F5C24B');
    halo.setAttribute('opacity', '0.18');
    var core = document.createElementNS(NS, 'circle');
    core.setAttribute('r', '4.5');
    core.setAttribute('fill', '#FFE9B0');
    probe.appendChild(halo);
    probe.appendChild(core);
    probe.style.opacity = '0';
    svg.appendChild(probe);

    var docLen = 0, nodesLen = [], nodeEls = [];
    var total = 0, height = 0;
    var W = 1, H = 1;

    /* Catmull-Rom → кубические Безье */
    function buildPathD(pts) {
      if (pts.length < 2) return '';
      var d = 'M ' + pts[0].x + ' ' + pts[0].y;
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[Math.max(0, i - 1)], p1 = pts[i],
            p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
        var c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
        d += ' C ' + c1x + ' ' + c1y + ' ' + c2x + ' ' + c2y + ' ' + p2.x + ' ' + p2.y;
      }
      return d;
    }

    function nodePoint(el) {
      var r = el.getBoundingClientRect();
      var sy = scrollX, sy2 = scrollY;
      var marker = el.querySelector('.stage__marker');
      if (marker) {
        var m = marker.getBoundingClientRect();
        return { x: m.left - sy + m.width / 2, y: m.top - sy2 + m.height / 2 };
      }
      if (el.classList.contains('hero__actions') || el.classList.contains('hero')) {
        return { x: r.left - sy + r.width / 2, y: r.top - sy2 + r.height / 2 };
      }
      /* секции: чуть ниже заголовка, по центру колонки */
      var container = el.querySelector('.container') || el;
      var cr = container.getBoundingClientRect();
      return { x: cr.left - sy + cr.width / 2, y: cr.top - sy2 + 90 };
    }

    function build() {
      if (!isDesktop) { svg.style.display = 'none'; return; }
      svg.style.display = '';

      var heroActions = document.querySelector('.hero__actions');
      var sections = Array.prototype.slice.call(document.querySelectorAll('[data-trajectory]'));
      var els = [];
      if (heroActions) els.push(heroActions);
      els = els.concat(sections);

      var pts = els.map(nodePoint);
      if (pts.length < 2) return;
      nodeEls = els;

      /* слегка волнистая линия: сдвигаем x между узлами для живости */
      for (var i = 1; i < pts.length - 1; i++) {
        var prev = pts[i - 1], next = pts[i + 1];
        if (Math.abs(prev.x - next.x) < 40) {
          pts[i].x += (i % 2 ? 1 : -1) * (46 + (i % 3) * 22);
        }
      }

      W = document.documentElement.scrollWidth;
      H = document.documentElement.scrollHeight;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      /* размер в пикселях: height:100% у absolute-элемента
         считался бы от вьюпорта, а не от высоты документа */
      svg.style.width = W + 'px';
      svg.style.height = H + 'px';
      grad.setAttribute('y2', String(H));

      var d = buildPathD(pts);
      path.setAttribute('d', d);
      glowPath.setAttribute('d', d);
      solidPath.setAttribute('d', d);

      total = path.getTotalLength();
      path.style.strokeDasharray = '5 9';
      glowPath.style.strokeDasharray = '14 22';
      solidPath.style.strokeDasharray = total + ' ' + total;

      /* длина до каждого узла (бинарный поиск по y) */
      nodesLen = pts.map(function (p) { return lenAtY(p.y); });

      update();
    }

    /* длина вдоль пути, где y достигает значения targetY (путь монотонен по y) */
    function lenAtY(targetY) {
      var lo = 0, hi = total;
      for (var i = 0; i < 22; i++) {
        var midL = (lo + hi) / 2;
        var p = path.getPointAtLength(midL);
        if (p.y < targetY) lo = midL; else hi = midL;
      }
      return (lo + hi) / 2;
    }

    var ticking = false;
    function update() {
      if (!total) return;
      var probeY = scrollY + innerHeight * 0.55;
      var L = lenAtY(Math.max(0, probeY));
      var p = Math.min(1, Math.max(0, L / total));

      /* призрачный пунктир виден на всём пути вперёд,
         сплошное свечение прорисовывается до текущей точки */
      solidPath.style.strokeDashoffset = String(total * (1 - p));

      var pt = path.getPointAtLength(L);
      probe.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
      probe.style.opacity = p > 0.01 && p < 0.999 ? '1' : '0';

      /* подсветка пройденных узлов */
      nodesLen.forEach(function (nl, i) {
        var host = nodeEls[i];
        if (host) host.classList.toggle('is-lit', L >= nl - 6);
      });
    }

    /* отдельный сплошной путь поверх пунктира */
    var solidPath = path.cloneNode();
    solidPath.setAttribute('stroke-width', '2.2');
    solidPath.setAttribute('opacity', '1');
    solidPath.removeAttribute('stroke-dasharray');
    svg.insertBefore(solidPath, glowPath);

    addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () { update(); ticking = false; });
      }
    }, { passive: true });

    var rebuildTimer = null;
    function rebuild() {
      clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(build, 180);
    }
    addEventListener('resize', rebuild);
    if ('ResizeObserver' in window) {
      new ResizeObserver(rebuild).observe(document.body);
    }
    window.addEventListener('load', function () { build(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);

    build();
  })();

  /* ═══════════ счётчики телеметрии ═══════════ */

  (function counters() {
    var nums = document.querySelectorAll('.stat__num[data-count]');
    if (!nums.length) return;

    function render(el, value) {
      var dec = parseInt(el.dataset.decimals || '0', 10);
      var prefix = el.dataset.prefix || '';
      var suffix = el.dataset.suffix || '';
      el.textContent = prefix + value.toFixed(dec) + suffix;
    }

    function animate(el) {
      var target = parseFloat(el.dataset.count);
      if (reducedMotion) { render(el, target); return; }
      var dur = 1800, t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - k, 3);
        render(el, target * eased);
        if (k < 1) requestAnimationFrame(step);
        else render(el, target);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window) || reducedMotion) {
      nums.forEach(function (el) { render(el, parseFloat(el.dataset.count)); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          animate(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ═══════════ FAQ: плавное раскрытие ═══════════ */

  (function faq() {
    document.querySelectorAll('.faq__item').forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (item.open && !reducedMotion) {
          var body = item.querySelector('.faq__body');
          if (body) {
            body.animate(
              [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }],
              { duration: 380, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
            );
          }
        }
      });
    });
  })();

  /* ═══════════ магнитные кнопки ═══════════ */

  (function magnetic() {
    if (reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.querySelectorAll('.btn, .nav__cta').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + dx * 0.18 + 'px,' + (dy * 0.22 - 2) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  })();

  /* ═══════════ контакты ═══════════ */

  (function contacts() {
    var tg = document.querySelector('[data-tg-link]');
    var wa = document.querySelector('[data-wa-link]');
    var ig = document.querySelector('[data-ig-link]');
    if (tg) tg.href = CONTACTS.telegram;
    if (wa) wa.href = CONTACTS.whatsapp;
    if (ig) ig.href = CONTACTS.instagram;
  })();

  /* ═══════════ форма заявки ═══════════ */

  (function form() {
    var form = document.getElementById('applyForm');
    if (!form) return;
    var hint = document.getElementById('formHint');
    var success = document.getElementById('formSuccess');
    var btn = document.getElementById('submitBtn');

    function copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (resolve, reject) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); resolve(); }
        catch (err) { reject(err); }
        document.body.removeChild(ta);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var contact = document.getElementById('fContact').value.trim();
      var program = document.getElementById('fProgram').value;

      if (!name || !contact) {
        hint.textContent = 'заполни имя и контакт — без них мы не найдём тебя на связи';
        hint.style.color = '#F5C24B';
        return;
      }

      var msg = 'Заявка VOSKHOD ✦\nИмя: ' + name + '\nКонтакт: ' + contact + '\nНаправление: ' + program;

      copyText(msg).then(function () {
        success.hidden = false;
        success.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
        hint.hidden = true;
        btn.textContent = 'Открыть Telegram ещё раз';
        window.open(CONTACTS.telegram, '_blank', 'noopener');
      }).catch(function () {
        /* буфер недоступен — просто открываем Telegram */
        window.open(CONTACTS.telegram, '_blank', 'noopener');
        hint.textContent = 'не удалось скопировать автоматически — напиши нам в Telegram, это займёт минуту';
      });
    });
  })();

  /* ═══════════ год в футере ═══════════ */

  (function year() {
    var el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  })();
})();
