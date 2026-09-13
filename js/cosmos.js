/* ═══════════════════════════════════════════════════════════
   VOSKHOD — процедурный космос (WebGL, без библиотек)
   Звёзды в 3 слоя с параллаксом и мерцанием, туманность
   (domain-warped fbm), млечный путь, солнце-цель, метеоры.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var canvas = document.getElementById('cosmos');
  if (!canvas) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 760px)').matches;

  var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
        || canvas.getContext('experimental-webgl');
  if (!gl) { document.body.classList.add('no-webgl'); return; }

  var VERT = [
    'attribute vec2 aPos;',
    'void main() { gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform vec2  uMouse;',
    'uniform float uQual;',

    'float hash21(vec2 p) {',
    '  p = fract(p * vec2(123.34, 456.21));',
    '  p += dot(p, p + 45.32);',
    '  return fract(p.x * p.y);',
    '}',

    'float vnoise(vec2 p) {',
    '  vec2 i = floor(p), f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  float a = hash21(i);',
    '  float b = hash21(i + vec2(1.0, 0.0));',
    '  float c = hash21(i + vec2(0.0, 1.0));',
    '  float d = hash21(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
    '}',

    'float fbm(vec2 p) {',
    '  float v = 0.0, a = 0.5;',
    '  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);',
    '  for (int i = 0; i < 5; i++) {',
    '    v += a * vnoise(p);',
    '    p = rot * p * 2.02 + 11.5;',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',

    /* возвращает (яркость, hash ячейки) — hash нужен для расцветки */
    'vec2 starLayer(vec2 uv, float density, float size, float t, float seed) {',
    '  vec2 gv = fract(uv) - 0.5;',
    '  vec2 id = floor(uv);',
    '  float h = hash21(id + seed);',
    '  if (h > density) return vec2(0.0, h);',
    '  vec2 offs = (vec2(hash21(id + seed + 1.7), hash21(id + seed + 3.9)) - 0.5) * 0.8;',
    '  float d = length(gv - offs);',
    '  float tw = 0.55 + 0.45 * sin(t * (0.8 + h * 3.0) + h * 99.0);',
    '  float core = smoothstep(size, 0.0, d);',
    '  float halo = smoothstep(size * 6.0, 0.0, d) * 0.28;',
    '  return vec2((core + halo * core) * tw, h);',
    '}',

    /* падающая звезда: голова + хвост-отрезок, окно яркости по фазе цикла */
    'float meteor(vec2 uv, float t, float seed) {',
    '  float T = fract(t * 0.09 + seed);',
    '  vec2 dir = normalize(vec2(-0.55, -0.85));',
    '  vec2 start = vec2(0.85 + seed * 0.5, 0.72);',
    '  vec2 head = start + dir * (T * 1.7);',
    '  float win = smoothstep(0.0, 0.10, T) * smoothstep(1.0, 0.60, T);',
    '  vec2 tail = head - dir * 0.16;',
    '  vec2 pa = uv - tail, ba = head - tail;',
    '  float hseg = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);',
    '  float dseg = length(pa - ba * hseg);',
    '  float streak = smoothstep(0.010, 0.0, dseg) * (0.30 + 0.70 * hseg);',
    '  float headGlow = smoothstep(0.030, 0.0, length(uv - head));',
    '  return (streak + headGlow) * win;',
    '}',

    'void main() {',
    '  vec2 frag = gl_FragCoord.xy;',
    '  vec2 uv = (frag - 0.5 * uRes) / uRes.y;',
    '  float t = uTime;',

    /* глубина космоса #06040F */
    '  vec3 col = vec3(0.023, 0.016, 0.059);',

    /* туманность: доменно-искажённый fbm, фиолет + тил */
    '  vec2 np = uv * 1.6 + vec2(t * 0.004, 0.0) + uMouse * 0.03;',
    '  float warp = fbm(np + 4.7);',
    '  float q = fbm(np + warp * 0.75);',
    '  col += vec3(0.30, 0.16, 0.55) * smoothstep(0.28, 0.95, q) * 0.30;',
    '  col += vec3(0.05, 0.32, 0.42) * smoothstep(0.55, 1.0, fbm(np * 1.7 + 9.2)) * 0.11;',

    /* млечный путь — диагональная светлая полоса */
    '  float band = exp(-pow((uv.x * 0.55 - uv.y + 0.22) * 2.1, 2.0));',
    '  col += vec3(0.30, 0.27, 0.50) * band * 0.15;',

    /* солнце-цель в правом верхнем углу */
    '  float sun = exp(-length(uv - vec2(0.72, 0.58)) * 3.4);',
    '  col += vec3(0.96, 0.76, 0.30) * sun * 0.20;',

    /* звёзды: 3 слоя с параллаксом и медленным дрейфом */
    '  vec2 drift = vec2(t * 0.0016, 0.0);',
    '  vec2 L1 = starLayer((uv + uMouse * 0.012 + drift * 0.5) * 16.0, 0.14, 0.050, t, 3.1);',
    '  vec2 L2 = starLayer((uv + uMouse * 0.030 + drift * 0.8) * 42.0, 0.30, 0.045, t, 7.7);',
    '  vec3 c1 = mix(vec3(0.92, 0.94, 1.0), vec3(1.0, 0.84, 0.52), step(0.93, L1.y));',
    '  vec3 c2 = mix(vec3(0.88, 0.90, 1.0), vec3(0.55, 0.90, 0.98), step(0.90, L2.y));',
    '  col += c1 * L1.x * 0.95;',
    '  col += c2 * L2.x * 0.75;',
    '  if (uQual > 0.8) {',
    '    vec2 L3 = starLayer((uv + uMouse * 0.055 + drift) * 96.0, 0.38, 0.035, t, 13.3);',
    '    col += vec3(0.85, 0.86, 0.98) * L3.x * 0.5;',
    '  }',

    /* метеоры — только на десктопе */
    '  if (uQual > 0.8) {',
    '    col += vec3(1.0, 0.95, 0.85) * meteor(uv, t, 0.33) * 0.9;',
    '    col += vec3(0.75, 0.90, 1.0) * meteor(uv * 1.25 + vec2(2.0, 1.0), t, 0.71) * 0.55;',
    '  }',

    /* мягкая виньетка + дизеринг против полос */
    '  col *= 1.0 - 0.30 * pow(length(uv) * 0.72, 2.0);',
    '  col += (hash21(frag + fract(t) * 100.0) - 0.5) * 0.008;',

    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('cosmos: shader error', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { document.body.classList.add('no-webgl'); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('cosmos: link error', gl.getProgramInfoLog(prog));
    document.body.classList.add('no-webgl');
    return;
  }
  gl.useProgram(prog);

  /* полноэкранный треугольник */
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes   = gl.getUniformLocation(prog, 'uRes');
  var uTime  = gl.getUniformLocation(prog, 'uTime');
  var uMouse = gl.getUniformLocation(prog, 'uMouse');
  var uQual  = gl.getUniformLocation(prog, 'uQual');

  var quality = isMobile ? 0.6 : 1.0;
  var DPR_CAP = isMobile ? 1.5 : 1.75;
  var resizeTimer = null;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function draw(time, mx, my) {
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform2f(uMouse, mx, my);
    gl.uniform1f(uQual, quality);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  resize();

  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  /* параллакс от мыши с плавным догоном */
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', function (e) {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = 1 - (e.clientY / window.innerHeight) * 2;
  }, { passive: true });

  /* context lost → честный CSS-фолбэк */
  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    document.body.classList.add('no-webgl');
  });

  if (reducedMotion) {
    /* один статичный кадр без анимации */
    draw(12.0, 0, 0);
    return;
  }

  var paused = false;
  document.addEventListener('visibilitychange', function () {
    paused = document.hidden;
  });

  var t0 = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (paused) return;
    mouse.x += (mouse.tx - mouse.x) * 0.045;
    mouse.y += (mouse.ty - mouse.y) * 0.045;
    draw((now - t0) / 1000, mouse.x, mouse.y);
  }
  requestAnimationFrame(frame);
})();
