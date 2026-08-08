/* ===========================================================
   바탕화면 오버레이 — 밥그릇 + 길냥이
   화면 전체가 투명 캔버스. 마우스가 밥그릇/냥이 위에 있을 때만
   클릭을 받고, 나머지 영역은 뒤 창으로 클릭이 통과된다.
   =========================================================== */

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');

let W = 0, H = 0, DPR = 1;
let st = null;                 /* 메인 프로세스 상태 */
let k = 4;                     /* 픽셀 배율 */
let interactive = false;

const BREEDS = ['cheese','mackerel','calico','tuxedo','white','black',
                'smoke','siam','fluff','golden','ghost','king','berry'];

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = Math.round(window.innerWidth * DPR);
  H = Math.round(window.innerHeight * DPR);
  cv.width = W;
  cv.height = H;
  ctx.imageSmoothingEnabled = false;
  k = Math.max(2, Math.round(W / 840));
}
window.addEventListener('resize', resize);
resize();

/* ---------- 밥그릇 ---------- */

const bowl = { x: 0.5, y: 0.8, drag: false, dx: 0, dy: 0, moved: false };

function bowlBox() {
  const sp = bowlSprite('bowl_basic');
  const kb = Math.max(2, Math.round(k * 0.8));
  const w = sp.w * kb, h = sp.h * kb;
  return { sp: sp, kb: kb, w: w, h: h,
           x: Math.round(bowl.x * W - w / 2), y: Math.round(bowl.y * H - h) };
}

function drawBowl() {
  const b = bowlBox();
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#3a2f22';
  ctx.beginPath();
  ctx.ellipse(b.x + b.w / 2, b.y + b.h - b.kb, b.w * 0.44, b.kb * 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.drawImage(b.sp.canvas, b.x, b.y, b.w, b.h);

  const n = Math.min(KIBBLE_SPOTS.length, (st && st.food) ? st.food.n : 0);
  for (let i = 0; i < n; i++) {
    const s = KIBBLE_SPOTS[i];
    ctx.drawImage(KIBBLE.canvas, b.x + s[0] * b.kb, b.y + s[1] * b.kb,
                  KIBBLE.w * b.kb, KIBBLE.h * b.kb);
  }
}

/* ---------- 방문객 ---------- */

const visitors = [];
let spawnTimer = 6;

function spawn(breed) {
  if (visitors.length >= 3) return null;
  const left = Math.random() < 0.5;
  const side = Math.random() < 0.5 ? 1 : -1;
  const c = {
    breed: breed,
    x: left ? -0.12 : 1.12,
    y: bowl.y + (Math.random() - 0.5) * 0.03,
    tx: bowl.x + side * 0.055,
    dir: left ? 1 : -1,
    state: 'enter', t: 0, trav: 0,
    ate: 0, wants: 2 + Math.floor(Math.random() * 2),
    rest: 55 + Math.random() * 70,             /* 한 번 오면 오래 머문다 */
    act: null, actT: 0, jump: 0,
    napping: false, waiting: false,
    alpha: breed === 'ghost' ? 0.75 : 1,
  };
  visitors.push(c);
  play('meow');
  if (window.desk) window.desk.metCat(breed);
  return c;
}

function update(dt) {
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnTimer = 28 + Math.random() * 50;      /* 자주 오가지 않게 */
    if (st && st.food && st.food.n > 0 && visitors.length < 3) {
      spawn(BREEDS[Math.floor(Math.random() * BREEDS.length)]);
    }
  }

  const grains = (st && st.food) ? st.food.n : 0;

  for (let i = visitors.length - 1; i >= 0; i--) {
    const c = visitors[i];
    c.t += dt;
    if (c.jump > 0) c.jump = Math.max(0, c.jump - dt);
    /* 밥이 없으면 느긋하게 걷는다 */
    const speed = grains > 0 ? 0.06 : 0.028;

    if (c.state === 'enter') {
      /* 밥그릇이 움직이면 목표도 따라간다 */
      const side = c.tx > bowl.x ? 1 : -1;
      c.tx = bowl.x + side * 0.055;
      c.y += (bowl.y - c.y) * Math.min(1, dt * 1.5);
      const d = c.tx - c.x;
      c.dir = d > 0 ? 1 : -1;
      const step = Math.sign(d) * Math.min(Math.abs(d), speed * dt);
      c.x += step;
      c.trav += Math.abs(step);
      if (Math.abs(d) < 0.004) {
        c.x = c.tx;
        c.state = grains > 0 ? 'eat' : 'rest';
        c.dir = c.x > bowl.x ? -1 : 1;
        c.waiting = c.state === 'rest';
        c.t = 0; c.bite = 0;
        if (!c.waiting) play('meow');
      }
    } else if (c.state === 'eat') {
      /* 밥그릇을 옮기면 따라간다 */
      const side = c.x > bowl.x ? 1 : -1;
      const want = bowl.x + side * 0.055;
      if (Math.abs(want - c.x) > 0.01) { c.state = 'enter'; c.t = 0; continue; }
      c.y += (bowl.y - c.y) * Math.min(1, dt * 2);
      c.bite = (c.bite || 0) + dt;
      if (c.bite >= 3.0) {
        c.bite = 0;
        if (grains > 0) {
          if (window.desk) window.desk.eatOne();
          play('drop');
          c.ate++;
        }
        if (grains <= 0 || c.ate >= c.wants) { c.state = 'rest'; c.waiting = grains <= 0; c.t = 0; }
      }
    } else if (c.state === 'rest') {
      if (Math.abs(bowl.x - c.x) > 0.14 || Math.abs(bowl.y - c.y) > 0.08) {
        c.state = 'enter'; c.t = 0; c.napping = false; c.waiting = false; continue;
      }
      if (c.actT > 0) {
        c.actT -= dt;
        if (c.actT <= 0) c.act = null;
      }
      if (c.waiting) {
        /* 밥 기다리며 졸기: 잠깐 앉아 있다가 스르르 */
        if (!c.napping && c.t > 3) c.napping = true;
        if (grains > 0) {
          c.waiting = false;
          c.napping = false;
          c.jump = 0.52;                 /* 깜짝 놀라 벌떡 */
          play('meow');
          c.state = 'eat'; c.t = 0; c.bite = 0;
        }
        c.rest = 9999;                   /* 기다리는 동안엔 안 떠난다 */
      } else {
        if (!c.napping && !c.actT && c.t > 5 && Math.random() < dt * 0.10) c.napping = true;
        if (!c.napping && !c.actT && Math.random() < dt * 0.08) { c.act = 'groom'; c.actT = 3.2; }
      }
      if (c.t >= c.rest) { startLeave(c); c.t = 0; }
    } else if (c.state === 'leave') {
      c.x += c.dir * speed * dt;
      c.trav += speed * dt;
      if (c.x < -0.2 || c.x > 1.2) visitors.splice(i, 1);
    }
  }
}

function startLeave(c) {
  play('bye');
  c.state = 'leave';
  c.napping = false; c.act = null; c.actT = 0; c.waiting = false;
  c.dir = c.x > 0.5 ? 1 : -1;
}

/* ---------- 밥그릇 옆 알림 ---------- */

const notice = { text: '', t: 0 };
function showNotice(text) {
  if (!text) return;
  notice.text = String(text);
  notice.t = 3.2;
}

function drawNotice(dt) {
  if (notice.t <= 0) return;
  notice.t -= dt;
  const b = bowlBox();
  const fade = Math.min(1, notice.t / 0.5);
  const fs = Math.max(11, Math.round(k * 3.4));
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  ctx.font = '500 ' + fs + 'px -apple-system, "Apple SD Gothic Neo", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const pad = fs * 0.7;
  const tw = ctx.measureText(notice.text).width;
  const bw = tw + pad * 2;
  const bh = fs * 2.1;
  const bx = b.x + b.w / 2 - bw / 2;
  const by = b.y - bh - k * 3;
  ctx.fillStyle = 'rgba(58, 47, 34, 0.88)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, bh / 2);
    ctx.fill();
  } else {
    ctx.fillRect(bx, by, bw, bh);
  }
  ctx.fillStyle = '#f7f2e6';
  ctx.fillText(notice.text, bx + bw / 2, by + bh / 2 + 1);
  ctx.restore();
}

/* ---------- 그리기 ---------- */

function catBox(c) {
  const set = catSprites(c.breed);
  const s = (k * 26 * (set.sizeMul || 1)) / set.stand.w;
  const w = set.stand.w * s, h = set.stand.h * s;
  return { w: w, h: h, x: c.x * W - w / 2, y: c.y * H - h };
}

function drawCat(c) {
  const set = catSprites(c.breed);
  const walking = c.state === 'enter' || c.state === 'leave';
  const eating = c.state === 'eat';
  const napping = c.napping && !walking && !eating && set.hasLoaf;

  let sp = napping ? set.loaf : set.stand;
  let face = -1;
  const s = (k * 26 * (set.sizeMul || 1)) / set.stand.w;
  let scale = s, bob = 0, rot = 0, sqx = 1, sqy = 1;

  if (walking && set.walk) {
    const fr = set.walk.frames;
    sp = fr[Math.floor((c.trav * W) / (k * 4)) % fr.length];
    face = set.walk.face;
  } else if (walking) {
    const ph = ((c.trav * W) / (k * 6)) * Math.PI;
    bob = -Math.abs(Math.sin(ph)) * k * 1.4;
  } else if (eating && set.eat) {
    const fr = set.eat.frames;
    sp = fr[Math.floor(c.t * 3) % fr.length];
    face = set.eat.face;
  } else if (c.act && c.actT > 0 && set[c.act]) {
    const fr = set[c.act].frames;
    sp = fr[Math.floor(c.t * 0.7) % fr.length];
    face = set[c.act].face;
  } else if (napping && set.sleep) {
    sp = set.sleep.frames[0];
    face = set.sleep.face;
    bob = Math.sin(c.t * 1.6) * k * 0.5;          /* 숨쉬듯 꾸벅 */
    sqy = 1 + Math.sin(c.t * 1.6) * 0.012;
  } else if (napping) {
    bob = Math.sin(c.t * 1.6) * k * 0.4;
    sqy = 1 + Math.sin(c.t * 1.6) * 0.012;
  }

  if (c.jump > 0) {
    const u = 1 - c.jump / 0.52;
    const air = Math.sin(Math.PI * u);
    bob -= air * k * 6;
    const land = Math.max(0, 1 - Math.abs(u - 1) * 7);
    sqx *= 1 + land * 0.10 - air * 0.04;
    sqy *= 1 - land * 0.12 + air * 0.05;
  }

  const w = sp.w * scale, h = sp.h * scale;
  const cx = c.x * W, by = c.y * H;

  ctx.save();
  ctx.globalAlpha = 0.16 * c.alpha;
  ctx.fillStyle = '#3a2f22';
  ctx.beginPath();
  ctx.ellipse(cx, by - k * 0.4, w * 0.34, k * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = c.alpha;
  ctx.imageSmoothingEnabled = true;
  ctx.translate(cx, by + bob);
  if (c.dir !== face) ctx.scale(-1, 1);
  if (rot) ctx.rotate(rot);
  if (sqx !== 1 || sqy !== 1) ctx.scale(sqx, sqy);
  ctx.drawImage(sp.canvas, -w / 2, -h, w, h);
  ctx.restore();
  ctx.imageSmoothingEnabled = false;

  if (napping) {
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(c.t * 2);
    ctx.fillStyle = '#6b5f4e';
    const zx = Math.round(cx + w * 0.30);
    const zy = Math.round(by - h - k * 1.5 + Math.sin(c.t * 1.2) * k);
    ctx.fillRect(zx, zy, k * 3, k);                 /* z 위 */
    ctx.fillRect(zx + k, zy + k, k, k);
    ctx.fillRect(zx, zy + k * 2, k * 3, k);         /* z 아래 */
    const z2 = k * 0.6;
    ctx.fillRect(zx + k * 4, zy - k * 3, z2 * 3, z2);
    ctx.fillRect(zx + k * 4 + z2, zy - k * 3 + z2, z2, z2);
    ctx.fillRect(zx + k * 4, zy - k * 3 + z2 * 2, z2 * 3, z2);
    ctx.restore();
  }

  if (c.heart > 0) {
    c.heart -= 1 / 60;
    const t = 1 - c.heart / 1.4;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.fillStyle = '#c9614a';
    const hx = Math.round(cx + w * 0.2), hy = Math.round(by - h - k * 2 - t * k * 8);
    ctx.fillRect(hx, hy + k, k * 2, k * 2);
    ctx.fillRect(hx + k * 3, hy + k, k * 2, k * 2);
    ctx.fillRect(hx, hy + k * 2, k * 5, k * 2);
    ctx.fillRect(hx + k, hy + k * 4, k * 3, k);
    ctx.fillRect(hx + k * 2, hy + k * 5, k, k);
    ctx.restore();
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  const order = visitors.slice().sort(function (a, b) { return a.y - b.y; });
  order.filter(function (c) { return c.y <= bowl.y; }).forEach(drawCat);
  drawBowl();
  order.filter(function (c) { return c.y > bowl.y; }).forEach(drawCat);
  drawNotice(lastDt);
}

let lastDt = 0;

let last = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  lastDt = dt;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------- 마우스: 밥그릇/냥이 위에서만 클릭을 받는다 ---------- */

function hitBowl(px, py) {
  const b = bowlBox();
  return px >= b.x - 6 && px <= b.x + b.w + 6 && py >= b.y - 6 && py <= b.y + b.h + 6;
}

function hitCat(px, py) {
  let best = null;
  for (let i = 0; i < visitors.length; i++) {
    const c = visitors[i];
    const bx = catBox(c);
    if (px >= bx.x && px <= bx.x + bx.w && py >= bx.y && py <= bx.y + bx.h) {
      if (!best || c.y > best.y) best = c;
    }
  }
  return best;
}

function setInteractive(on) {
  if (on === interactive) return;
  interactive = on;
  document.body.style.cursor = on ? 'pointer' : 'default';
  if (window.desk) window.desk.setInteractive(on);
}

window.addEventListener('mousemove', function (e) {
  const px = e.clientX * DPR, py = e.clientY * DPR;
  if (bowl.drag) {
    bowl.x = Math.min(0.98, Math.max(0.02, (px - bowl.dx) / W));
    bowl.y = Math.min(0.99, Math.max(0.06, (py - bowl.dy) / H));
    bowl.moved = true;
    return;
  }
  setInteractive(hitBowl(px, py) || !!hitCat(px, py));
});

window.addEventListener('mousedown', function (e) {
  if (e.button !== 0) return;                 /* 좌클릭만 드래그 */
  const px = e.clientX * DPR, py = e.clientY * DPR;
  if (hitBowl(px, py)) {
    const b = bowlBox();
    bowl.drag = true;
    bowl.moved = false;
    bowl.dx = px - (b.x + b.w / 2);
    bowl.dy = py - (b.y + b.h);
  }
});

window.addEventListener('mouseup', function () {
  if (bowl.drag) {
    bowl.drag = false;
    if (bowl.moved && window.desk) window.desk.moveBowl({ x: bowl.x, y: bowl.y });
  }
});

let clickTimer = null;
window.addEventListener('click', function (e) {
  const px = e.clientX * DPR, py = e.clientY * DPR;
  if (hitBowl(px, py)) {
    if (bowl.moved) { bowl.moved = false; return; }   /* 드래그 끝은 클릭 아님 */
    if (clickTimer) return;                            /* 더블클릭 대기 중 */
    clickTimer = setTimeout(function () {
      clickTimer = null;
      if (window.desk) window.desk.feed(st && st.feedMode === 'one' ? 'one' : 'full');
    }, 230);
    return;
  }
  const c = hitCat(px, py);
  if (c) {
    c.napping = false;
    c.jump = 0.52;
    c.heart = 1.4;
    c.act = set_has(c, 'meow') ? 'meow' : c.act;
    c.actT = 1.2;
    play('meow');
  }
});

function set_has(c, kind) {
  const s = catSprites(c.breed);
  return !!s[kind];
}

function cancelDrag() {
  if (!bowl.drag) return;
  bowl.drag = false;
  bowl.moved = false;
  if (window.desk) window.desk.moveBowl({ x: bowl.x, y: bowl.y });
}

window.addEventListener('contextmenu', function (e) {
  const px = e.clientX * DPR, py = e.clientY * DPR;
  cancelDrag();
  if (!hitBowl(px, py)) return;
  e.preventDefault();
  if (window.desk) window.desk.bowlMenu();
});

/* 창이 포커스를 잃거나 마우스가 나가면 드래그를 놓는다 */
window.addEventListener('blur', cancelDrag);
window.addEventListener('mouseleave', cancelDrag);

window.addEventListener('dblclick', function (e) {
  const px = e.clientX * DPR, py = e.clientY * DPR;
  if (!hitBowl(px, py)) return;
  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
  if (window.desk) window.desk.openMemo();
});

/* ---------- 상태 동기화 ---------- */

function applyState(s) {
  const first = !st;
  const prevFood = (st && st.food) ? st.food.n : 0;
  st = s;
  if (s.bowl && !bowl.drag) { bowl.x = s.bowl.x; bowl.y = s.bowl.y; }
  if (typeof Sound !== 'undefined') Sound.setEnabled(s.sound !== false);
  if (!first && s.food && s.food.n > prevFood) play('drop');
}

/* 사운드: 상태가 켜져 있을 때만 */
function play(name) {
  if (typeof Sound === 'undefined') return;
  if (st && st.sound === false) return;
  try { Sound.unlock(); Sound.play(name); } catch (e) { /* 무시 */ }
}
if (window.desk) {
  window.desk.onNotice(showNotice);
  window.desk.onSummon(function () {
    spawn(BREEDS[Math.floor(Math.random() * BREEDS.length)]);
  });
  window.desk.onState(applyState);
  window.desk.getState().then(applyState);
}
