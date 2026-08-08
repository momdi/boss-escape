/* ===========================================================
   냥밥 — 픽셀 스프라이트
   한 벌의 도형 + 팔레트 교체로 여러 품종을 만든다.
     .  투명      o  외곽선     m  기본 털
     d  그늘      l  밝은 배     p  무늬(줄무늬/점박이)
     n  코        e  눈         w  눈 하이라이트
   =========================================================== */

function makeSprite(rows, pal) {
  const w = rows.reduce(function (a, r) { return Math.max(a, r.length); }, 0);
  const h = rows.length;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const col = pal[row[x]];
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(x, y, 1, 1);
    }
  }
  return { canvas: cv, w: w, h: h };
}

/* ================= 고양이 팔레트 ================= */

const CAT_PAL = {
  cheese:   { o: '#4a3327', m: '#d99f57', d: '#b57837', l: '#f7e9d1', p: '#a9642c', n: '#d98e8e', e: '#3b2a22', w: '#fffaf0' },
  mackerel: { o: '#3c3831', m: '#b8afa1', d: '#8d8477', l: '#f2ebdf', p: '#5e574c', n: '#d98e8e', e: '#2e2a24', w: '#fffaf0' },
  white:    { o: '#8c7f6c', m: '#f7f2e7', d: '#ddd3bf', l: '#ffffff', p: '#e6dcc7', n: '#e9a0a0', e: '#3b342c', w: '#ffffff' },
  black:    { o: '#221e1b', m: '#4e453d', d: '#332c27', l: '#6d6158', p: '#3a332d', n: '#b78585', e: '#e0b558', w: '#fff2c8' },
  calico:   { o: '#4a3327', m: '#f5ead8', d: '#ded0b4', l: '#ffffff', p: '#c87f3c', n: '#d98e8e', e: '#3b2a22', w: '#fffaf0' },
  tuxedo:   { o: '#26221e', m: '#403830', d: '#2b2621', l: '#f3ecdf', p: '#332d27', n: '#d98e8e', e: '#3b342c', w: '#fffaf0' },
  smoke:    { o: '#3d4650', m: '#93a1ad', d: '#6e7a86', l: '#d3dae0', p: '#7b8894', n: '#c9909a', e: '#5c7a58', w: '#f0fff0' },
  siam:     { o: '#4a3b2c', m: '#ece0c8', d: '#d2c3a6', l: '#fdf6e6', p: '#6b5240', n: '#d98e8e', e: '#5f8fb0', w: '#eaf6ff' },
  fluff:    { o: '#54402c', m: '#e6c08a', d: '#c69c63', l: '#fbf0da', p: '#b07f45', n: '#d98e8e', e: '#3b2a22', w: '#fffaf0' },
  golden:   { o: '#5a4218', m: '#e8c268', d: '#c39a37', l: '#fff3ce', p: '#a97d21', n: '#d9a08e', e: '#4a3a12', w: '#fffbe8' },
  ghost:    { o: '#9aa8b4', m: '#e8f0f5', d: '#cdd9e2', l: '#ffffff', p: '#dbe6ee', n: '#c3a8c8', e: '#7e93a5', w: '#ffffff' },
  king:     { o: '#3b2f26', m: '#8a6b4a', d: '#6b5138', l: '#e8d7bc', p: '#5c4530', n: '#d98e8e', e: '#3b2a22', w: '#fffaf0' },
};

/* ================= 고양이 포즈 ================= */
/* 오른쪽을 보는 옆모습. 발끝이 마지막 행. */

const CAT_SIT = [
  '..........oo....oo....',
  '.........ommo..ommo...',
  '........ommmoommmmo...',
  '........ommmmmmmmmmo..',
  '.......ommmmmmmmmmmmo.',
  '.......ommpmmmmpmmmmo.',
  '.......ommemmmmemmmmo.',
  '.......ommmmmmmmmmmmo.',
  '.......ommmmnnmmmmmmo.',
  '........ommmmmmmmmmo..',
  '......oooommmmmmmmmo..',
  '.....ommmmmpmmmpmmmmo.',
  'oo...ommmmmpmmmpmmmmo.',
  'omdo.ommmmmmmmmmmmmmo.',
  'omdo.ommmmpmmmpmmmmmo.',
  'omdo.ommmmpmmmpmmmllo.',
  'omddoommmmmmmmmmmmllo.',
  '.omdmmmmmmmmmmmmmmllo.',
  '.ommmmmmmmmmmmmmmmllo.',
  '..oooooooooooooooooo..',
];

const CAT_STAND_A = [
  '..........oo....oo....',
  '.........ommo..ommo...',
  '........ommmoommmmo...',
  '........ommmmmmmmmmo..',
  '.......ommmmmmmmmmmmo.',
  '.......ommemmmmemmmmo.',
  '.......ommmmmmmmmmmmo.',
  '.......ommmmnnmmmmmmo.',
  '.oo...oommmmmmmmmmmo..',
  'omdo.ommmmmmmmmmmmmo..',
  'omdooommmmpmmmpmmmmmo.',
  '.ommmmmmmpmmmpmmmmmmo.',
  '.ommmmmmmmmmmmmmmmmo..',
  '..ommmmmmmmmmmmmmmo...',
  '..omo..omo...omo.omo..',
  '..omo..omo...omo.omo..',
  '..omo..omo...omo.omo..',
  '..ooo..ooo...ooo.ooo..',
];

const CAT_STAND_B = [
  '..........oo....oo....',
  '.........ommo..ommo...',
  '........ommmoommmmo...',
  '........ommmmmmmmmmo..',
  '.......ommmmmmmmmmmmo.',
  '.......ommemmmmemmmmo.',
  '.......ommmmmmmmmmmmo.',
  '.......ommmmnnmmmmmmo.',
  'oo....oommmmmmmmmmmo..',
  'omdo.ommmmmmmmmmmmmo..',
  'omddoommmmpmmmpmmmmmo.',
  '.ommmmmmmpmmmpmmmmmmo.',
  '.ommmmmmmmmmmmmmmmmo..',
  '..ommmmmmmmmmmmmmmo...',
  '..omo...omo.omo..omo..',
  '..omo...omo.omo..omo..',
  '..omo...omo.omo..omo..',
  '..ooo...ooo.ooo..ooo..',
];

const CAT_EAT_A = [
  '......................',
  '.oo...ooooooooo.......',
  'omdo.ommmmmmmmmmoo....',
  'omdooommmmpmmmmmmmo...',
  '.ommmmmmmpmmmmmmmmoo..',
  '.ommmmmmmmmmmmmmmmmmo.',
  '..ommmmmmmmmmmmoo.oo..',
  '..ommmmmmmmmmmmommmmo.',
  '..ommmmmmmmmmmmmmmmmmo',
  '..ommmmmmmmmmmmemmmmmo',
  '..omo..omo..ommmmmmmmo',
  '..omo..omo..ommmmmmmmo',
  '..omo..omo..ommmnnmmmo',
  '..omo..omo..ommmmmmmmo',
  '..ooo..ooo...oooooooo.',
];

const CAT_EAT_B = [
  '......................',
  '.oo...ooooooooo.......',
  'omdo.ommmmmmmmmmoo....',
  'omdooommmmpmmmmmmmo...',
  '.ommmmmmmpmmmmmmmmoo..',
  '.ommmmmmmmmmmmmmmmmmo.',
  '..ommmmmmmmmmmmmmoooo.',
  '..ommmmmmmmmmmmmoo.oo.',
  '..ommmmmmmmmmmmommmmmo',
  '..ommmmmmmmmmmmmmmmmmo',
  '..omo..omo..ommemmmmmo',
  '..omo..omo..ommmmmmmmo',
  '..omo..omo..ommmnnmmmo',
  '..omo..omo..ommmmmmmmo',
  '..ooo..ooo...oooooooo.',
];

const CAT_LOAF = [
  '......................',
  '..............oo..oo..',
  '.............ommooommo',
  '....ooooooooommmmmmmmo',
  '..oommmmmmmmmmmmmmmmmo',
  '.ommmmmpmmmmmmmmmmmmmo',
  'ommmmmpmmmmmmemmmemmmo',
  'ommmmmmmmmmmmmmmmmmmmo',
  'ommmmpmmmmmmmmmnnmmmmo',
  'ommmmpmmmmmmmmmmmmmmmo',
  '.ommmmmmmmmmmmmmmmmmo.',
  '..ollmmmmmmmmmmmmmllo.',
  '...oooooooooooooooooo.',
];

const CAT_PORTRAIT = [
  '..oo..........oo..',
  '.ommo........ommo.',
  '.ommmo......ommmo.',
  '.ommmmoooooommmmo.',
  '.ommmmmmmmmmmmmmo.',
  '.ommpmmmmmmmmpmmo.',
  'ommmmmmmmmmmmmmmmo',
  'ommmemmmmmmmmemmmo',
  'ommmmmmmmmmmmmmmmo',
  'ommmmmmmnnmmmmmmmo',
  'ommmmmmllllmmmmmmo',
  '.ommmmllllllmmmmo.',
  '..ommmmllllmmmmo..',
  '...oommmmmmmmoo...',
  '.....oooooooo.....',
];

const CAT_POSES = {
  sit: CAT_SIT,
  walkA: CAT_STAND_A,
  walkB: CAT_STAND_B,
  eatA: CAT_EAT_A,
  eatB: CAT_EAT_B,
  loaf: CAT_LOAF,
  portrait: CAT_PORTRAIT,
};

const _catCache = {};

/** 품종 스프라이트 세트 (캐시) */
function catSprites(breed) {
  if (_catCache[breed]) return _catCache[breed];
  const base = CAT_PAL[breed] || CAT_PAL.cheese;
  const pal = Object.assign({ '.': null }, base);
  const set = {};
  for (const k in CAT_POSES) set[k] = makeSprite(CAT_POSES[k], pal);
  _catCache[breed] = set;
  return set;
}

/* ================= 밥그릇 ================= */

const BOWL_SHAPE = [
  '....oooooooooooooooo....',
  '..ooollllllllllllllooo..',
  '..okkllllllllllllllkko..',
  '.okkkkkkkkkkkkkkkkkkkko.',
  '.oBBBBBBBBBBBBBBBBBBBBo.',
  '.oBBBBBBBBBBBBBBBBBBBBo.',
  '..oBBBBBBBBBBBBBBBBBBo..',
  '..obBBBBBBBBBBBBBBBBbo..',
  '...obbBBBBBBBBBBBBbbo...',
  '....oobbbbbbbbbbbboo....',
  '......oooooooooooo......',
];

const BOWL_PAL = {
  bowl_basic:   { o: '#5c4a37', B: '#efe4cc', b: '#cfbf9f', l: '#8f7c62', k: '#f7efdd' },
  bowl_ceramic: { o: '#4a4335', B: '#fdf8ee', b: '#ddd2ba', l: '#9c8d75', k: '#ffffff' },
  bowl_wood:    { o: '#4a3524', B: '#c1955c', b: '#98703d', l: '#6d5030', k: '#dcb684' },
  bowl_gold:    { o: '#4d3b12', B: '#f4e8c2', b: '#cdb47c', l: '#8f7a45', k: '#e0bb56' },
};

const _bowlCache = {};
function bowlSprite(id) {
  if (_bowlCache[id]) return _bowlCache[id];
  const pal = Object.assign({ '.': null }, BOWL_PAL[id] || BOWL_PAL.bowl_basic);
  const s = makeSprite(BOWL_SHAPE, pal);
  _bowlCache[id] = s;
  return s;
}

/* ================= 밥알 ================= */

const KIBBLE = makeSprite([
  'oooo',
  'ommo',
  'ommo',
  'oooo',
], { '.': null, o: '#6b4a2a', m: '#a9713c' });

const KIBBLE_SPECIAL = makeSprite([
  'oooo',
  'omwo',
  'ommo',
  'oooo',
], { '.': null, o: '#8a6a1e', m: '#e0b64a', w: '#fff2c0' });

/* 밥그릇 안쪽(BOWL_SHAPE 좌표계)에 밥알이 쌓이는 자리 */
const KIBBLE_SPOTS = [
  [10, 1], [6, 1], [14, 1], [3, 1], [17, 1],
  [8, -1], [12, -1], [5, -2], [15, -2], [10, -3],
];

/* ================= 선물 / 아이템 ================= */

const GIFT_PAL = {
  '.': null,
  o: '#4a4038',
  m: '#c68b7c',
  d: '#a56a5c',
  l: '#f2e2d8',
  s: '#cfc8ba',
  r: '#a9714a',
  y: '#d8b451',
  g: '#7f9a6a',
  w: '#f6f0e4',
};

const GIFT_SHAPES = {
  gift_yarn: [
    '..oooo..',
    '.ommmmo.',
    'ommdmmmo',
    'ommmdmmo',
    'ommdmmmo',
    'ommmdmmo',
    '.ommmmo.',
    '..oooo..',
  ],
  gift_can: [
    '........',
    '.oooooo.',
    'osssssso',
    'orwrwrwo',
    'orwrwrwo',
    'osssssso',
    '.oooooo.',
    '........',
  ],
  gift_matatabi: [
    '...gg...',
    '..gggg..',
    '.gg.ggg.',
    'gg...gg.',
    '..o.gg..',
    '..o.....',
    '..o.....',
    '..ooo...',
  ],
  gift_cushion: [
    '........',
    '.oooooo.',
    'ommmmmmo',
    'omllllmo',
    'omllllmo',
    'ommmmmmo',
    '.oooooo.',
    '........',
  ],
  item_bell: [
    '...oo...',
    '..oyyo..',
    '.oyyyyo.',
    'oyyyyyyo',
    'oyywwyyo',
    'oooooooo',
    '..oyyo..',
    '...oo...',
  ],
};

const _giftCache = {};
function giftSprite(id) {
  if (_giftCache[id]) return _giftCache[id];
  const shape = GIFT_SHAPES[id] || GIFT_SHAPES.gift_yarn;
  const s = makeSprite(shape, GIFT_PAL);
  _giftCache[id] = s;
  return s;
}

/* ================= 유틸 ================= */

/** 스프라이트를 배율 정수배로 캔버스 엘리먼트에 그린다 */
function paintSprite(cv, sprite, scale, dx, dy) {
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.drawImage(
    sprite.canvas,
    Math.round(dx || 0),
    Math.round(dy || 0),
    sprite.w * scale,
    sprite.h * scale
  );
}

/** 스프라이트 하나를 담은 canvas 엘리먼트를 만든다 */
function spriteEl(sprite, cssSize) {
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const px = Math.round(cssSize * dpr);
  const scale = Math.max(1, Math.floor(px / Math.max(sprite.w, sprite.h)));
  const cv = document.createElement('canvas');
  cv.width = px;
  cv.height = px;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  const w = sprite.w * scale;
  const h = sprite.h * scale;
  c.drawImage(sprite.canvas, Math.round((px - w) / 2), Math.round((px - h) / 2), w, h);
  cv.style.width = cssSize + 'px';
  cv.style.height = cssSize + 'px';
  return cv;
}

/** 밥그릇 + 밥알이 담긴 아이콘 캔버스 */
function bowlIconEl(bowlId, grains, cssSize) {
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const px = Math.round(cssSize * dpr);
  const bowl = bowlSprite(bowlId);
  const scale = Math.max(1, Math.floor(px / bowl.w));
  const cv = document.createElement('canvas');
  cv.width = px;
  cv.height = px;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  const bw = bowl.w * scale;
  const bh = bowl.h * scale;
  const ox = Math.round((px - bw) / 2);
  const oy = Math.round((px - bh) / 2) + Math.round(scale * 2);
  c.drawImage(bowl.canvas, ox, oy, bw, bh);
  const n = Math.min(KIBBLE_SPOTS.length, grains || 0);
  for (let i = 0; i < n; i++) {
    const s = KIBBLE_SPOTS[i];
    c.drawImage(KIBBLE.canvas, ox + s[0] * scale, oy + s[1] * scale, KIBBLE.w * scale, KIBBLE.h * scale);
  }
  cv.style.width = cssSize + 'px';
  cv.style.height = cssSize + 'px';
  return cv;
}
