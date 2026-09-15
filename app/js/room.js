/* ═══════════════════════════════════════════════════════════
   VOSKHOD — комната занятия: WebRTC видео/аудио, демонстрация
   экрана, интерактивная доска с синхронизацией, чат.
   Сигналинг — PeerJS Cloud (бесплатный), медиа — P2P напрямую.
   Преподаватель — «хост» комнаты: его peer id = vh-<lessonId>-host.
   ═══════════════════════════════════════════════════════════ */

window.Room = (function () {
  'use strict';

  var esc = UI.esc, ic = UI.ic, toast = UI.toast;
  var peer = null, conns = {}, calls = {};
  var myStream = null, screenStream = null;
  var st = null;
  var boardDirty = false;

  function hostId(lessonId) { return 'vh-' + lessonId + '-host'; }

  function cleanup() {
    if (peer) { try { peer.destroy(); } catch (e) {} peer = null; }
    conns = {}; calls = {};
    if (myStream) { myStream.getTracks().forEach(function (t) { t.stop(); }); myStream = null; }
    if (screenStream) { screenStream.getTracks().forEach(function (t) { t.stop(); }); screenStream = null; }
    st = null;
    document.body.classList.remove('exam-mode');
  }

  function broadcast(msg, exceptId) {
    if (!st || !st.isHost) { if (st && st.hostConn) { try { st.hostConn.send(msg); } catch (e) {} } return; }
    Object.keys(conns).forEach(function (id) {
      if (id === exceptId) return;
      try { conns[id].send(msg); } catch (e) {}
    });
  }

  /* ═══════════ ЭКРАН КОМНАТЫ ═══════════ */

  function renderRoom(root, user, lessonId) {
    var lesson = DB.lesson(lessonId);
    if (!lesson) { location.hash = '#/schedule'; return; }
    var canHost = user.role === 'teacher' || user.role === 'admin' || user.id === lesson.teacherId;
    var inGroup = DB.groupsFor(user).some(function (g) { return g.id === lesson.groupId; });
    if (!canHost && !inGroup) { location.hash = '#/schedule'; return; }

    st = {
      user: user, lesson: lesson, lessonId: lessonId,
      isHost: canHost,
      mic: true, cam: true, screen: false, board: false,
      strokes: [], redoStrokes: [],
      chat: [], peers: {},
      connected: false,
      drawColor: '#EDEBFF',
    };

    document.body.classList.add('exam-mode'); /* тот же фокус-режим: без шапки/таббара */

    root.innerHTML =
      '<div class="room">' +
        '<div class="room__head">' +
          '<button class="mock-top__exit" id="roomExit" aria-label="Выйти">' + ic('x') + '</button>' +
          '<div class="mock-top__title"><b>' + esc(lesson.subject) + (lesson.club ? ' · 🗣 Speaking Club' : '') + '</b>' +
          '<span id="roomState">подключение к комнате…</span></div>' +
          '<div class="room__peers" id="roomPeers">1 👤</div>' +
        '</div>' +
        '<div class="room__stage">' +
          '<div class="room__videos" id="roomVideos">' +
            '<div class="room__tile" id="tileLocal"><video id="vidLocal" autoplay muted playsinline></video>' +
              '<span class="room__tile-label">' + esc(user.name.split(' ')[0]) + ' (ты)</span></div>' +
            '<div id="tileRemoteWrap"></div>' +
          '</div>' +
          '<div class="room__board" id="roomBoard" style="display:none">' +
            '<canvas id="boardCanvas"></canvas>' +
            '<div class="room__board-tools">' +
              ['board', '#EDEBFF', '#67E8F9', '#F5C24B', '#F58C8C', '#7CE8B5'].map(function (c, i) {
                return '<button class="room__color' + (i === 1 ? ' is-on' : '') + '" data-color="' + c + '" style="background:' + (i === 0 ? '#1A1030' : c) + '" title="' + (i === 0 ? 'Ластик' : 'Цвет') + '"></button>';
              }).join('') +
              '<button class="room__color" id="boardUndo" title="Отменить">↩</button>' +
              '<button class="room__color" id="boardClear" title="Очистить">🗑</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="room__side" id="roomSide">' +
          '<div class="room__panel" id="panelChat">' +
            '<div class="room__chat-log" id="chatLog"></div>' +
            '<form id="chatForm" class="room__chat-form">' +
              '<input class="input" id="chatInput" placeholder="сообщение…" autocomplete="off" maxlength="300">' +
              '<button class="btn btn--ion btn--sm" type="submit">▸</button>' +
            '</form>' +
          '</div>' +
          '<div class="room__panel" id="panelInfo" style="display:none">' +
            '<p class="section-label" style="margin:0 0 8px"><span>тема занятия</span></p>' +
            '<p style="font-size:14.5px;margin-bottom:10px">' + esc(lesson.topic || '—') + '</p>' +
            (lesson.materials && lesson.materials.length
              ? '<p class="section-label" style="margin:0 0 8px"><span>материалы</span></p>' +
                lesson.materials.map(function (m) {
                  return '<a class="btn btn--ghost btn--sm" style="margin-bottom:6px" href="' + esc(m.url || '#') + '" target="_blank" rel="noopener">' + esc(m.name) + '</a>';
                }).join('')
              : '<p style="font-size:13px;color:var(--dust-2)">материалов нет</p>') +
            '<p class="section-label" style="margin:14px 0 8px"><span>домашка к уроку</span></p>' +
            (function () {
              var hw = DB.hwFor(user).filter(function (h) { return h.lessonId === lesson.id; });
              return hw.length ? hw.map(function (h) {
                return '<p style="font-size:13.5px;margin-bottom:6px">' + esc(h.title) + ' <span class="mono" style="font-size:10.5px;color:var(--dust-2)">до ' + UI.fmtDate(h.due) + '</span></p>';
              }).join('') : '<p style="font-size:13px;color:var(--dust-2)">без домашки</p>';
            })() +
            '<a class="btn btn--ghost btn--sm" href="#/trainer" style="margin-top:10px">К тренажёру после урока →</a>' +
          '</div>' +
        '</div>' +
        '<div class="room__controls">' +
          '<button class="room__ctl" id="ctlMic" title="Микрофон">' + ic('mic') + '<span>Микрофон</span></button>' +
          '<button class="room__ctl" id="ctlCam" title="Камера">' + ic('cam') + '<span>Камера</span></button>' +
          '<button class="room__ctl" id="ctlScreen" title="Показать экран">' + ic('screen') + '<span>Экран</span></button>' +
          '<button class="room__ctl" id="ctlBoard" title="Доска">' + ic('edit') + '<span>Доска</span></button>' +
          '<button class="room__ctl" id="ctlChat" title="Чат">' + ic('chatmsg') + '<span>Чат</span></button>' +
          '<button class="room__ctl" id="ctlInfo" title="Материалы">' + ic('book') + '<span>Урок</span></button>' +
        '</div>' +
      '</div>';

    bindRoom(root, user);
    initMediaAndPeer(root, user);
    window.__roomSt = st; /* отладка */
    window.scrollTo(0, 0);
  }

  /* ═══════════ МЕДИА + PEER ═══════════ */

  function initMediaAndPeer(root, user) {
    var wantCam = true, wantMic = true;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: wantCam, audio: wantMic }).then(function (s) {
        myStream = s;
        var v = document.getElementById('vidLocal');
        if (v) v.srcObject = s;
        wirePeer(root, user);
      }).catch(function () {
        wirePeer(root, user); /* без камеры: смотреть/чат/доска */
        var t = document.getElementById('roomState');
        if (t) t.textContent = 'камера/микрофон недоступны — режим просмотра';
      });
    } else {
      wirePeer(root, user);
    }
  }

  function myPeerId() { return null; } /* студент получает случайный id */

  function wirePeer(root, user) {
    if (typeof Peer === 'undefined') {
      var t = document.getElementById('roomState');
      if (t) t.textContent = 'модуль связи не загрузился — проверь интернет';
      return;
    }
    if (st.isHost) {
      peer = new Peer(hostId(st.lessonId), { debug: 0 });
      peer.on('open', function () { setRoomState('комната открыта — ученики могут подключаться'); });
      peer.on('connection', function (conn) {
        conn.on('open', function () {
          conns[conn.peer] = conn;
          conn.send({ t: 'hello-back', from: st.user.name, role: 'host', strokes: st.strokes, chat: st.chat.slice(-30) });
          updatePeerCount();
          if (myStream) { var c = peer.call(conn.peer, myStream); calls[conn.peer] = c; }
        });
        conn.on('data', function (msg) { onData(root, user, msg, conn.peer); });
        conn.on('close', function () {
          delete conns[conn.peer]; delete calls[conn.peer];
          removeRemoteVideo(conn.peer);
          updatePeerCount();
        });
      });
      peer.on('call', function (call) {
        calls[call.peer] = call;
        if (myStream) call.answer(myStream); else call.answer();
        call.on('stream', function (remote) { attachRemoteVideo(call.peer, remote); });
      });
      peer.on('error', function (e) {
        if (String(e.type) === 'unavailable-id') toast('Комната уже открыта в другом окне', 'warn');
        setRoomState('ошибка связи: ' + e.type);
      });
    } else {
      peer = new Peer(null, { debug: 0 });
      peer.on('open', function (myId) {
        var conn = peer.connect(hostId(st.lessonId), { reliable: true });
        st.hostConn = conn;
        conn.on('open', function () {
          setRoomState('подключено к преподавателю');
          conn.send({ t: 'hello', from: user.name, role: 'student' });
          if (myStream) peer.call(hostId(st.lessonId), myStream);
        });
        conn.on('data', function (msg) { onData(root, user, msg, conn.peer); });
        conn.on('close', function () { setRoomState('преподаватель вышел из комнаты'); });
        var call = peer.call(hostId(st.lessonId), myStream || new MediaStream());
        call.on('stream', function (remote) { attachRemoteVideo('host', remote); setRoomState('подключено'); });
      });
      peer.on('error', function (e) {
        setRoomState(String(e.type) === 'peer-unavailable'
          ? 'преподаватель ещё не в комнате — подожди или напиши в чат позже'
          : 'ошибка связи: ' + e.type);
      });
    }
  }

  function onData(root, user, msg, fromId) {
    if (!msg || !msg.t) return;
    if (msg.t === 'hello') {
      st.peers[fromId] = msg.from || 'участник';
      addChatMsg(msg.from, 'присоединился к занятию', true);
      updatePeerCount();
      if (st.isHost && conns[fromId]) {
        conns[fromId].send({ t: 'hello-back', from: st.user.name, role: 'host', strokes: st.strokes, chat: st.chat.slice(-30) });
        if (myStream && calls[fromId]) { /* поток уже идёт */ }
      }
      return;
    }
    if (msg.t === 'hello-back') {
      st.peers[fromId] = msg.from || 'преподаватель';
      if (msg.strokes && msg.strokes.length) { st.strokes = msg.strokes; redrawBoard(); }
      if (msg.chat && msg.chat.length) { st.chat = st.chat.concat(msg.chat); renderChat(); }
      updatePeerCount();
      return;
    }
    if (msg.t === 'chat') { addChatMsg(msg.from, msg.text, false); if (st.isHost) broadcast(msg, fromId); return; }
    if (msg.t === 'stroke') { st.strokes.push(msg.stroke); drawStroke(msg.stroke); if (st.isHost) broadcast(msg, fromId); return; }
    if (msg.t === 'undo') { st.strokes.pop(); redrawBoard(); if (st.isHost) broadcast(msg, fromId); return; }
    if (msg.t === 'clear') { st.strokes = []; redrawBoard(); if (st.isHost) broadcast(msg, fromId); return; }
  }

  function addChatMsg(from, text, isSystem) {
    st.chat.push({ t: 'chat', from: from, text: text, system: !!isSystem });
    renderChat();
  }
  function renderChat() {
    var log = document.getElementById('chatLog');
    if (!log) return;
    log.innerHTML = st.chat.map(function (m) {
      return m.system
        ? '<div class="room__chat-sys">· ' + esc(m.text || (m.from + ' присоединился')) + '</div>'
        : '<div class="room__chat-msg"><b>' + esc(m.from) + ':</b> ' + esc(m.text || '') + '</div>';
    }).join('');
    log.scrollTop = log.scrollHeight;
  }
  function updatePeerCount() {
    var el = document.getElementById('roomPeers');
    if (!el || !st) return;
    var n = 1 + Object.keys(conns).length;
    el.textContent = n + ' 👤';
  }
  function setRoomState(text) {
    var el = document.getElementById('roomState');
    if (el) el.textContent = text;
  }
  function attachRemoteVideo(peerId, remote) {
    var wrap = document.getElementById('tileRemoteWrap');
    if (!wrap) return;
    var id = 'tile-' + peerId.replace(/[^a-z0-9]/gi, '');
    var tile = document.getElementById(id);
    if (!tile) {
      tile = document.createElement('div');
      tile.className = 'room__tile';
      tile.id = id;
      var label = st && st.peers[peerId] ? esc(st.peers[peerId]) : 'участник';
      tile.innerHTML = '<video autoplay playsinline></video><span class="room__tile-label">' + label + '</span>';
      wrap.appendChild(tile);
    }
    var v = tile.querySelector('video');
    v.srcObject = remote;
  }
  function removeRemoteVideo(peerId) {
    var tile = document.getElementById('tile-' + peerId.replace(/[^a-z0-9]/gi, ''));
    if (tile) tile.remove();
  }

  /* ═══════════ УПРАВЛЕНИЕ ═══════════ */

  function bindRoom(root, user) {
    document.getElementById('roomExit').addEventListener('click', function () {
      var m = UI.modal(
        '<div class="modal__head"><h3>Выйти из занятия?</h3><button class="icon-btn" data-close>' + ic('x') + '</button></div>' +
        '<p style="color:var(--dust);font-size:14px">Комната останется открытой — можно вернуться по ссылке из расписания.</p>' +
        '<div class="modal__foot"><button class="btn btn--ghost btn--full" data-close>Остаться</button>' +
        '<button class="btn btn--danger btn--full" id="exitYes">Выйти</button></div>');
      m.el.querySelector('#exitYes').addEventListener('click', function () {
        m.close();
        cleanup();
        location.hash = '#/schedule';
      });
    });

    document.getElementById('ctlMic').addEventListener('click', function () {
      if (!myStream) { toast('Камера/микрофон недоступны', 'warn'); return; }
      var track = myStream.getAudioTracks()[0];
      if (!track) return;
      track.enabled = !track.enabled;
      st.mic = track.enabled;
      this.classList.toggle('is-off', !st.mic);
      toast(st.mic ? 'Микрофон включён' : 'Микрофон выключен', st.mic ? 'ok' : 'warn');
    });

    document.getElementById('ctlCam').addEventListener('click', function () {
      if (!myStream) { toast('Камера недоступна', 'warn'); return; }
      var track = myStream.getVideoTracks()[0];
      if (!track) return;
      track.enabled = !track.enabled;
      st.cam = track.enabled;
      this.classList.toggle('is-off', !st.cam);
    });

    document.getElementById('ctlScreen').addEventListener('click', function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast('Демонстрация экрана не поддерживается здесь — открой на компьютере', 'warn');
        return;
      }
      if (st.screen) {
        screenStream.getTracks().forEach(function (t) { t.stop(); });
        screenStream = null;
        st.screen = false;
        this.classList.remove('is-on');
        restoreCamVideo();
        return;
      }
      navigator.mediaDevices.getDisplayMedia({ video: true }).then(function (s) {
        screenStream = s;
        st.screen = true;
        replaceVideoForAll(s);
        document.getElementById('ctlScreen').classList.add('is-on');
        var vid = document.getElementById('vidLocal');
        if (vid) vid.srcObject = s;
        s.getVideoTracks()[0].onended = function () {
          st.screen = false;
          var b = document.getElementById('ctlScreen');
          if (b) b.classList.remove('is-on');
          restoreCamVideo();
        };
      }).catch(function () { toast('Демонстрация отменена', 'warn'); });
    });

    document.getElementById('ctlBoard').addEventListener('click', function () {
      st.board = !st.board;
      this.classList.toggle('is-on', st.board);
      var bd = document.getElementById('roomBoard');
      var vids = document.getElementById('roomVideos');
      if (bd) bd.style.display = st.board ? '' : 'none';
      if (vids) vids.style.display = st.board ? 'none' : '';
      if (st.board) initBoardCanvas();
    });

    document.getElementById('ctlChat').addEventListener('click', function () {
      togglePanel('panelChat');
    });
    document.getElementById('ctlInfo').addEventListener('click', function () {
      togglePanel('panelInfo');
    });

    document.getElementById('chatForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('chatInput');
      var text = input.value.trim();
      if (!text) return;
      var msg = { t: 'chat', from: user.name.split(' ')[0], text: text };
      st.chat.push(msg);
      broadcast(msg);
      addChatMsg(msg.from, text, false);
      input.value = '';
    });

    /* доска: инструменты */
    root.querySelectorAll('[data-color]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (st) st.drawColor = b.dataset.color === 'board' ? 'board' : b.dataset.color;
        root.querySelectorAll('[data-color]').forEach(function (x) { x.classList.remove('is-on'); });
        b.classList.add('is-on');
      });
    });
    var undoBtn = document.getElementById('boardUndo');
    if (undoBtn) undoBtn.addEventListener('click', function () {
      st.strokes.pop();
      redrawBoard();
      broadcast({ t: 'undo' });
    });
    var clearBtn = document.getElementById('boardClear');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      st.strokes = [];
      redrawBoard();
      broadcast({ t: 'clear' });
    });

    if (!st.drawColor) st.drawColor = '#EDEBFF';
  }

  /* проверка при ресайзе видимой доски */
  window.addEventListener('resize', function () {
    if (window.Room && st && st.board) {
      var c = document.getElementById('boardCanvas');
      if (c) { fitCanvas(c); redrawBoard(); }
    }
  });

  function restoreCamVideo() {
    if (!myStream) return;
    var vid = document.getElementById('vidLocal');
    if (vid) vid.srcObject = myStream;
    /* вернуть камеру во все подключения */
    Object.keys(calls).forEach(function (id) {
      var sender = calls[id] && calls[id].peerConnection
        ? calls[id].peerConnection.getSenders().find(function (s) { return s.track && s.track.kind === 'video'; })
        : null;
      if (sender && myStream.getVideoTracks()[0]) sender.replaceTrack(myStream.getVideoTracks()[0]);
    });
  }

  function replaceVideoForAll(newStream) {
    var track = newStream.getVideoTracks()[0];
    Object.keys(calls).forEach(function (id) {
      var pc = calls[id] && calls[id].peerConnection;
      if (!pc) return;
      var sender = pc.getSenders().find(function (s) { return s.track && s.track.kind === 'video'; });
      if (sender) sender.replaceTrack(track);
    });
  }

  function togglePanel(id) {
    var chat = document.getElementById('panelChat');
    var info = document.getElementById('panelInfo');
    var side = document.getElementById('roomSide');
    var target = document.getElementById(id);
    if (!target) return;
    var show = target.style.display === 'none';
    chat.style.display = 'none';
    info.style.display = 'none';
    side.style.display = show ? '' : 'none';
    if (show && id === 'panelChat') renderChat();
  }

  /* ═══════════ ДОСКА ═══════════ */

  function initBoardCanvas() {
    var canvas = document.getElementById('boardCanvas');
    if (!canvas) return;
    fitCanvas(canvas);
    redrawBoard();

    var drawing = false, cur = null;
    function pos(e) {
      var r = canvas.getBoundingClientRect();
      var p = e.touches ? e.touches[0] : e;
      return [((p.clientX - r.left) / r.width).toFixed(4), ((p.clientY - r.top) / r.height).toFixed(4)];
    }
    function start(e) {
      if (!st) return;
      drawing = true;
      cur = { t: 'stroke', topic: st.lessonId, color: st.drawColor === 'board' ? 'erase' : st.drawColor, size: st.drawColor === 'board' ? 22 : 3, pts: [pos(e)] };
      e.preventDefault();
    }
    function move(e) {
      if (!drawing || !cur) return;
      cur.pts.push(pos(e));
      redrawBoard();
      e.preventDefault();
    }
    function end() {
      if (!drawing || !cur) return;
      drawing = false;
      st.strokes.push(cur);
      broadcast({ t: 'stroke', stroke: cur });
      cur = null;
    }
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('resize', function () { if (st && st.board) fitCanvas(canvas); });
  }

  function fitCanvas(canvas) {
    var r = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.max(300, Math.round(r.width));
    canvas.height = Math.max(200, Math.round(r.height));
  }

  function drawStroke(s) {
    var canvas = document.getElementById('boardCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (s.color === 'erase') {
      ctx.strokeStyle = '#14102A';
      ctx.lineWidth = (s.size || 22) * canvas.width / 900;
    } else {
      ctx.strokeStyle = s.color || '#EDEBFF';
      ctx.lineWidth = (s.size || 3) * canvas.width / 900;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    var w = canvas.width, h = canvas.height;
    ctx.beginPath();
    s.pts.forEach(function (p, i) {
      var x = parseFloat(p[0]) * w, y = parseFloat(p[1]) * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    if (s.pts.length === 1) { ctx.lineTo(parseFloat(s.pts[0][0]) * w + 1, parseFloat(s.pts[0][1]) * h); }
    ctx.stroke();
  }

  function redrawBoard() {
    var canvas = document.getElementById('boardCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#14102A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (st) st.strokes.forEach(drawStroke);
  }

  function fitIfVisible() {
    var c = document.getElementById('boardCanvas');
    if (c && st && st.board) { fitCanvas(c); redrawBoard(); }
  }

  return {
    renderRoom: renderRoom,
    cleanup: cleanup,
    fitIfVisible: fitIfVisible,
  };
})();
