/* ===========================================================
   상사 피하기 (OFFICE ESCAPE) - 픽셀 스텔스 게임
   =========================================================== */
(function () {
  'use strict';

  /* ---------------- 상수 ---------------- */
  const TILE = 16;
  const COLS = 20;
  const ROWS = 14;
  const HUD_H = 24;
  const VW = COLS * TILE;   // 320
  const VH = ROWS * TILE;   // 224
  const CW = VW;
  const CH = VH + HUD_H;    // 240

  const SOLID = '#DTASRpfcxwgv';
  const HIDEABLE = 'DTASRpfcxwgv';
  const WIDE = 'DTASR';

  const cv = document.getElementById('game');
  let K = 2;                 // backing store 배율 (정수)
  let SCALE = 2;             // 논리 1px 이 화면에서 차지하는 px
  cv.width = CW * K;
  cv.height = CH * K;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(K, 0, 0, K, 0, 0);

  function T(str, x, y, color, size, scale, align) {
    return Txt.draw(ctx, str, x, y, color, size, scale, align);
  }
  function TW(str, size) { return Txt.width(str, size); }

  /* ---------------- 입력 ---------------- */
  const keys = Object.create(null);
  const pressed = Object.create(null);

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ShiftLeft: 'dash', ShiftRight: 'dash',
    Space: 'hide',
    Enter: 'confirm', NumpadEnter: 'confirm',
    KeyP: 'pause', Escape: 'pause',
    KeyM: 'mute',
  };

  window.addEventListener('keydown', function (e) {
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    if (!keys[k]) pressed[k] = true;
    keys[k] = true;
    Sfx.init(); Sfx.resume();
  });
  window.addEventListener('keyup', function (e) {
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    keys[k] = false;
  });
  window.addEventListener('blur', function () { for (const k in keys) keys[k] = false; });

  function consume(k) { if (pressed[k]) { pressed[k] = false; return true; } return false; }
  function anyPressed() { return pressed.confirm || pressed.hide || pressed.dash; }
  function clearPressed() { for (const k in pressed) pressed[k] = false; }

  /* ---------------- 스프라이트 ---------------- */
  const SPR = {
    player: buildChar(LOOK_PLAYER),
    playerHide: buildCrouch(LOOK_PLAYER.pal),
    mate: buildChar(LOOK_MATE),
    boss: BOSS_TYPES.map(function (b) { return buildChar(b.look); }),
  };

  // 위장 스프라이트 조회 (desk 는 웅크리기 재사용)
  function dgSprite(def) {
    return def.spr === 'desk' ? SPR.playerHide : SPR_DG[def.spr];
  }

  /* ---------------- 상태 ---------------- */
  const G = {
    state: 'title',
    floorIdx: 0, cycle: 1,
    score: 0, lives: 3, best: 0,
    map: null, floor: null, style: null,
    docs: [], coffees: [], quota: 0, collected: 0,
    bosses: [], mate: null, particles: [], player: null,
    exitTiles: [], exitOpen: false,
    timer: 0, anim: 0, shake: 0, flash: 0, flashCol: '#b13e53',
    msg: '', msgTimer: 0, stateTimer: 0,
    boostTimer: 0, alertLevel: 0,
    betrayedOnce: false, catchLine: '', catchName: '',
    lastBonus: 0, rumor: '', totalTime: 0, dgWins: 0, pickSpot: null,
    nick: '',
  };

  try { G.best = parseInt(localStorage.getItem('boss_escape_best') || '0', 10) || 0; } catch (e) { G.best = 0; }
  try { G.nick = localStorage.getItem('boss_escape_nick') || ''; } catch (e) { G.nick = ''; }

  function rnd(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function stageNum() { return G.floorIdx + (G.cycle - 1) * FLOORS.length; }

  /* ---------------- 맵 ---------------- */
  function tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
    return G.map[ty][tx];
  }
  function isSolidTile(tx, ty) { return SOLID.indexOf(tileAt(tx, ty)) >= 0; }
  function isSolidPx(x, y) { return isSolidTile(Math.floor(x / TILE), Math.floor(y / TILE)); }
  function runOffset(tx, ty, ch) {
    let s = tx;
    while (tileAt(s - 1, ty) === ch) s--;
    return (tx - s) % 2;
  }

  /** 층 색 틴트 — 배경은 시트와 완전히 같은 흰색이어야 하므로 사용하지 않는다 */
  function tintOf() { return null; }

  function diff() {
    const s = stageNum();
    return {
      speed: Math.min(1.55, 1 + s * 0.045),
      vision: Math.min(1.4, 1 + s * 0.032),
      susp: Math.min(1.7, 1 + s * 0.05),
      extraBoss: Math.max(0, G.cycle - 1),
      traps: Math.min(4, 1 + Math.floor(s / 2)),
    };
  }

  /* ---------------- 레벨 생성 ---------------- */
  function buildLevel() {
    const f = FLOORS[G.floorIdx];
    const d = diff();
    G.floor = f;
    G.map = f.map.map(function (r) { return r.split(''); });
    G.style = f.carpet
      ? { tint: 'rgba(192,80,110,0.07)' }
      : { tint: tintOf(f.tint) };

    G.docs = []; G.coffees = []; G.bosses = []; G.mate = null;
    G.particles = []; G.exitTiles = []; G.exitOpen = false;
    G.collected = 0; G.timer = 0; G.boostTimer = 0; G.alertLevel = 0;
    G.rumor = rnd(RUMORS);

    let spawn = { x: VW / 2, y: VH / 2 };
    const bossSpawns = [];
    let mateSpawn = null;
    const free = [];

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = G.map[y][x];
        if (t === '@') { spawn = { x: x * TILE + 8, y: y * TILE + 14 }; G.map[y][x] = '.'; }
        else if (t >= '1' && t <= '4') { bossSpawns.push({ x: x * TILE + 8, y: y * TILE + 14, type: +t - 1 }); G.map[y][x] = '.'; }
        else if (t === 'i') { mateSpawn = { x: x * TILE + 8, y: y * TILE + 14 }; G.map[y][x] = '.'; }
        else if (t === 'E') G.exitTiles.push({ x: x, y: y });
      }
    }
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) if (G.map[y][x] === '.') free.push({ x: x, y: y });
    }

    G.player = {
      x: spawn.x, y: spawn.y, sx: spawn.x, sy: spawn.y,
      dir: 'down', flip: false, anim: 0, frame: 0,
      stamina: 100, hidden: false, moving: false, dashing: false,
      disguise: null, dgTime: 0, dgWins: 0,
      invuln: 1.0, bubble: null,
    };

    for (let i = 0; i < d.extraBoss; i++) {
      const t = (Math.random() * BOSS_TYPES.length) | 0;
      for (let k = 0; k < 60; k++) {
        const c = free[(Math.random() * free.length) | 0];
        const px = c.x * TILE + 8, py = c.y * TILE + 14;
        if (Math.hypot(px - spawn.x, py - spawn.y) < 110) continue;
        bossSpawns.push({ x: px, y: py, type: t });
        break;
      }
    }
    bossSpawns.forEach(function (bs) { G.bosses.push(makeBoss(bs, d)); });

    if (mateSpawn || G.cycle > 1) {
      if (!mateSpawn) {
        for (let k = 0; k < 60; k++) {
          const c = free[(Math.random() * free.length) | 0];
          const px = c.x * TILE + 8, py = c.y * TILE + 14;
          if (Math.hypot(px - spawn.x, py - spawn.y) < 80) continue;
          mateSpawn = { x: px, y: py };
          break;
        }
      }
      if (mateSpawn) G.mate = makeMate(mateSpawn);
    }

    const used = Object.create(null);
    function pick(minDist) {
      for (let k = 0; k < 300; k++) {
        const c = free[(Math.random() * free.length) | 0];
        const key = c.x + ',' + c.y;
        if (used[key]) continue;
        const px = c.x * TILE + 8, py = c.y * TILE + 9;
        if (Math.hypot(px - spawn.x, py - spawn.y) < minDist) continue;
        used[key] = 1;
        return { x: px, y: py };
      }
      return null;
    }
    G.pickSpot = pick;

    G.quota = f.docs + (G.cycle - 1);
    for (let i = 0; i < G.quota; i++) {
      const p = pick(42);
      if (p) G.docs.push({ x: p.x, y: p.y, t: Math.random() * 6, bad: false });
    }
    for (let i = 0; i < d.traps; i++) {
      const p = pick(60);
      if (p) G.docs.push({ x: p.x, y: p.y, t: Math.random() * 6, bad: true });
    }
    for (let i = 0; i < 2; i++) {
      const p = pick(34);
      if (p) G.coffees.push({ x: p.x, y: p.y, t: Math.random() * 6 });
    }
  }

  function makeBoss(bs, d) {
    const type = BOSS_TYPES[bs.type % BOSS_TYPES.length];
    return {
      type: type, sprite: SPR.boss[type.index],
      x: bs.x, y: bs.y, dir: 'down', flip: false, anim: 0, frame: 0,
      angle: Math.PI / 2,
      speed: type.speed * d.speed,
      vision: type.vision * d.vision,
      cone: type.cone,
      suspRate: type.susp * d.susp,
      susp: 0, state: 'patrol', path: [], pi: 0, repath: 0,
      lastSeen: null, alertTimer: 0, bang: 0,
      talkTimer: 2 + Math.random() * 8, susTalk: 0,
      spTimer: 3 + Math.random() * 4, spActive: 0, bubble: null,
    };
  }

  function makeMate(sp) {
    return {
      x: sp.x, y: sp.y, dir: 'down', flip: false, anim: 0, frame: 0,
      sprite: SPR.mate, state: 'idle', path: [], pi: 0, repath: 0,
      talkTimer: 3 + Math.random() * 5, betrayCd: 0, confused: 0, bubble: null,
    };
  }

  function say(e, text, tone, dur) { e.bubble = { text: text, tone: tone || 'n', t: dur || 2.6 }; }
  function setMsg(m, t) { G.msg = m; G.msgTimer = t || 1.8; }

  /* ---------------- 길찾기 ---------------- */
  const bfsPrev = new Int16Array(COLS * ROWS);
  const bfsSeen = new Uint8Array(COLS * ROWS);
  const bfsQ = new Int16Array(COLS * ROWS);

  function findPath(sx, sy, gx, gy) {
    if (sx === gx && sy === gy) return [];
    if (isSolidTile(gx, gy)) return [];
    bfsSeen.fill(0);
    let head = 0, tail = 0;
    const s = sy * COLS + sx, goal = gy * COLS + gx;
    bfsSeen[s] = 1; bfsPrev[s] = -1; bfsQ[tail++] = s;
    while (head < tail) {
      const cur = bfsQ[head++];
      if (cur === goal) break;
      const cx = cur % COLS, cy = (cur / COLS) | 0;
      for (let i = 0; i < 4; i++) {
        const nx = cx + (i === 0 ? 1 : i === 1 ? -1 : 0);
        const ny = cy + (i === 2 ? 1 : i === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        const ni = ny * COLS + nx;
        if (bfsSeen[ni] || isSolidTile(nx, ny)) continue;
        bfsSeen[ni] = 1; bfsPrev[ni] = cur; bfsQ[tail++] = ni;
      }
    }
    if (!bfsSeen[goal]) return [];
    const path = [];
    let cur = goal;
    while (cur !== -1 && cur !== s) { path.push({ x: cur % COLS, y: (cur / COLS) | 0 }); cur = bfsPrev[cur]; }
    path.reverse();
    return path;
  }

  function hasLOS(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const steps = Math.ceil(Math.hypot(dx, dy) / 3);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (isSolidPx(x1 + dx * t, y1 + dy * t)) return false;
    }
    return true;
  }

  function normAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  /* ---------------- 이동 ---------------- */
  function moveEntity(e, dx, dy, hw, hh) {
    if (dx !== 0) {
      const nx = e.x + dx;
      const edge = dx > 0 ? nx + hw : nx - hw;
      if (!isSolidPx(edge, e.y - 1) && !isSolidPx(edge, e.y - hh)) e.x = nx;
    }
    if (dy !== 0) {
      const ny = e.y + dy;
      const edge = dy > 0 ? ny - 1 : ny - hh;
      if (!isSolidPx(e.x - hw, edge) && !isSolidPx(e.x + hw - 1, edge)) e.y = ny;
    }
    e.x = Math.max(2, Math.min(VW - 2, e.x));
    e.y = Math.max(hh + 1, Math.min(VH - 1, e.y));
  }

  function followPath(e, speed, dt, hw, hh) {
    let vx = 0, vy = 0;
    if (e.path.length && e.pi < e.path.length) {
      const wp = e.path[e.pi];
      const tx = wp.x * TILE + 8, ty = wp.y * TILE + 14;
      const ddx = tx - e.x, ddy = ty - e.y;
      const dd = Math.hypot(ddx, ddy);
      if (dd < 2.4) e.pi++;
      else { vx = (ddx / dd) * speed; vy = (ddy / dd) * speed; }
    }
    if (vx || vy) {
      moveEntity(e, vx * dt, vy * dt, hw, hh);
      if (Math.abs(vx) > Math.abs(vy)) { e.dir = 'side'; e.flip = vx < 0; }
      else { e.dir = vy > 0 ? 'down' : 'up'; }
      e.anim += dt * 8;
      e.frame = (e.anim | 0) % 2;
    } else e.frame = 0;
    return { vx: vx, vy: vy };
  }

  function wander(e) {
    const tx = Math.floor(e.x / TILE), ty = Math.floor(e.y / TILE);
    for (let i = 0; i < 40; i++) {
      const rx = 1 + ((Math.random() * (COLS - 2)) | 0);
      const ry = 1 + ((Math.random() * (ROWS - 2)) | 0);
      if (!isSolidTile(rx, ry) && Math.abs(rx - tx) + Math.abs(ry - ty) > 5) {
        e.path = findPath(tx, ty, rx, ry); e.pi = 0; return;
      }
    }
  }

  function burst(x, y, color, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (spd || 40) * (0.4 + Math.random() * 0.9);
      G.particles.push({
        x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20,
        life: 0.4 + Math.random() * 0.5, col: color, sz: Math.random() < 0.5 ? 1 : 2,
      });
    }
  }

  /* ---------------- 플레이어 ---------------- */
  function unhide(p) {
    p.hidden = false;
    p.disguise = null;
    p.dgTime = 0;
    G.bosses.forEach(function (b) { b.dgNear = false; });
  }

  /** 주변 3x3 타일에서 가장 가까운 은폐물을 찾아 위장 정의를 반환 */
  function findDisguise(p) {
    const tx = Math.floor(p.x / TILE), ty = Math.floor(p.y / TILE);
    let best = null, bestD = 1e9;
    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        const ch = tileAt(tx + x, ty + y);
        if (HIDEABLE.indexOf(ch) < 0) continue;
        const def = DISGUISES[ch];
        if (!def) continue;
        const cx = (tx + x + 0.5) * TILE, cy = (ty + y + 0.5) * TILE;
        const d = Math.hypot(cx - p.x, cy - (p.y - 4)) - def.q * 6;
        if (d < bestD) { bestD = d; best = def; }
      }
    }
    return best;
  }

  function updatePlayer(dt) {
    const p = G.player;
    let dx = 0, dy = 0;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;

    if (consume('hide')) {
      if (p.hidden) { unhide(p); Sfx.hide(); }
      else if (p.stamina < 12) { Sfx.blocked(); setMsg('숨이 차서 자세를 못 잡겠다', 1.0); }
      else {
        const def = findDisguise(p);
        if (def) {
          p.hidden = true; p.disguise = def; p.dgTime = 0;
          Sfx.hide();
          setMsg(def.name + '(으)로 위장! 은폐율 ' + Math.round(def.q * 100) + '%', 1.8);
          say(p, rnd(def.enter), 'n', 2.2);
          burst(p.x, p.y - 6, COL.lime, 6, 26);
        } else { Sfx.blocked(); setMsg('여긴 숨을 데가 없다', 1.0); }
      }
    }

    if (p.hidden) {
      if (dx || dy) unhide(p);
      else {
        p.dgTime += dt;
        // 위장은 오래 못 버틴다 — 자세를 유지하느라 체력이 빠르게 깎인다
        p.stamina = Math.max(0, p.stamina - 17 * dt);
        p.frame = 0; p.moving = false; p.dashing = false;
        if (p.invuln > 0) p.invuln -= dt;
        if (p.stamina <= 0) {
          unhide(p);
          Sfx.blocked();
          setMsg('더는 못 버티겠다 — 자세가 풀렸다!', 1.4);
          say(p, '아... 다리 저려...', 'a', 1.6);
        } else return;
      }
    }

    const wantDash = keys.dash && p.stamina > 1 && (dx || dy);
    p.dashing = !!wantDash;
    let speed = 60 + (G.boostTimer > 0 ? 16 : 0);
    if (wantDash) { speed *= 1.62; p.stamina = Math.max(0, p.stamina - 46 * dt); }
    else p.stamina = Math.min(100, p.stamina + 21 * dt);

    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    p.moving = !!(dx || dy);

    if (p.moving) {
      if (Math.abs(dx) > Math.abs(dy)) { p.dir = 'side'; p.flip = dx < 0; }
      else { p.dir = dy > 0 ? 'down' : 'up'; }
      p.anim += dt * (wantDash ? 13 : 8.5);
      p.frame = (p.anim | 0) % 2;
      if (wantDash && Math.random() < dt * 18) {
        G.particles.push({ x: p.x + (Math.random() * 6 - 3), y: p.y, vx: 0, vy: -6, life: 0.28, col: '#5c6b8a', sz: 1 });
      }
    } else { p.anim = 0; p.frame = 0; }

    moveEntity(p, dx * speed * dt, dy * speed * dt, 4, 7);
    if (p.invuln > 0) p.invuln -= dt;

    for (let i = G.docs.length - 1; i >= 0; i--) {
      const it = G.docs[i];
      if (Math.hypot(it.x - p.x, it.y - (p.y - 7)) < 11) {
        G.docs.splice(i, 1);
        if (it.bad) {
          G.quota += 2;
          G.score = Math.max(0, G.score - 60);
          Sfx.bad();
          G.flash = 0.4; G.flashCol = '#b13e53';
          burst(it.x, it.y, COL.red, 12, 50);
          setMsg(rnd(TRAP_LINES), 2.0);
          for (let k = 0; k < 2; k++) {
            const sp = G.pickSpot(40);
            if (sp) G.docs.push({ x: sp.x, y: sp.y, t: Math.random() * 6, bad: false });
          }
        } else {
          G.collected++;
          G.score += 100;
          Sfx.pickup();
          burst(it.x, it.y, COL.white, 8, 45);
          if (G.collected >= G.quota) {
            G.exitOpen = true;
            setMsg('서류 완료! 계단으로!', 2.4);
            Sfx.clear();
          } else setMsg(rnd(PICK_LINES) + ' ' + G.collected + '/' + G.quota, 1.0);
        }
      }
    }
    for (let i = G.coffees.length - 1; i >= 0; i--) {
      const it = G.coffees[i];
      if (Math.hypot(it.x - p.x, it.y - (p.y - 7)) < 11) {
        G.coffees.splice(i, 1);
        G.score += 50; G.boostTimer = 6; p.stamina = 100;
        Sfx.coffee();
        burst(it.x, it.y, COL.yellow, 10, 50);
        setMsg('커피! 잠이 확 깬다', 1.4);
      }
    }

    if (G.exitOpen) {
      const tx = Math.floor(p.x / TILE), ty = Math.floor(p.y / TILE);
      for (let i = 0; i < G.exitTiles.length; i++) {
        const e = G.exitTiles[i];
        if (e.x === tx && e.y === ty) { levelClear(); return; }
      }
    }
  }

  /* ---------------- 상사 ---------------- */
  function updateBoss(b, dt) {
    const p = G.player;
    const ty = b.type;
    const eyeY = b.y - 11;
    const pY = p.y - 8;
    const dist = Math.hypot(p.x - b.x, pY - eyeY);

    b.spTimer -= dt;
    if (b.spActive > 0) b.spActive -= dt;
    if (b.spTimer <= 0 && b.state === 'patrol') {
      if (ty.special === 'pause') { b.spActive = 2.0; b.spTimer = 7 + Math.random() * 5; if (!b.bubble) say(b, rnd(ty.talk), 'n', 2.0); }
      else if (ty.special === 'sprint') { b.spActive = 1.4; b.spTimer = 4 + Math.random() * 4; }
      else if (ty.special === 'spin') { b.spActive = 0.7; b.spTimer = 3.5 + Math.random() * 3; b.angle += Math.PI * (Math.random() < 0.5 ? 1 : -1); }
      else b.spTimer = 6;
    }

    let sees = false;
    if (p.invuln <= 0 && dist < b.vision) {
      if (!p.hidden) {
        const ang = Math.atan2(pY - eyeY, p.x - b.x);
        const cone = dist < 24 ? Math.PI * 0.85 : b.cone;
        if (Math.abs(normAngle(ang - b.angle)) < cone && hasLOS(b.x, eyeY, p.x, pY)) sees = true;
      }
    }

    // 위장 상태: 상사가 코앞을 지나갈 때 위장 품질만큼 버틴다
    if (p.hidden && p.disguise) {
      const dg = p.disguise;
      if (dist < 34 && hasLOS(b.x, eyeY, p.x, pY)) {
        if (!b.dgNear) {
          b.dgNear = true;
          if (!b.bubble) say(b, rnd(dg.boss), 'n', 2.4);
        }
        // 눈치 빠른 노과장(sprint)은 어설픈 위장을 잘 꿰뚫어 본다
        const leak = (1 - dg.q) * (ty.special === 'sprint' ? 2.1 : 1);
        if (leak > 0.001) {
          b.susp = Math.min(1.4, b.susp + dt * leak * 1.25);
          if (b.susp > 0.5 && b.susTalk <= 0) { say(b, rnd(ty.sus), 'q', 1.8); b.susTalk = 6; }
        }
      } else if (b.dgNear && dist > 56) {
        b.dgNear = false;
        if (b.susp < 1) {
          G.score += DISGUISE_BONUS;
          p.dgWins++;
          G.dgWins++;
          say(p, rnd(dg.win), 'n', 2.2);
          burst(p.x, p.y - 10, COL.lime, 8, 34);
          Sfx.pickup();
        }
      }
    } else b.dgNear = false;

    if (sees) {
      const close = 1 - (dist / b.vision) * 0.45;
      b.susp = Math.min(1.4, b.susp + dt * b.suspRate * close * (p.dashing ? 1.5 : 1));
      b.lastSeen = { x: p.x, y: p.y };
      if (b.susp > 0.4 && b.state === 'patrol' && b.susTalk <= 0) { say(b, rnd(ty.sus), 'q', 1.8); b.susTalk = 6; }
    } else {
      if (p.dashing && !p.hidden && dist < 60 && !G.floor.carpet) b.susp = Math.min(1.4, b.susp + dt * 0.9);
      if (!b.dgNear) b.susp = Math.max(0, b.susp - dt * (p.hidden ? 0.95 : 0.44));
    }
    if (b.susTalk > 0) b.susTalk -= dt;

    const wasChase = b.state === 'chase';
    if (b.susp >= 1) {
      b.state = 'chase';
      b.alertTimer = ty.persist;
      if (!wasChase) {
        b.bang = 1.1; Sfx.alert(); G.shake = Math.max(G.shake, 2.5); say(b, rnd(ty.chase), 'a', 2.2);
        if (p.hidden) {
          const nm = p.disguise ? p.disguise.name : '은신';
          unhide(p);
          setMsg(nm + ' 위장 발각! 튀어!', 1.8);
          burst(p.x, p.y - 8, COL.red, 10, 40);
        }
      }
    } else if (b.alertTimer > 0) {
      b.alertTimer -= dt;
      b.state = b.alertTimer > 0 ? 'alert' : 'patrol';
      if (b.state === 'patrol') b.path = [];
    } else if (b.state !== 'patrol') { b.state = 'patrol'; b.path = []; }
    if (b.bang > 0) b.bang -= dt;

    b.talkTimer -= dt;
    if (b.talkTimer <= 0) {
      b.talkTimer = 7 + Math.random() * 8;
      if (b.state === 'patrol' && !b.bubble) say(b, rnd(ty.talk), 'n', 2.6);
    }
    if (b.bubble) { b.bubble.t -= dt; if (b.bubble.t <= 0) b.bubble = null; }

    const btx = Math.floor(b.x / TILE), bty = Math.floor(b.y / TILE);
    b.repath -= dt;
    if (b.state === 'chase') {
      if (b.repath <= 0) { b.path = findPath(btx, bty, Math.floor(p.x / TILE), Math.floor(p.y / TILE)); b.pi = 0; b.repath = 0.28; }
    } else if (b.state === 'alert' && b.lastSeen) {
      if (b.repath <= 0 || !b.path.length) { b.path = findPath(btx, bty, Math.floor(b.lastSeen.x / TILE), Math.floor(b.lastSeen.y / TILE)); b.pi = 0; b.repath = 0.6; }
    } else if (!b.path.length || b.pi >= b.path.length) wander(b);

    let speed = b.speed;
    if (b.state === 'chase') speed *= 1.34;
    else if (b.state === 'alert') speed *= 1.12;
    else speed *= 0.84;
    if (ty.special === 'pause' && b.spActive > 0 && b.state === 'patrol') speed = 0;
    if (ty.special === 'sprint' && b.spActive > 0) speed *= 1.85;
    if (ty.special === 'spin' && b.spActive > 0 && b.state === 'patrol') speed = 0;

    const v = followPath(b, speed, dt, 5, 8);
    if (v.vx || v.vy) {
      const target = Math.atan2(v.vy, v.vx);
      b.angle += normAngle(target - b.angle) * Math.min(1, dt * 7);
    } else if (b.state === 'patrol') {
      b.angle += Math.sin(G.anim * 1.2 + b.x) * dt * 1.1;
    }

    if (!p.hidden && p.invuln <= 0 && Math.hypot(p.x - b.x, p.y - b.y) < 9) caught(b);
  }

  /* ---------------- 동기 (내부고발자) ---------------- */
  function updateMate(dt) {
    const m = G.mate;
    if (!m) return;
    const p = G.player;
    const dist = Math.hypot(p.x - m.x, p.y - m.y);

    if (m.bubble) { m.bubble.t -= dt; if (m.bubble.t <= 0) m.bubble = null; }
    if (m.betrayCd > 0) m.betrayCd -= dt;
    if (m.confused > 0) m.confused -= dt;

    const mtx = Math.floor(m.x / TILE), mty = Math.floor(m.y / TILE);
    m.repath -= dt;

    if (m.state === 'follow') {
      if (p.hidden || dist > 96) {
        m.state = 'confused'; m.confused = 2.2; m.path = [];
        say(m, rnd(p.hidden && dist < 40 ? MATE.toProp : MATE.lost), 'q', 2.0);
      } else {
        if (m.repath <= 0) { m.path = findPath(mtx, mty, Math.floor(p.x / TILE), Math.floor(p.y / TILE)); m.pi = 0; m.repath = 0.4; }
        m.talkTimer -= dt;
        if (m.talkTimer <= 0 && !m.bubble) { say(m, rnd(MATE.friendly), 'n', 2.4); m.talkTimer = 5 + Math.random() * 4; }
        if (m.betrayCd <= 0) {
          for (let i = 0; i < G.bosses.length; i++) {
            const b = G.bosses[i];
            if (Math.hypot(b.x - m.x, b.y - m.y) < 104 && hasLOS(m.x, m.y - 8, b.x, b.y - 11)) { betray(); break; }
          }
        }
      }
    } else if (m.state === 'confused') {
      if (m.confused <= 0) m.state = 'idle';
    } else {
      if (!p.hidden && dist < 46) { m.state = 'follow'; m.path = []; m.talkTimer = 0.2; }
      else if (!m.path.length || m.pi >= m.path.length) wander(m);
    }

    const spd = m.state === 'follow' ? 48 : m.state === 'confused' ? 0 : 30;
    followPath(m, spd, dt, 4, 7);
  }

  function betray() {
    const m = G.mate;
    m.betrayCd = 9;
    say(m, rnd(MATE.betray), 'a', 2.6);
    Sfx.betray();
    G.shake = 5;
    G.flash = 0.45; G.flashCol = '#b13e53';
    G.bosses.forEach(function (bs) {
      bs.susp = 1.25;
      bs.lastSeen = { x: G.player.x, y: G.player.y };
      bs.alertTimer = bs.type.persist;
      bs.state = 'chase';
      bs.bang = 1.1;
    });
    if (!G.betrayedOnce) { G.betrayedOnce = true; setMsg('동기 최씨... 너였구나', 2.8); }
    else setMsg('또 고발당했다!', 1.6);
  }

  /* ---------------- 상태 전환 ---------------- */
  function caught(b) {
    G.state = 'caught'; G.stateTimer = 0;
    G.lives--; G.shake = 6; G.flash = 0.5; G.flashCol = '#b13e53';
    G.catchLine = rnd(b.type.catch);
    G.catchName = b.type.name + ' · ' + b.type.tag;
    Sfx.caught();
    burst(G.player.x, G.player.y - 8, COL.red, 16, 60);
  }

  function levelClear() {
    G.state = 'clear'; G.stateTimer = 0;
    G.totalTime += G.timer;
    G.lastBonus = Math.max(0, 600 - Math.floor(G.timer) * 5);
    G.score += 500 + G.lastBonus;
    Sfx.clear();
    burst(G.player.x, G.player.y - 8, COL.cyan, 22, 70);
  }

  function nextFloor() {
    if (FLOORS[G.floorIdx].final) {
      G.state = 'ending'; G.stateTimer = 0; saveBest(); Sfx.ending();
      return;
    }
    G.floorIdx++;
    startFloor();
  }

  function startFloor() { buildLevel(); G.state = 'intro'; G.stateTimer = 0; }
  function gameOver() { G.state = 'over'; G.stateTimer = 0; saveBest(); Sfx.over(); }
  function saveBest() {
    if (G.score > G.best) {
      G.best = G.score;
      try { localStorage.setItem('boss_escape_best', String(G.best)); } catch (e) {}
    }
  }

  function respawn() {
    const p = G.player;
    p.x = p.sx; p.y = p.sy;
    p.hidden = false; p.disguise = null; p.dgTime = 0; p.stamina = 100; p.invuln = 2.4;
    G.bosses.forEach(function (b) { b.susp = 0; b.state = 'patrol'; b.path = []; b.alertTimer = 0; b.lastSeen = null; b.dgNear = false; });
    if (G.mate) { G.mate.state = 'idle'; G.mate.path = []; G.mate.betrayCd = 4; }
    G.state = 'play';
  }

  function startGame() {
    G.floorIdx = 0; G.cycle = 1; G.score = 0; G.lives = 3;
    G.totalTime = 0; G.betrayedOnce = false; G.dgWins = 0;
    startFloor();
    Sfx.start();
  }

  /* ---------------- 업데이트 ---------------- */
  /** 일시정지 = 차트 개체를 접고 순수 엑셀 시트만 남긴다 */
  function setPaused(on) {
    G.state = on ? 'pause' : 'play';
    if (window.Shell) Shell.setPause(on);
  }

  function update(dt) {
    // 화면 위장 중에는 게임이 완전히 멈춘다 (상사가 지나가는 동안)
    if (window.__CAMO) {
      for (const k in keys) keys[k] = false;
      clearPressed();
      return;
    }
    G.anim += dt;
    if (G.msgTimer > 0) G.msgTimer -= dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 14);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.6);

    for (let i = G.particles.length - 1; i >= 0; i--) {
      const pt = G.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) { G.particles.splice(i, 1); continue; }
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 90 * dt;
    }

    switch (G.state) {
      case 'title':
        if (consume('confirm')) startGame();
        return;
      case 'intro':
        G.stateTimer += dt;
        if (G.stateTimer > 0.5 && (anyPressed() || G.stateTimer > 3.8)) { clearPressed(); G.state = 'play'; }
        return;
      case 'caught':
        G.stateTimer += dt;
        if (G.stateTimer > 1.9) { if (G.lives <= 0) gameOver(); else respawn(); }
        return;
      case 'clear':
        G.stateTimer += dt;
        if (G.stateTimer > 1.2 && consume('confirm')) nextFloor();
        return;
      case 'ending':
        G.stateTimer += dt;
        if (G.stateTimer > 1.2 && consume('confirm')) {
          G.cycle++; G.floorIdx = 0;
          G.lives = Math.min(3, G.lives + 1);
          startFloor();
        }
        return;
      case 'over':
        G.stateTimer += dt;
        if (G.stateTimer > 0.8 && consume('confirm')) G.state = 'title';
        return;
      case 'pause':
        if (consume('pause') || consume('confirm')) setPaused(false);
        return;
    }

    if (consume('pause')) { setPaused(true); return; }
    if (consume('mute')) toggleMute();

    G.timer += dt;
    if (G.boostTimer > 0) G.boostTimer -= dt;
    updatePlayer(dt);
    if (G.state !== 'play') return;
    updateMate(dt);
    let maxS = 0;
    for (let i = 0; i < G.bosses.length; i++) {
      updateBoss(G.bosses[i], dt);
      if (G.state !== 'play') return;
      maxS = Math.max(maxS, Math.min(1, G.bosses[i].susp));
    }
    G.alertLevel = maxS;
  }

  /* ---------------- 소품 ---------------- */
  function shadowRect(x, y, w, h) { ctx.fillStyle = COL.shadow; ctx.fillRect(x, y, w, h); }

  function drawDeskOffice(px, py) {
    shadowRect(px + 1, py + 12, 30, 4);
    ctx.fillStyle = COL.propLite; ctx.fillRect(px + 6, py - 7, 13, 10);
    ctx.fillStyle = '#1a1c2c'; ctx.fillRect(px + 7, py - 6, 11, 8);
    ctx.fillStyle = '#41a6f6'; ctx.fillRect(px + 8, py - 5, 9, 6);
    ctx.fillStyle = '#73eff7'; ctx.fillRect(px + 9, py - 4, 5, 1); ctx.fillRect(px + 9, py - 2, 7, 1);
    ctx.fillStyle = COL.propLite; ctx.fillRect(px + 11, py + 3, 3, 2);
    ctx.fillStyle = '#94b0c2'; ctx.fillRect(px, py + 5, 32, 4);
    ctx.fillStyle = '#c3d3e0'; ctx.fillRect(px, py + 5, 32, 1);
    ctx.fillStyle = '#566c86'; ctx.fillRect(px, py + 9, 32, 3);
    ctx.fillStyle = COL.propLite; ctx.fillRect(px + 2, py + 11, 2, 4); ctx.fillRect(px + 28, py + 11, 2, 4);
    ctx.fillStyle = COL.white; ctx.fillRect(px + 22, py + 2, 6, 3);
    ctx.fillStyle = '#566c86'; ctx.fillRect(px + 23, py + 3, 4, 1);
    ctx.fillStyle = '#b13e53'; ctx.fillRect(px + 2, py + 2, 3, 3);
  }

  function drawTableMeeting(px, py) {
    shadowRect(px + 1, py + 12, 30, 4);
    ctx.fillStyle = '#a4633a'; ctx.fillRect(px, py + 2, 32, 7);
    ctx.fillStyle = '#c17a4a'; ctx.fillRect(px, py + 2, 32, 1);
    ctx.fillStyle = '#7a4a2b'; ctx.fillRect(px, py + 9, 32, 3);
    ctx.fillStyle = '#5a361f'; ctx.fillRect(px + 3, py + 11, 3, 4); ctx.fillRect(px + 26, py + 11, 3, 4);
    ctx.fillStyle = COL.white; ctx.fillRect(px + 4, py + 4, 5, 3); ctx.fillRect(px + 20, py + 3, 5, 3);
    ctx.fillStyle = '#566c86'; ctx.fillRect(px + 5, py + 5, 3, 1); ctx.fillRect(px + 21, py + 4, 3, 1);
    ctx.fillStyle = '#333c57'; ctx.fillRect(px + 13, py + 3, 4, 5);
    ctx.fillStyle = '#94b0c2'; ctx.fillRect(px + 14, py + 4, 2, 2);
  }

  function drawDeskDesign(px, py) {
    shadowRect(px + 1, py + 12, 30, 4);
    ctx.fillStyle = COL.propLite; ctx.fillRect(px + 2, py - 9, 13, 12); ctx.fillRect(px + 17, py - 7, 12, 10);
    ctx.fillStyle = '#1a1c2c'; ctx.fillRect(px + 3, py - 8, 11, 10); ctx.fillRect(px + 18, py - 6, 10, 8);
    ctx.fillStyle = '#5d275d'; ctx.fillRect(px + 4, py - 7, 9, 8);
    ctx.fillStyle = '#ef7d57'; ctx.fillRect(px + 5, py - 6, 3, 3);
    ctx.fillStyle = '#a7f070'; ctx.fillRect(px + 9, py - 6, 3, 3);
    ctx.fillStyle = '#41a6f6'; ctx.fillRect(px + 5, py - 2, 7, 2);
    ctx.fillStyle = '#257179'; ctx.fillRect(px + 19, py - 5, 8, 6);
    ctx.fillStyle = '#73eff7'; ctx.fillRect(px + 20, py - 4, 4, 1); ctx.fillRect(px + 20, py - 2, 6, 1);
    ctx.fillStyle = '#d7dee8'; ctx.fillRect(px, py + 5, 32, 4);
    ctx.fillStyle = '#eaf0f6'; ctx.fillRect(px, py + 5, 32, 1);
    ctx.fillStyle = '#94b0c2'; ctx.fillRect(px, py + 9, 32, 3);
    ctx.fillStyle = '#566c86'; ctx.fillRect(px + 2, py + 11, 2, 4); ctx.fillRect(px + 28, py + 11, 2, 4);
    ctx.fillStyle = '#b13e53'; ctx.fillRect(px + 22, py + 2, 2, 3);
    ctx.fillStyle = '#38b764'; ctx.fillRect(px + 25, py + 2, 2, 3);
    ctx.fillStyle = '#ffcd75'; ctx.fillRect(px + 28, py + 2, 2, 3);
  }

  function drawSofa(px, py) {
    shadowRect(px + 1, py + 13, 30, 3);
    ctx.fillStyle = '#3a2030'; ctx.fillRect(px + 1, py + 1, 30, 13);
    ctx.fillStyle = '#5a2f45'; ctx.fillRect(px + 1, py + 1, 30, 5);
    ctx.fillStyle = '#7a4059'; ctx.fillRect(px + 3, py + 6, 26, 5);
    ctx.fillStyle = '#8f4d69'; ctx.fillRect(px + 3, py + 6, 26, 1);
    ctx.fillStyle = '#5a2f45'; ctx.fillRect(px + 1, py + 6, 3, 7); ctx.fillRect(px + 28, py + 6, 3, 7);
    ctx.fillStyle = '#3a2030'; ctx.fillRect(px + 15, py + 6, 1, 5);
  }

  function drawReception(px, py) {
    shadowRect(px + 1, py + 13, 30, 3);
    ctx.fillStyle = '#566c86'; ctx.fillRect(px, py + 1, 32, 13);
    ctx.fillStyle = '#94b0c2'; ctx.fillRect(px, py + 1, 32, 3);
    ctx.fillStyle = '#c3d3e0'; ctx.fillRect(px, py + 1, 32, 1);
    ctx.fillStyle = '#41a6f6'; ctx.fillRect(px + 6, py + 6, 20, 5);
    ctx.fillStyle = '#73eff7'; ctx.fillRect(px + 8, py + 8, 16, 1);
    ctx.fillStyle = '#333c57'; ctx.fillRect(px, py + 13, 32, 2);
  }

  function drawPlant(px, py) {
    shadowRect(px + 2, py + 13, 12, 3);
    ctx.fillStyle = '#ef7d57'; ctx.fillRect(px + 4, py + 9, 8, 6);
    ctx.fillStyle = '#b13e53'; ctx.fillRect(px + 4, py + 14, 8, 1);
    ctx.fillStyle = '#c96a4a'; ctx.fillRect(px + 4, py + 9, 8, 1);
    ctx.fillStyle = '#38b764'; ctx.fillRect(px + 6, py + 3, 4, 7); ctx.fillRect(px + 2, py + 5, 4, 3); ctx.fillRect(px + 10, py + 4, 4, 3);
    ctx.fillStyle = '#a7f070'; ctx.fillRect(px + 7, py + 1, 2, 4); ctx.fillRect(px + 3, py + 5, 2, 1); ctx.fillRect(px + 11, py + 4, 2, 1);
  }

  function drawBigPlant(px, py) {
    shadowRect(px + 1, py + 13, 14, 3);
    ctx.fillStyle = '#7a4a2b'; ctx.fillRect(px + 3, py + 8, 10, 7);
    ctx.fillStyle = '#a4633a'; ctx.fillRect(px + 3, py + 8, 10, 1);
    ctx.fillStyle = '#257179'; ctx.fillRect(px + 5, py - 2, 6, 10);
    ctx.fillStyle = '#38b764'; ctx.fillRect(px + 1, py, 5, 4); ctx.fillRect(px + 10, py - 1, 5, 4); ctx.fillRect(px + 4, py - 5, 8, 4);
    ctx.fillStyle = '#a7f070'; ctx.fillRect(px + 6, py - 6, 4, 2); ctx.fillRect(px + 2, py + 1, 2, 1); ctx.fillRect(px + 12, py, 2, 1);
  }

  function drawCooler(px, py) {
    shadowRect(px + 2, py + 13, 12, 3);
    ctx.fillStyle = '#94b0c2'; ctx.fillRect(px + 3, py + 6, 10, 9);
    ctx.fillStyle = '#566c86'; ctx.fillRect(px + 3, py + 14, 10, 1);
    ctx.fillStyle = '#41a6f6'; ctx.fillRect(px + 4, py, 8, 6);
    ctx.fillStyle = '#73eff7'; ctx.fillRect(px + 5, py + 1, 3, 2);
    ctx.fillStyle = '#333c57'; ctx.fillRect(px + 6, py + 8, 4, 2);
    ctx.fillStyle = '#1a1c2c'; ctx.fillRect(px + 5, py + 11, 6, 3);
  }

  function drawCopier(px, py) {
    shadowRect(px + 1, py + 13, 14, 3);
    ctx.fillStyle = '#566c86'; ctx.fillRect(px + 2, py + 2, 12, 13);
    ctx.fillStyle = '#94b0c2'; ctx.fillRect(px + 2, py + 2, 12, 2);
    ctx.fillStyle = '#333c57'; ctx.fillRect(px + 3, py + 5, 10, 4);
    ctx.fillStyle = '#41a6f6'; ctx.fillRect(px + 4, py + 6, 3, 1);
    ctx.fillStyle = COL.propLite; ctx.fillRect(px + 4, py + 10, 8, 3);
    ctx.fillStyle = '#b13e53'; ctx.fillRect(px + 11, py + 3, 2, 1);
  }

  function drawWhiteboard(px, py) {
    ctx.fillStyle = '#333c57'; ctx.fillRect(px, py + 1, 16, 12);
    ctx.fillStyle = '#e8ecf2'; ctx.fillRect(px + 1, py + 2, 14, 9);
    ctx.fillStyle = '#41a6f6'; ctx.fillRect(px + 3, py + 4, 7, 1); ctx.fillRect(px + 3, py + 6, 5, 1);
    ctx.fillStyle = '#b13e53'; ctx.fillRect(px + 9, py + 7, 4, 1); ctx.fillRect(px + 11, py + 4, 2, 2);
    ctx.fillStyle = '#566c86'; ctx.fillRect(px + 1, py + 11, 14, 1);
  }

  function drawGolf(px, py) {
    shadowRect(px + 3, py + 13, 10, 3);
    ctx.fillStyle = '#333c57'; ctx.fillRect(px + 4, py + 3, 8, 12);
    ctx.fillStyle = '#b13e53'; ctx.fillRect(px + 4, py + 6, 8, 3);
    ctx.fillStyle = '#94b0c2'; ctx.fillRect(px + 5, py - 1, 1, 5); ctx.fillRect(px + 7, py - 3, 1, 7); ctx.fillRect(px + 9, py, 1, 4);
    ctx.fillStyle = COL.propLite; ctx.fillRect(px + 7, py - 4, 1, 1);
  }

  function drawTrophy(px, py) {
    shadowRect(px + 2, py + 13, 12, 3);
    ctx.fillStyle = '#3a2030'; ctx.fillRect(px + 2, py, 12, 15);
    ctx.fillStyle = '#1a1c2c'; ctx.fillRect(px + 3, py + 1, 10, 13);
    ctx.fillStyle = '#ffcd75'; ctx.fillRect(px + 5, py + 3, 3, 3); ctx.fillRect(px + 6, py + 6, 1, 2); ctx.fillRect(px + 5, py + 8, 3, 1);
    ctx.fillStyle = '#a7f070'; ctx.fillRect(px + 9, py + 4, 3, 2);
    ctx.fillStyle = '#41a6f6'; ctx.fillRect(px + 9, py + 9, 3, 3);
    ctx.fillStyle = '#566c86'; ctx.fillRect(px + 3, py + 7, 10, 1);
  }

  const PROP_DRAW = {
    D: drawDeskOffice, T: drawTableMeeting, A: drawDeskDesign, S: drawSofa, R: drawReception,
    p: drawPlant, f: drawBigPlant, c: drawCooler, x: drawCopier, w: drawWhiteboard, g: drawGolf, v: drawTrophy,
  };

  /* ---------------- 배경 ---------------- */
  /* 바닥은 비워 둔다. 시트의 셀 격자(#wrap 배경)가 그대로 비쳐 보이게. */
  function drawFloorLayer() {
    const st = G.style;
    ctx.clearRect(0, 0, CW, VH);
    // 카펫/구역 색은 셀 채우기처럼 아주 옅게만 남긴다
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (G.map[y][x] === '#') continue;
        if (!st.tint) continue;
        ctx.fillStyle = st.tint;
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
    // 벽 = 진하게 채워진 셀 블록
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (G.map[y][x] !== '#') continue;
        const px = x * TILE, py = y * TILE;
        // 벽도 칠하지 않는다 — 시트 셀이 그대로 비쳐서 표가 이어져 보이게
        // 맵 가장자리 벽은 윤곽선도 그리지 않는다(바깥 테두리 제거)
        if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) continue;
        if (tileAt(x, y - 1) !== '#') { ctx.fillStyle = COL.wallLine; ctx.fillRect(px, py, TILE, 1); }
        if (tileAt(x, y + 1) !== '#') { ctx.fillStyle = COL.wallLine; ctx.fillRect(px, py + TILE - 1, TILE, 1); }
        if (tileAt(x - 1, y) !== '#') { ctx.fillStyle = COL.wallLine; ctx.fillRect(px, py, 1, TILE); }
        if (tileAt(x + 1, y) !== '#') { ctx.fillStyle = COL.wallLine; ctx.fillRect(px + TILE - 1, py, 1, TILE); }
      }
    }
    for (let i = 0; i < G.exitTiles.length; i++) {
      const e = G.exitTiles[i];
      drawExit(e.x * TILE, e.y * TILE, G.floor.final);
    }
  }

  function drawExit(px, py, isFinal) {
    ctx.fillStyle = COL.wall; ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = G.exitOpen ? '#d6ecdc' : '#f2dcdc';
    ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = COL.wallLine; ctx.fillRect(px, py, TILE, 1); ctx.fillRect(px, py + TILE - 1, TILE, 1);
    if (G.exitOpen) {
      const pulse = 0.55 + 0.45 * Math.sin(G.anim * 6);
      ctx.fillStyle = 'rgba(31,111,63,' + (0.18 + 0.22 * pulse) + ')';
      ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
      ctx.fillStyle = COL.green;
      ctx.fillRect(px + 6, py + 4, 4, 2);
      ctx.fillRect(px + 5, py + 6, 6, 2);
      ctx.fillRect(px + 7, py + 8, 2, 4);
    } else {
      ctx.fillStyle = COL.red; ctx.fillRect(px + 5, py + 6, 6, 5);
      ctx.fillStyle = '#f2dcdc'; ctx.fillRect(px + 7, py + 8, 2, 2);
      ctx.fillStyle = COL.gray; ctx.fillRect(px + 6, py + 4, 4, 2);
    }
    if (isFinal) { ctx.fillStyle = G.exitOpen ? COL.green : COL.dim; ctx.fillRect(px + 2, py + 2, 12, 1); }
  }

  function drawCone(b) {
    const eyeY = b.y - 11;
    const r = b.vision, half = b.cone, steps = 24;
    ctx.fillStyle = b.state === 'chase' ? 'rgba(192,0,0,0.16)'
      : b.state === 'alert' ? 'rgba(197,90,17,0.15)' : 'rgba(191,143,0,0.10)';
    ctx.beginPath();
    ctx.moveTo(b.x, eyeY);
    for (let i = 0; i <= steps; i++) {
      const a = b.angle - half + (half * 2 * i) / steps;
      const dx = Math.cos(a), dy = Math.sin(a);
      let d = r;
      for (let s = 4; s <= r; s += 4) {
        if (isSolidPx(b.x + dx * s, eyeY + dy * s)) { d = s - 4; break; }
      }
      ctx.lineTo(b.x + dx * d, eyeY + dy * d);
    }
    ctx.closePath();
    ctx.fill();
  }

  /* ---------------- 캐릭터 ---------------- */
  function drawShadowOval(x, y, w) {
    ctx.fillStyle = 'rgba(31,56,100,0.16)';
    ctx.fillRect(x - w / 2, y - 1, w, 2);
    ctx.fillRect(x - w / 2 + 1, y - 2, w - 2, 1);
  }

  function drawActor(set, e) {
    const arr = set[e.dir];
    const s = arr[e.frame % arr.length];
    const bob = e.frame === 1 ? -1 : 0;
    const x = Math.round(e.x - s.w / 2);
    const y = Math.round(e.y - s.h + bob);
    if (e.flip && e.dir === 'side') {
      ctx.save();
      ctx.translate(x + s.w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(s.canvas, 0, 0);
      ctx.restore();
    } else ctx.drawImage(s.canvas, x, y);
  }

  function drawBubble(e, extraUp) {
    const b = e.bubble;
    if (!b || G.state !== 'play') return;
    const size = 11;
    const w = Math.min(VW - 4, TW(b.text, size) + 6);
    const h = Txt.height(size) + 2;
    let x = Math.round(e.x - w / 2);
    const y = Math.max(1, Math.round(e.y - 20 - h - (extraUp || 0)));
    x = Math.max(2, Math.min(VW - w - 2, x));
    const border = b.tone === 'a' ? COL.red : b.tone === 'q' ? COL.yellow : COL.gray;
    const fill = b.tone === 'a' ? '#fdeaea' : '#ffffe1';
    const textCol = b.tone === 'a' ? COL.red : b.tone === 'q' ? '#8a6a00' : '#3a3a2a';
    ctx.globalAlpha = Math.min(1, b.t * 3);
    ctx.fillStyle = border; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fill; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    const tx = Math.max(x + 2, Math.min(x + w - 5, Math.round(e.x - 2)));
    ctx.fillStyle = border; ctx.fillRect(tx, y + h, 3, 3);
    ctx.fillStyle = fill; ctx.fillRect(tx, y + h - 1, 2, 2);
    T(b.text, x + 3, y + 2, textCol, size, 1, 'left');
    ctx.globalAlpha = 1;
  }

  function drawPlayer() {
    const p = G.player;
    drawShadowOval(p.x, p.y, 9);
    const blink = p.invuln > 0 && ((p.invuln * 12) | 0) % 2 === 0;
    if (!blink) {
      if (p.hidden) {
        const dg = p.disguise;
        const s = dg ? dgSprite(dg) : SPR.playerHide;
        // 숨 참는 중 - 아주 살짝 들썩인다
        const bob = Math.sin(p.dgTime * 2.4) > 0.86 ? 1 : 0;
        const px = Math.round(p.x - s.w / 2);
        const py = Math.round(p.y - s.h) + bob;
        if (dg && dg.spr === 'desk') {
          ctx.globalAlpha = 0.7;
          ctx.drawImage(s.canvas, px, py);
          ctx.globalAlpha = 1;
        } else {
          ctx.drawImage(s.canvas, px, py);
        }
        // 식은땀
        const t = (G.anim * 2) % 2;
        ctx.fillStyle = COL.cyan;
        ctx.fillRect(Math.round(p.x + 5), Math.round(p.y - 16 - t * 3), 2, 2);
        // 위장 품질 표시 (초록=완벽 / 노랑=불안 / 빨강=허술)
        if (dg) {
          const q = dg.q;
          const bw = Math.max(1, Math.round(10 * q));
          const bx = Math.round(p.x - 5), by = Math.round(p.y + 1);
          ctx.fillStyle = '#c9d3e0'; ctx.fillRect(bx - 1, by - 1, 12, 4);
          ctx.fillStyle = q >= 0.95 ? COL.lime : q >= 0.85 ? COL.green : q >= 0.78 ? COL.yellow : COL.orange;
          ctx.fillRect(bx, by, bw, 2);
        }
      } else {
        drawActor(SPR.player, p);
        if (G.boostTimer > 0) {
          ctx.fillStyle = 'rgba(255,205,117,0.55)';
          const t = (G.anim * 9) % 3;
          ctx.fillRect(Math.round(p.x - 8 + t), Math.round(p.y - 18), 1, 2);
          ctx.fillRect(Math.round(p.x + 7 - t), Math.round(p.y - 12), 1, 2);
        }
      }
    }
    drawBubble(p, 0);
  }

  function drawBoss(b) {
    drawShadowOval(b.x, b.y, 11);
    drawActor(b.sprite, b);
    const s = Math.min(1, b.susp);
    if (s > 0.04 && b.state !== 'chase') {
      const w = 12;
      const x = Math.round(b.x - w / 2), y = Math.round(b.y - 24);
      ctx.fillStyle = '#c9d3e0'; ctx.fillRect(x - 1, y - 1, w + 2, 5);
      ctx.fillStyle = s > 0.6 ? COL.red : COL.yellow;
      ctx.fillRect(x, y, Math.max(1, Math.round(w * s)), 3);
    }
    if (b.state === 'chase') {
      const bounce = b.bang > 0 ? Math.round(Math.sin(b.bang * 20) * 2) : 0;
      ctx.drawImage(SPR_BANG.canvas, Math.round(b.x - 2), Math.round(b.y - 31 + bounce));
    } else if (b.state === 'alert') {
      ctx.drawImage(SPR_QUESTION.canvas, Math.round(b.x - 2), Math.round(b.y - 31));
    }
    drawBubble(b, 6);
  }

  function drawMate() {
    const m = G.mate;
    if (!m) return;
    drawShadowOval(m.x, m.y, 9);
    drawActor(m.sprite, m);
    if (m.state === 'follow') {
      ctx.fillStyle = COL.lime;
      ctx.fillRect(Math.round(m.x - 1), Math.round(m.y - 22 + Math.sin(G.anim * 5)), 2, 2);
    }
    drawBubble(m, 4);
  }

  function drawItems() {
    for (let i = 0; i < G.docs.length; i++) {
      const it = G.docs[i];
      const bob = Math.round(Math.sin(G.anim * 3 + it.t) * 1.5);
      ctx.fillStyle = 'rgba(31,56,100,0.14)'; ctx.fillRect(it.x - 3, it.y + 5, 6, 2);
      ctx.drawImage((it.bad ? SPR_DOC_BAD : SPR_DOC).canvas, Math.round(it.x - 4), Math.round(it.y - 4 + bob));
      if (it.bad) {
        if (((G.anim * 3 + it.t) | 0) % 2 === 0) {
          ctx.fillStyle = 'rgba(177,62,83,0.45)';
          ctx.fillRect(Math.round(it.x - 5), Math.round(it.y - 5 + bob), 10, 10);
        }
      } else if (((G.anim * 4 + it.t) | 0) % 6 === 0) {
        ctx.fillStyle = COL.white;
        ctx.fillRect(Math.round(it.x + 4), Math.round(it.y - 6 + bob), 1, 1);
      }
    }
    for (let i = 0; i < G.coffees.length; i++) {
      const it = G.coffees[i];
      const bob = Math.round(Math.sin(G.anim * 3 + it.t) * 1.5);
      ctx.fillStyle = 'rgba(31,56,100,0.14)'; ctx.fillRect(it.x - 3, it.y + 5, 6, 2);
      ctx.drawImage(SPR_COFFEE.canvas, Math.round(it.x - 4), Math.round(it.y - 4 + bob));
      ctx.fillStyle = 'rgba(244,244,244,0.6)';
      const st = (G.anim * 2 + it.t) % 2;
      ctx.fillRect(Math.round(it.x - 1), Math.round(it.y - 8 - st * 2 + bob), 1, 2);
    }
  }

  function drawParticles() {
    for (let i = 0; i < G.particles.length; i++) {
      const pt = G.particles[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, pt.life / 0.5));
      ctx.fillStyle = pt.col;
      ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.sz, pt.sz);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------- HUD ---------------- */
  function drawHUD() {
    // HUD 도 시트의 일부처럼 보이게 — 배경은 셀 채우기 수준으로만
    ctx.fillStyle = 'rgba(226,236,247,0.55)'; ctx.fillRect(0, 0, CW, HUD_H);
    ctx.fillStyle = COL.hudLine; ctx.fillRect(0, HUD_H - 1, CW, 1);

    T(G.floor.name, 3, 9, COL.navy, 14);
    ctx.drawImage(SPR_DOC.canvas, 72, 8);
    T(G.collected + '/' + G.quota, 82, 9, G.exitOpen ? COL.green : COL.white, 11);
    for (let i = 0; i < 3; i++) ctx.drawImage((i < G.lives ? SPR_HEART : SPR_HEART_OFF).canvas, 104 + i * 8, 9);

    T('체력', 132, 9, COL.gray, 11);
    ctx.fillStyle = '#dde3ec'; ctx.fillRect(155, 10, 34, 6);
    const ratio = G.player ? G.player.stamina / 100 : 1;
    ctx.fillStyle = ratio > 0.35 ? (G.boostTimer > 0 ? COL.yellow : COL.blue) : COL.red;
    ctx.fillRect(156, 11, Math.round(32 * ratio), 4);

    T('경보', 197, 9, COL.gray, 11);
    ctx.fillStyle = '#dde3ec'; ctx.fillRect(220, 10, 44, 6);
    const al = G.alertLevel;
    ctx.fillStyle = al > 0.7 ? COL.red : al > 0.3 ? COL.yellow : COL.green;
    ctx.fillRect(221, 11, Math.max(1, Math.round(42 * Math.max(0.04, al))), 4);

    T(String(G.score).padStart(6, '0'), CW - 3, 9, COL.gray, 11, 1, 'right');
  }

  /* ---------------- 오버레이 ---------------- */
  function dim(a) { ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.96, a + 0.14) + ')'; ctx.fillRect(0, HUD_H, CW, VH); }
  function panel(x, y, w, h, border) {
    ctx.fillStyle = border || COL.hudLine; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.97)'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  }

  /** 타이틀/엔딩 배경 — 시트 격자가 비쳐 보이도록 비워 둔다 */
  function sheetBackdrop() {
    ctx.clearRect(0, 0, CW, CH);
  }

  function drawTitle() {
    sheetBackdrop();
    const t = G.anim;
    const fake = { x: 46 + Math.sin(t * 1.1) * 26, y: 240, dir: 'side', flip: Math.cos(t * 1.1) < 0, frame: ((t * 8) | 0) % 2 };
    drawShadowOval(fake.x, fake.y, 9);
    drawActor(SPR.player, fake);
    for (let i = 0; i < 4; i++) {
      const b = {
        x: 120 + i * 50 - Math.sin(t * 1.1 + i * 0.4) * 12,
        y: 238 + (i % 2) * 4, dir: 'side',
        flip: Math.cos(t * 1.1 + i * 0.4) > 0, frame: ((t * 7 + i) | 0) % 2,
      };
      drawShadowOval(b.x, b.y, 11);
      drawActor(SPR.boss[i], b);
    }

    T('상사 피하기', CW / 2, 38, COL.navy, 18, 1, 'center');
    T('OFFICE  ESCAPE', CW / 2, 54, COL.dim, 9, 1, 'center');
    T('서류를 모두 챙겨 로비까지 탈출하라', CW / 2, 72, COL.white, 14, 1, 'center');
    T('이동 WASD/방향키   ·   질주 SHIFT', CW / 2, 90, COL.gray, 11, 1, 'center');
    T('사물 옆에서 SPACE - 그 사물로 위장 (체력 소모)', CW / 2, 101, COL.gray, 11, 1, 'center');
    T('화분 쿠션 정수기 복사기 골프백 흉상', CW / 2, 112, COL.lime, 11, 1, 'center');
    T('빨간 도장 서류는 줍지 말 것', CW / 2, 123, COL.orange, 11, 1, 'center');
    T('최고점수 ' + String(G.best).padStart(6, '0'), CW / 2, 140, COL.yellow, 11, 1, 'center');
    if (((G.anim * 2) | 0) % 2 === 0) T('ENTER - 출근하기', CW / 2, 176, COL.green, 11, 1, 'center');
  }

  function drawIntro() {
    dim(0.84);
    const f = G.floor;
    panel(30, 70, CW - 60, 86, COL.hudLine);
    T(f.name, CW / 2, 80, COL.navy, 14, 1, 'center');
    T(f.sub, CW / 2, 96, COL.gray, 11, 1, 'center');
    ctx.fillStyle = COL.hudLine; ctx.fillRect(44, 110, CW - 88, 1);
    T('사내 소문', CW / 2, 115, COL.orange, 9, 1, 'center');
    T(G.rumor, CW / 2, 127, COL.gray, 11, 1, 'center');
    T('서류 ' + G.quota + '장 · 상사 ' + G.bosses.length + '명', CW / 2, 141, COL.dim, 9, 1, 'center');
    if (G.stateTimer > 0.5 && ((G.anim * 2) | 0) % 2 === 0) T('아무 키나 눌러 시작', CW / 2, 166, COL.lime, 11, 1, 'center');
  }

  function drawCaught() {
    dim(0.62);
    T('들켰다!', CW / 2, 74, COL.red, 18, 1, 'center');
    const w = Math.max(TW(G.catchLine, 11), TW(G.catchName, 9)) + 20;
    panel(Math.round(CW / 2 - w / 2), 100, w, 32, COL.hudLine);
    T(G.catchName, CW / 2, 106, COL.orange, 9, 1, 'center');
    T('"' + G.catchLine + '"', CW / 2, 118, COL.navy, 11, 1, 'center');
    if (G.stateTimer > 0.9) T(G.lives > 0 ? '남은 기회 ' + G.lives : '더는 버틸 수 없다...', CW / 2, 146, COL.gray, 11, 1, 'center');
  }

  function drawClear() {
    dim(0.66);
    T('층 돌파!', CW / 2, 66, COL.green, 18, 1, 'center');
    T(G.floor.name + ' 탈출 성공', CW / 2, 92, COL.navy, 14, 1, 'center');
    T('클리어 보너스   +500', CW / 2, 110, COL.gray, 11, 1, 'center');
    T('시간 보너스     +' + G.lastBonus, CW / 2, 121, COL.gray, 11, 1, 'center');
    T('점수 ' + String(G.score).padStart(6, '0'), CW / 2, 138, COL.yellow, 11, 1, 'center');
    if (G.stateTimer > 1.2 && ((G.anim * 2) | 0) % 2 === 0) {
      const next = FLOORS[G.floorIdx].final ? '로비 탈출' : FLOORS[G.floorIdx + 1].name;
      T('ENTER - ' + next, CW / 2, 160, COL.cyan, 11, 1, 'center');
    }
  }

  function drawEnding() {
    sheetBackdrop();
    T('탈출 성공', CW / 2, 38, COL.green, 18, 1, 'center');
    T(nickName() + ' 님, 회전문을 넘었다. 오늘은 정시 퇴근이다.', CW / 2, 62, COL.navy, 11, 1, 'center');
    T('총 점수  ' + String(G.score).padStart(6, '0'), CW / 2, 82, COL.yellow, 14, 1, 'center');
    T('총 소요  ' + Math.floor(G.totalTime) + '초', CW / 2, 100, COL.gray, 11, 1, 'center');
    T('위장으로 속인 횟수  ' + G.dgWins + '회', CW / 2, 111, COL.lime, 11, 1, 'center');
    ctx.fillStyle = COL.hudLine; ctx.fillRect(60, 126, CW - 120, 1);
    T('하지만 내일도 출근이다', CW / 2, 131, COL.orange, 11, 1, 'center');
    if (G.stateTimer > 1.2 && ((G.anim * 2) | 0) % 2 === 0) T('ENTER - 야근 ' + (G.cycle + 1) + '회차', CW / 2, 148, COL.cyan, 11, 1, 'center');
    const fake = { x: CW / 2 + Math.sin(G.anim * 1.4) * 40, y: 240, dir: 'side', flip: Math.cos(G.anim * 1.4) < 0, frame: ((G.anim * 9) | 0) % 2 };
    drawShadowOval(fake.x, fake.y, 9);
    drawActor(SPR.player, fake);
  }

  function drawOver() {
    dim(0.78);
    T('야근 확정', CW / 2, 62, COL.red, 18, 1, 'center');
    T(nickName() + ' · 도달 층  ' + G.floor.name, CW / 2, 88, COL.navy, 11, 1, 'center');
    T('최종 점수  ' + String(G.score).padStart(6, '0'), CW / 2, 104, COL.yellow, 14, 1, 'center');
    T('최고 점수  ' + String(G.best).padStart(6, '0'), CW / 2, 122, COL.gray, 11, 1, 'center');
    if (G.stateTimer > 0.8 && ((G.anim * 2) | 0) % 2 === 0) T('ENTER - 다시 도전', CW / 2, 144, COL.green, 11, 1, 'center');
  }

  function drawPause() {
    dim(0.6);
    T('일시정지', CW / 2, 100, COL.navy, 14, 1, 'center');
    T('P 또는 ENTER 로 계속', CW / 2, 118, COL.gray, 11, 1, 'center');
    T('M - 음소거 전환', CW / 2, 129, COL.dim, 9, 1, 'center');
  }

  /* ---------------- 렌더 ---------------- */
  function renderWorld() {
    drawFloorLayer();
    for (let i = 0; i < G.bosses.length; i++) drawCone(G.bosses[i]);
    drawItems();

    const q = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = G.map[y][x];
        const fn = PROP_DRAW[t];
        if (!fn) continue;
        if (WIDE.indexOf(t) >= 0 && runOffset(x, y, t) !== 0) continue;
        q.push({ y: y * TILE + 15, fn: fn, px: x * TILE, py: y * TILE });
      }
    }
    q.push({ y: G.player.y, ent: 'p' });
    if (G.mate) q.push({ y: G.mate.y, ent: 'm' });
    for (let i = 0; i < G.bosses.length; i++) q.push({ y: G.bosses[i].y, ent: G.bosses[i] });
    q.sort(function (a, b) { return a.y - b.y; });
    for (let i = 0; i < q.length; i++) {
      const it = q[i];
      if (it.fn) it.fn(it.px, it.py);
      else if (it.ent === 'p') drawPlayer();
      else if (it.ent === 'm') drawMate();
      else drawBoss(it.ent);
    }
    drawParticles();

    if (G.msgTimer > 0 && G.state === 'play') {
      const a = Math.min(1, G.msgTimer / 0.4);
      const w = TW(G.msg, 11) + 10;
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(255,255,225,0.95)';
      ctx.fillRect(Math.round(VW / 2 - w / 2), VH - 20, w, 11);
      ctx.fillStyle = '#b3b3b3';
      ctx.fillRect(Math.round(VW / 2 - w / 2), VH - 20, w, 1);
      T(G.msg, VW / 2, VH - 18, '#3a3a2a', 11, 1, 'center');
      ctx.globalAlpha = 1;
    }
  }

  function render() {
    ctx.setTransform(K, 0, 0, K, 0, 0);
    ctx.clearRect(0, 0, CW, CH);

    if (G.state === 'title') { drawTitle(); return; }
    if (G.state === 'ending') { drawEnding(); return; }

    const sh = G.shake;
    const ox = sh > 0 ? Math.round((Math.random() - 0.5) * sh) : 0;
    const oy = sh > 0 ? Math.round((Math.random() - 0.5) * sh) : 0;

    ctx.save();
    ctx.translate(ox, HUD_H + oy);
    renderWorld();
    ctx.restore();

    if (G.alertLevel > 0.35 && G.state === 'play') {
      const a = (G.alertLevel - 0.35) * 0.5;
      ctx.strokeStyle = 'rgba(177,62,83,' + a.toFixed(3) + ')';
      ctx.lineWidth = 6;
      ctx.strokeRect(0, HUD_H, CW, VH);
      ctx.lineWidth = 1;
    }
    if (G.flash > 0) {
      ctx.globalAlpha = G.flash * 0.5;
      ctx.fillStyle = G.flashCol;
      ctx.fillRect(0, HUD_H, CW, VH);
      ctx.globalAlpha = 1;
    }

    drawHUD();

    if (G.state === 'intro') drawIntro();
    else if (G.state === 'caught') drawCaught();
    else if (G.state === 'clear') drawClear();
    else if (G.state === 'over') drawOver();
    else if (G.state === 'pause') drawPause();
  }

  /* ---------------- 화면 ---------------- */
  function resize() {
    const host = document.getElementById('sheetview');
    const hw = host ? host.clientWidth : window.innerWidth;
    const hh = host ? host.clientHeight : window.innerHeight;
    // 시트가 충분히 보이도록 캔버스는 화면의 일부만 차지한다.
    // 배율은 정수로만 — 도트 스프라이트와 픽셀 폰트가 흐려지지 않게.
    let scale = Math.min((hw * 0.70) / CW, (hh * 0.90) / CH);
    scale = Math.max(2, Math.floor(scale));
    SCALE = scale;
    const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    K = scale * dpr;

    const wrap = document.getElementById('wrap');
    wrap.style.width = CW * scale + 'px';
    wrap.style.height = CH * scale + 'px';
    cv.style.width = CW * scale + 'px';
    cv.style.height = CH * scale + 'px';
    if (cv.width !== CW * K || cv.height !== CH * K) {
      cv.width = CW * K;
      cv.height = CH * K;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(K, 0, 0, K, 0, 0);
    // 시트 셀을 게임 타일 격자에 물린다.
    // 열 너비 = 타일의 정수배, 행 높이 = 타일의 정수 분할 → 두 격자가 정확히 겹친다.
    if (window.Shell) {
      const tile = TILE * scale;
      const cw = tile < 48 ? tile * 2 : tile;
      let ch = tile / 2;
      while (ch > 28) ch /= 2;
      Shell.setCellSize(cw, ch);
      Shell.placeChart(CW * scale, CH * scale);
    }
  }
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);

  /* ---------------- 사원명 입력 / 결과 공유 오버레이 ---------------- */
  const elNickBox = document.getElementById('nickbox');
  const elNick = document.getElementById('nick');
  const elShareBox = document.getElementById('sharebox');
  const elShareBtn = document.getElementById('sharebtn');
  const elShareMsg = document.getElementById('sharemsg');

  function nickName() { return (G.nick || '').trim() || '이름없는 사원'; }

  if (elNick) {
    elNick.value = G.nick;
    elNick.addEventListener('input', function () {
      G.nick = elNick.value.replace(/\s+/g, ' ').slice(0, 8);
      try { localStorage.setItem('boss_escape_nick', G.nick); } catch (e) {}
    });
    // 입력 중에는 게임 키가 먹지 않도록 (WASD 로 캐릭터가 움직이면 곤란)
    elNick.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') { elNick.blur(); pressed.confirm = true; }
    });
  }

  /** 캔버스 논리좌표 (x, y) 를 화면 픽셀로 변환해 오버레이를 얹는다 */
  function placeOverlay(el, lx, ly, lw, lh, fontPx) {
    el.style.left = Math.round(lx * SCALE) + 'px';
    el.style.top = Math.round(ly * SCALE) + 'px';
    if (lw) el.style.width = Math.round(lw * SCALE) + 'px';
    if (lh) el.style.height = Math.round(lh * SCALE) + 'px';
    if (fontPx) el.style.fontSize = Math.round(fontPx * SCALE) + 'px';
  }

  let overState = '';
  function syncOverlay() {
    const s = G.state;
    const showNick = (s === 'title');
    const showShare = (s === 'over' || s === 'ending');

    if (elNickBox) {
      elNickBox.classList.toggle('on', showNick);
      if (showNick) {
        placeOverlay(elNickBox, CW / 2 - 32, 154, 64, 8);
        elNick.style.width = Math.round(64 * SCALE) + 'px';
        elNick.style.height = Math.round(8 * SCALE) + 'px';
        elNick.style.fontSize = Math.round(5 * SCALE) + 'px';
      }
    }
    if (elShareBox) {
      elShareBox.classList.toggle('on', showShare);
      if (showShare) {
        placeOverlay(elShareBox, CW / 2 - 40, s === 'over' ? 162 : 166, 80, 0);
        elShareBtn.style.height = Math.round(10 * SCALE) + 'px';
        elShareBtn.style.width = Math.round(80 * SCALE) + 'px';
        elShareBtn.style.fontSize = Math.round(5 * SCALE) + 'px';
        elShareMsg.style.fontSize = Math.round(4.5 * SCALE) + 'px';
      }
    }
    if (s !== overState) { overState = s; if (elShareMsg) elShareMsg.textContent = ''; }
  }

  function shareUrl() {
    // 캐시 무효화용 ?v= / ?r= 같은 쿼리스트링은 빼고 깨끗한 주소만 공유한다
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      return location.origin + location.pathname.replace(/index\.html$/, '');
    }
    return location.href.split(/[?#]/)[0];
  }

  function shareText() {
    const cleared = G.state === 'ending';
    return '[상사 피하기 · OFFICE ESCAPE]\n' +
      nickName() + ' — ' +
      (cleared ? '로비 탈출 성공! 정시 퇴근 쟁취' : G.floor.name + '에서 야근 확정') + '\n' +
      '최종 점수 ' + G.score.toLocaleString() + '점 (최고 ' + G.best.toLocaleString() + '점)\n' +
      '나도 퇴근해보기 → ' + shareUrl();
  }

  function toast(t) { if (elShareMsg) elShareMsg.textContent = t; }

  if (elShareBtn) {
    elShareBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const text = shareText();
      if (navigator.share) {
        navigator.share({ title: '상사 피하기 결과', text: text })
          .then(function () { toast('공유했습니다'); })
          .catch(function () { copyShare(text); });
      } else {
        copyShare(text);
      }
    });
  }

  function copyShare(text) {
    function done() { toast('결과를 복사했어요 · 카톡에 붙여넣기'); }
    function fail() { toast('복사 실패 — 직접 캡처해 주세요'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fail);
    } else {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      } catch (err) { fail(); }
    }
  }

  /* ---------------- 음소거 (상단 메뉴바에 상시 고정) ---------------- */
  const elMute = document.getElementById('mutebtn');
  const elMuteIco = document.getElementById('muteico');
  function syncMute() {
    if (!elMute) return;
    elMute.classList.toggle('off', !!Sfx.muted);
    elMuteIco.textContent = Sfx.muted ? '◂x' : '◂))';
    elMute.title = Sfx.muted ? '음소거 중 — 클릭하면 소리 켜짐 (M)' : '소리 켜짐 — 클릭하면 음소거 (M)';
  }
  function toggleMute() {
    Sfx.muted = !Sfx.muted;
    syncMute();
    if (G.state === 'play') setMsg(Sfx.muted ? '음소거' : '소리 켜짐', 1.0);
  }
  if (elMute) elMute.addEventListener('click', function (e) { e.preventDefault(); toggleMute(); });
  syncMute();

  let last = 0;
  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    update(dt);
    render();
    syncOverlay();
    clearPressed();
    requestAnimationFrame(frame);
  }

  function boot() {
    G.floor = FLOORS[0];
    G.map = FLOORS[0].map.map(function (r) { return r.split(''); });
    G.style = { tint: tintOf(FLOORS[0].tint) };
    resize();
    requestAnimationFrame(frame);
  }

  Txt.preload().then(boot);
})();
