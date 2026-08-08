/* ===========================================================
   냥밥 — 방 화면 (배경 + 밥그릇 + 길냥이)
   =========================================================== */

const Scene = (function () {
  let cv = null;
  let ctx = null;
  let W = 0;
  let H = 0;
  let k = 4;
  let kb = 3;
  let kc = 2;   /* 고양이 전용 배율 (고해상 스프라이트 보정) */
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
  const BOWL = { x: 0.455, y: 0.88 };
  const SPOTS = [
    { x: 0.70, y: 0.88 },
    { x: 0.24, y: 0.86 },
    { x: 0.60, y: 0.91 },
  ];

  let spawnTimer = 6;

  function init(el) {
    cv = el;
    ctx = cv.getContext('2d');
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
    kc = Math.max(1, Math.round(k * 0.55));
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
      alpha: 1,
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
    cat.napping = false;   /* 자던 냥이도 일어나서 걸어 나간다 */
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
      if (c.jump > 0) c.jump = Math.max(0, c.jump - dt);
      const speed = 0.11;

      if (c.state === 'enter') {
        const d = c.tx - c.x;
        c.dir = d > 0 ? 1 : -1;
        const step = Math.sign(d) * Math.min(Math.abs(d), speed * dt);
        c.x += step;
        c.trav = (c.trav || 0) + Math.abs(step);
        c.frame = Math.floor(c.t * 6) % 2;
        if (Math.abs(c.tx - c.x) < 0.005) {
          c.x = c.tx;
          c.state = hooks.bowlGrains() > 0 ? 'eat' : 'rest';
          c.dir = c.x > BOWL.x ? -1 : 1;
          if (c.state === 'rest') {
            /* 밥이 없으면 밥그릇 옆에 앉아서 기다린다 */
            let side = c.x > BOWL.x ? 1 : -1;
            const near = visitors.some(function (v) {
              return v !== c && Math.abs(v.x - (BOWL.x + side * 0.135)) < 0.06;
            });
            if (near) side = -side;
            c.x = BOWL.x + side * 0.135;
            c.tx = c.x;
            c.dir = -side;
            c.waiting = true;
          }
          if (c.state === 'eat') {
            /* 밥그릇 옆에 서서 입이 그릇 위로 오게. 자리가 차 있으면 반대편 */
            let side = c.x > BOWL.x ? 1 : -1;
            const taken = visitors.some(function (v) {
              return v !== c && v.state === 'eat' && Math.abs(v.x - (BOWL.x + side * 0.115)) < 0.05;
            });
            if (taken) side = -side;
            c.x = BOWL.x + side * 0.115;
            c.dir = -side;
          }
          c.t = 0;
          c.bite = 0;
          if (c.state === 'rest') { c.act = 'meow'; c.actT = 1.3; }   /* 도착 인사 */
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
        if (c.actT > 0) {
          c.actT -= dt;
          if (c.actT <= 0) c.act = null;
        } else if (!c.napping) {
          /* 심심하면 가끔 그루밍 */
          c.idle = (c.idle || 0) + dt;
          if (c.idle > 4 && Math.random() < dt * 0.14) {
            c.act = 'groom';
            c.actT = 2.8;
            c.actSeed = Math.floor(Math.random() * 3);
            c.idle = 0;
          }
        }
        if (c.waiting) {
          if (hooks.bowlGrains() > 0) {           /* 밥이 생기면 바로 먹는다 */
            c.waiting = false;
            c.napping = false;
            c.state = 'eat';
            c.t = 0;
            c.bite = 0;
            const side = c.x > BOWL.x ? 1 : -1;
            c.x = BOWL.x + side * 0.115;
            c.dir = -side;
          }
        } else if (!c.napping && !c.actT && c.t > 4 && Math.random() < dt * 0.12) {
          c.napping = true;
        }
        if (c.t >= c.rest) {
          startLeave(c);
          c.act = null;
          c.actT = 0;
          c.t = 0;
        }
      } else if (c.state === 'leave') {
        c.frame = Math.floor(c.t * 6) % 2;
        c.x += c.dir * speed * dt;
        c.trav = (c.trav || 0) + speed * dt;
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
    const walking = c.state === 'enter' || c.state === 'leave';
    const eating = c.state === 'eat';

    /* 스프라이트 선택 + 스프라이트가 바라보는 방향 (기본: 왼쪽) */
    const napping = c.napping && !walking && !eating && set.hasLoaf;
    let sp = napping ? set.loaf : set.stand;
    let face = -1;

    /* 품종별 기준 폭: stand 기준. sameScale 세트는 포즈별 보정 불필요 */
    const s = k * 0.204 * (set.sizeMul || 1);   /* 몸집(면적) 기준으로 통일 */
    const same = set.sameScale;
    let scale = s;

    /* 퍼펫 애니메이션 */
    let bob = 0;
    let rot = 0;
    let sqx = 1;
    let sqy = 1;
    if (walking) {
      if (set.walk) {
        /* 시트 걷기 프레임 — 발걸음을 이동 거리에 동기화 (미끄러짐 방지) */
        const fr = set.walk.frames;
        const idx = Math.floor(((c.trav || 0) * W) / (k * 4)) % fr.length;
        sp = fr[idx];
        face = set.walk.face;
        if (!same) scale = s * (set.stand.h / sp.h);   /* 스탠드와 같은 키로 */
      } else {
        /* 프레임 없는 품종: 통통 뛰는 호핑 — 몸 전체 스쿼시라 안 찢어진다 */
        const ph = (((c.trav || 0) * W) / (k * 6)) * Math.PI;
        const hop = Math.abs(Math.sin(ph));
        bob = -hop * k * 1.6;
        rot = Math.sin(ph) * 0.04;
        sqx = 1 + (1 - hop) * 0.045;               /* 착지 때 살짝 퍼짐 */
        sqy = 1 - (1 - hop) * 0.06;
      }
    } else if (eating) {
      if (set.eat) {
        /* 시트 밥먹기 루프 (그릇은 지워져 있고, 실제 밥그릇 위에서 먹는다) */
        const fr = set.eat.frames;
        sp = fr[Math.floor(c.t * 3) % fr.length];
        face = set.eat.face;
        if (!same) scale = s * (set.stand.w / sp.w) * 0.92;   /* 몸길이 기준 정규화 */
      } else {
        rot = c.frame ? -0.10 : -0.05;
        bob = c.frame ? k * 0.3 : 0;
      }
    } else if (c.act && c.actT > 0 && set[c.act]) {
      /* 휴식 중 동작: 그루밍은 느긋하게, 야옹/놀기는 경쾌하게 */
      const fps = c.act === 'groom' ? 0.7 : 2.5;
      const fr = set[c.act].frames;
      sp = fr[((c.actSeed || 0) + Math.floor(c.t * fps)) % fr.length];
      face = set[c.act].face;
    } else if (napping) {
      if (set.sleep) sp = set.sleep.frames[0];     /* 웅크려 자기 */
      else if (!same) scale = s * ((set.stand.w * 0.82) / sp.w);
    }

    /* 점프: 포물선으로 떴다가 착지하며 살짝 눌린다 */
    if (c.jump > 0) {
      const JD = 0.52;
      const u = 1 - c.jump / JD;                    /* 0 → 1 */
      const air = Math.sin(Math.PI * u);            /* 0 → 1 → 0 */
      bob -= air * k * 7;
      rot += Math.sin(Math.PI * 2 * u) * 0.05;
      const land = Math.max(0, 1 - Math.abs(u - 1) * 7);   /* 착지 순간만 */
      sqx *= 1 + land * 0.10 - air * 0.04;
      sqy *= 1 - land * 0.12 + air * 0.05;
    }

    const w = sp.w * scale;
    const h = sp.h * scale;
    const cx = c.x * W;
    const by = c.y * H;

    ctx.save();
    ctx.globalAlpha = 0.14 * c.alpha;
    ctx.fillStyle = '#5a4a36';
    ctx.beginPath();
    ctx.ellipse(cx, by - k * 0.5, w * 0.36, k * 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.translate(cx, by + bob);
    if (c.dir !== face) ctx.scale(-1, 1);   /* 진행 방향과 스프라이트 방향이 다르면 반전 */
    if (rot) ctx.rotate(rot);
    if (sqx !== 1 || sqy !== 1) ctx.scale(sqx, sqy);   /* 착지 스쿼시 (바닥 기준) */
    ctx.drawImage(sp.canvas, -w / 2, -h, w, h);
    ctx.restore();
    ctx.imageSmoothingEnabled = false;

    if (c.heart > 0) {
      const t = 1 - c.heart / 1.4;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.fillStyle = '#a9714a';
      const hx = Math.round(cx + w * 0.22);
      const hy = Math.round(by - h - k * 2 - t * k * 8);
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
    ctx.clearRect(0, 0, W, H);

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

  /** 클릭 좌표에 있는 고양이 찾기 (앞에 있는 냥이 우선) */
  function hit(evt) {
    if (!cv) return null;
    const r = cv.getBoundingClientRect();
    const px = (evt.clientX - r.left) / r.width;
    const py = (evt.clientY - r.top) / r.height;
    let best = null;
    for (let i = 0; i < visitors.length; i++) {
      const c = visitors[i];
      const set = catSprites(c.breed);
      const w = (set.stand.w * ((k * 30) / set.stand.w)) / W;   /* = k*30/W */
      const h = (set.stand.h * ((k * 30) / set.stand.w)) / H;
      if (px >= c.x - w * 0.6 && px <= c.x + w * 0.6 && py >= c.y - h * 1.05 && py <= c.y + h * 0.08) {
        if (!best || c.y > best.y) best = c;
      }
    }
    return best;
  }

  /** 밥그릇을 눌렀는지 */
  function hitBowl(evt) {
    if (!cv) return false;
    const r = cv.getBoundingClientRect();
    const px = (evt.clientX - r.left) / r.width;
    const py = (evt.clientY - r.top) / r.height;
    const sp = bowlSprite(hooks.bowlId());
    const w = (sp.w * kb) / W;
    const h = (sp.h * kb) / H;
    return px >= BOWL.x - w * 0.8 && px <= BOWL.x + w * 0.8 &&
           py >= BOWL.y - h * 1.5 && py <= BOWL.y + h * 0.4;
  }

  /** 제자리 점프 (클릭 반응) */
  function jump(cat) {
    if (!cat || cat.jump > 0) return false;
    cat.jump = 0.52;
    return true;
  }

  /** 휴식 중 동작 재생 (선물 받으면 놀기 등) */
  function act(cat, kind, dur) {
    if (!cat) return;
    cat.act = kind;
    cat.actT = dur || 2.5;
    cat.actSeed = Math.floor(Math.random() * 3);   /* 매번 다른 프레임부터 */
  }

  return {
    init: init,
    act: act,
    hit: hit,
    hitBowl: hitBowl,
    jump: jump,
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
