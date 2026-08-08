/* ===========================================================
   냥밥 — 방 화면 (배경 + 밥그릇 + 길냥이)
   =========================================================== */

const Scene = (function () {
  let cv = null;
  let ctx = null;
  let room = null;
  let roomReady = false;
  let W = 0;
  let H = 0;
  let k = 4;
  let kb = 3;
  let last = 0;
  let running = false;
  let lastFocus = null;

  const visitors = [];
  const hooks = {
    pickBreed: function () { return 'cheese'; },
    canSpawn: function () { return false; },
    onArrive: function () {},
    onEatGrain: function () { return null; },
    onLeave: function () {},
    bowlId: function () { return 'bowl_basic'; },
    bowlGrains: function () { return 0; },
    change: function () {},
  };

  /* 방 안의 기준 좌표 (0~1) */
  const BOWL = { x: 0.455, y: 0.845 };
  const SPOTS = [
    { x: 0.70, y: 0.845 },
    { x: 0.24, y: 0.815 },
    { x: 0.60, y: 0.895 },
  ];

  let spawnTimer = 6;

  function init(el) {
    cv = el;
    ctx = cv.getContext('2d');
    room = new Image();
    room.onload = function () { roomReady = true; draw(0); };
    room.src = 'img/room.png?v=1';
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    if (r.width < 2) return;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(r.width * dpr));
    H = Math.max(1, Math.round(r.height * dpr));
    cv.width = W;
    cv.height = H;
    k = Math.max(2, Math.floor(W / 100));
    kb = Math.max(2, Math.round(k * 0.7));
    ctx.imageSmoothingEnabled = false;
    draw(0);
  }

  /* ---------- 방문객 ---------- */

  function spawn(breed, opts) {
    if (visitors.length >= 2) return null;
    const o = opts || {};
    const fromLeft = Math.random() < 0.5;
    const spot = SPOTS.find(function (s) {
      return !visitors.some(function (v) { return Math.abs(v.tx - s.x) < 0.08; });
    }) || SPOTS[0];

    const cat = {
      breed: breed,
      x: fromLeft ? -0.18 : 1.18,
      y: spot.y,
      tx: spot.x,
      dir: fromLeft ? 1 : -1,
      state: 'enter',
      t: 0,
      frame: 0,
      ate: 0,
      wants: 2 + Math.floor(Math.random() * 2),
      rest: 9 + Math.random() * 8,
      photographed: false,
      gifted: false,
      napping: false,
      alpha: breed === 'ghost' ? 0.72 : 1,
      newbie: !!o.newbie,
    };
    visitors.push(cat);
    hooks.onArrive(cat);
    hooks.change();
    return cat;
  }

  function leaveAll() {
    visitors.forEach(function (v) { if (v.state !== 'leave') startLeave(v); });
  }

  function startLeave(cat) {
    cat.state = 'leave';
    cat.dir = cat.x > 0.5 ? 1 : -1;
    cat.tx = cat.dir > 0 ? 1.25 : -0.25;
  }

  /** 사진 찍을 수 있는 냥이 (밥 먹는 중이거나 쉬는 중) */
  function focusCat() {
    for (let i = 0; i < visitors.length; i++) {
      const v = visitors[i];
      if (v.state === 'eat' || v.state === 'rest') return v;
    }
    return null;
  }

  /* ---------- 업데이트 ---------- */

  function update(dt) {
    // 방문 스케줄
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = 5 + Math.random() * 9;
      if (visitors.length < 2 && hooks.canSpawn()) {
        const breed = hooks.pickBreed();
        if (breed) spawn(breed);
      }
    }

    for (let i = visitors.length - 1; i >= 0; i--) {
      const c = visitors[i];
      c.t += dt;
      const speed = 0.11;

      if (c.state === 'enter') {
        const d = c.tx - c.x;
        c.dir = d > 0 ? 1 : -1;
        c.x += Math.sign(d) * Math.min(Math.abs(d), speed * dt);
        c.frame = Math.floor(c.t * 6) % 2;
        if (Math.abs(c.tx - c.x) < 0.005) {
          c.x = c.tx;
          c.state = hooks.bowlGrains() > 0 ? 'eat' : 'rest';
          c.dir = c.x > BOWL.x ? -1 : 1;
          c.t = 0;
          c.bite = 0;
        }
      } else if (c.state === 'eat') {
        c.frame = Math.floor(c.t * 3) % 2;
        c.bite = (c.bite || 0) + dt;
        if (c.bite >= 3.4) {
          c.bite = 0;
          const g = hooks.onEatGrain(c);
          if (g) {
            c.ate++;
            if (g.special) c.special = true;
          }
          if (!g || c.ate >= c.wants) {
            c.state = 'rest';
            c.t = 0;
          }
        }
      } else if (c.state === 'rest') {
        c.frame = 0;
        if (!c.napping && c.t > 4 && Math.random() < dt * 0.12) c.napping = true;
        if (c.t >= c.rest) {
          startLeave(c);
          c.t = 0;
        }
      } else if (c.state === 'leave') {
        c.frame = Math.floor(c.t * 6) % 2;
        c.x += c.dir * speed * dt;
        if (c.x < -0.24 || c.x > 1.24) {
          visitors.splice(i, 1);
          hooks.onLeave(c);
          hooks.change();
        }
      }
    }
  }

  /* ---------- 그리기 ---------- */

  function drawBowl() {
    const sp = bowlSprite(hooks.bowlId());
    const w = sp.w * kb;
    const h = sp.h * kb;
    const x = Math.round(BOWL.x * W - w / 2);
    const y = Math.round(BOWL.y * H - h);
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#5a4a36';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - kb, w * 0.42, kb * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.drawImage(sp.canvas, x, y, w, h);

    const grains = hooks.bowlGrains();
    const special = hooks.bowlSpecial ? hooks.bowlSpecial() : 0;
    const n = Math.min(KIBBLE_SPOTS.length, grains);
    for (let i = 0; i < n; i++) {
      const s = KIBBLE_SPOTS[i];
      const spr = i < special ? KIBBLE_SPECIAL : KIBBLE;
      ctx.drawImage(spr.canvas, x + s[0] * kb, y + s[1] * kb, spr.w * kb, spr.h * kb);
    }
  }

  function drawCat(c) {
    const set = catSprites(c.breed);
    let sp;
    if (c.state === 'enter' || c.state === 'leave') sp = c.frame ? set.walkB : set.walkA;
    else if (c.state === 'eat') sp = c.frame ? set.eatB : set.eatA;
    else if (c.napping) sp = set.loaf;
    else sp = set.sit;

    const w = sp.w * k;
    const h = sp.h * k;
    const cx = c.x * W;
    const by = c.y * H;
    const x = Math.round(cx - w / 2);
    const y = Math.round(by - h);

    ctx.save();
    ctx.globalAlpha = 0.14 * c.alpha;
    ctx.fillStyle = '#5a4a36';
    ctx.beginPath();
    ctx.ellipse(cx, by - k * 0.5, w * 0.34, k * 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = c.alpha;
    if (c.dir < 0) {
      ctx.translate(Math.round(cx * 2), 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(sp.canvas, x, y, w, h);
    ctx.restore();

    if (c.heart > 0) {
      const t = 1 - c.heart / 1.4;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.fillStyle = '#a9714a';
      const hx = Math.round(cx + w * 0.22);
      const hy = Math.round(y - k * 2 - t * k * 8);
      ctx.fillRect(hx, hy + k, k * 2, k * 2);
      ctx.fillRect(hx + k * 3, hy + k, k * 2, k * 2);
      ctx.fillRect(hx, hy + k * 2, k * 5, k * 2);
      ctx.fillRect(hx + k, hy + k * 4, k * 3, k);
      ctx.fillRect(hx + k * 2, hy + k * 5, k, k);
      ctx.restore();
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#f4eee3';
    ctx.fillRect(0, 0, W, H);
    if (roomReady) {
      const ir = room.width / room.height;
      const cr = W / H;
      let dw = W;
      let dh = H;
      if (ir > cr) dw = Math.ceil(H * ir);
      else dh = Math.ceil(W / ir);
      ctx.drawImage(room, Math.round((W - dw) / 2), Math.round((H - dh) / 2), dw, dh);
    }

    const order = visitors.slice().sort(function (a, b) { return a.y - b.y; });
    const back = order.filter(function (c) { return c.y <= BOWL.y; });
    const front = order.filter(function (c) { return c.y > BOWL.y; });
    back.forEach(drawCat);
    drawBowl();
    front.forEach(drawCat);
  }

  function loop(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    update(dt);
    visitors.forEach(function (c) { if (c.heart > 0) c.heart -= dt; });
    const f = focusCat();
    if (f !== lastFocus) {
      lastFocus = f;
      hooks.change();
    }
    draw();
    requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  /* ---------- 사진 ---------- */

  function capture(cat) {
    const out = document.createElement('canvas');
    out.width = 300;
    out.height = 200;
    const c = out.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#f4eee3';
    c.fillRect(0, 0, out.width, out.height);

    const cropW = Math.min(W, W * 0.68);
    const cropH = cropW * (out.height / out.width);
    let sx = (cat ? cat.x * W : 0.5 * W) - cropW / 2;
    let sy = (cat ? cat.y * H : 0.8 * H) - cropH * 0.74;
    sx = Math.max(0, Math.min(W - cropW, sx));
    sy = Math.max(0, Math.min(Math.max(0, H - cropH), sy));
    c.drawImage(cv, sx, sy, cropW, cropH, 0, 0, out.width, out.height);

    let url = '';
    try { url = out.toDataURL('image/webp', 0.72); } catch (e) { url = ''; }
    if (url.indexOf('data:image/webp') !== 0) url = out.toDataURL('image/jpeg', 0.72);
    return url;
  }

  function pop(cat) {
    if (cat) cat.heart = 1.4;
  }

  return {
    init: init,
    resize: resize,
    start: start,
    draw: draw,
    hooks: hooks,
    visitors: visitors,
    spawn: spawn,
    leaveAll: leaveAll,
    focusCat: focusCat,
    capture: capture,
    pop: pop,
    bowlPos: BOWL,
  };
})();
