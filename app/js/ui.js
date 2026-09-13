/* ═══════════════════════════════════════════════════════════
   VOSKHOD Orbit — UI-хелперы: иконки, даты, тосты, модалки
   ═══════════════════════════════════════════════════════════ */

window.UI = (function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ── иконки (штрих, 24×24) ── */

  var ICONS = {
    home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10.5V20h4.5v-5h3v5H18v-9.5"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    clipboard: '<rect x="6" y="5" width="12" height="16" rx="2.5"/><path d="M9 5a3 3 0 0 1 6 0"/><path d="M9.5 12h5M9.5 15.5h3.5"/>',
    chart: '<path d="M4 20h16"/><path d="M7 20v-6M12 20V8M17 20v-9"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.5 14.7c2.8.2 5 2 5 4.8"/>',
    dots: '<circle cx="12" cy="5.5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/>',
    back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2.5"/>',
    play: '<path d="M8 5.5v13l10-6.5z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    logout: '<path d="M14 4.5H7A1.5 1.5 0 0 0 5.5 6v12A1.5 1.5 0 0 0 7 19.5h7"/><path d="M11 12h8.5M16.5 8.5 20 12l-3.5 3.5"/>',
    install: '<path d="M12 4v10M8 10.5l4 4 4-4"/><path d="M5 17.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-1.5"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M10.5 18.5h3"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    edit: '<path d="M13.5 6.5 17.5 10.5 8 20H4v-4z"/><path d="M11 9l4 4"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2M8 7l.7 13h6.6L16 7"/>',
    book: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21z"/><path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H19"/>',
    star: '<path d="M12 3.5 14.3 9.7 20.5 12 14.3 14.3 12 20.5 9.7 14.3 3.5 12 9.7 9.7z"/>',
    fire: '<path d="M12 3.5c.5 3-3.5 4.5-3.5 8a5.5 5.5 0 0 0 11 0c0-2-1-3.5-2-4.5 0 1.5-1 2.3-2 2.5.5-2.5-.5-5-3.5-6z"/>',
    link: '<path d="M10 14a4 4 0 0 0 6 .4l2.5-2.5a4 4 0 1 0-5.7-5.7L11.5 7.5"/><path d="M14 10a4 4 0 0 0-6-.4L5.5 12.1a4 4 0 1 0 5.7 5.7l1.3-1.3"/>',
    rocket: '<path d="M12 3.5c3.5 1.5 5.5 5 5.5 9l-2.5 2.5h-6L6.5 12.5c0-4 2-7.5 5.5-9z"/><circle cx="12" cy="10" r="1.8"/><path d="M9 17.5c-1.5 1-2 3-2 3s2.5-.3 3.8-1.6M15 17.5c1.5 1 2 3 2 3s-2.5-.3-3.8-1.6"/>',
  };

  function ic(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  /* ── аватары ── */

  function initials(name) {
    var p = String(name || '?').trim().split(/\s+/);
    return ((p[0] || '')[0] || '?').toUpperCase() + (p[1] ? p[1][0].toUpperCase() : '');
  }
  function avatar(user, size) {
    var cls = 'ava ava--' + (size || 'md');
    return '<span class="' + cls + '" aria-hidden="true">' + esc(initials(user && user.name)) + '</span>';
  }

  /* ── даты ── */

  var WD = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  var WD_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function wdIndex(isoStr) { return (parseIso(isoStr).getDay() + 6) % 7; }
  function fmtDate(isoStr) {
    var d = parseIso(isoStr);
    return d.getDate() + ' ' + MONTHS[d.getMonth()];
  }
  function fmtDateFull(isoStr) {
    return WD[wdIndex(isoStr)] + ', ' + fmtDate(isoStr);
  }
  function dayLabel(isoStr) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var d = parseIso(isoStr);
    var diff = Math.round((d - today) / 86400000);
    if (diff === 0) return 'Сегодня';
    if (diff === 1) return 'Завтра';
    if (diff === -1) return 'Вчера';
    return fmtDate(isoStr);
  }
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  /* ── тосты ── */

  function toast(msg, type) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast toast--' + (type || 'ok');
    el.innerHTML = '<span class="toast__dot"></span>' + esc(msg);
    root.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('toast--show'); });
    setTimeout(function () {
      el.classList.remove('toast--show');
      setTimeout(function () { el.remove(); }, 400);
    }, 2800);
  }

  /* ── модалка ── */

  function modal(html, opts) {
    var root = document.getElementById('modal-root');
    root.innerHTML = '<div class="modal__backdrop"></div><div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
    root.classList.add('modal-root--open');
    function close() {
      root.classList.remove('modal-root--open');
      root.innerHTML = '';
      document.removeEventListener('keydown', onKey);
      if (opts && opts.onClose) opts.onClose();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    root.querySelector('.modal__backdrop').addEventListener('click', close);
    var x = root.querySelector('[data-close]');
    if (x) x.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return { el: root.querySelector('.modal'), close: close };
  }

  function timeStr(hhmm) { return hhmm; }

  function fmtDur(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  return {
    esc: esc, ic: ic, avatar: avatar, initials: initials,
    WD: WD, WD_SHORT: WD_SHORT,
    fmtDate: fmtDate, fmtDateFull: fmtDateFull, dayLabel: dayLabel,
    plural: plural, toast: toast, modal: modal, fmtDur: fmtDur,
  };
})();
