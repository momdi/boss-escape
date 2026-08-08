/* ===========================================================
   냥밥 — 픽셀 스프라이트
   한 벌의 도형 + 팔레트 교체로 여러 품종을 만든다.
     .  투명      o  외곽선     m  기본 털     h  햇빛 하이라이트
     d  그늘      l  배·가슴     p  무늬        i  귀 안쪽
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
  cheese:   { o: '#6b4526', d: '#c07f3c', m: '#e3a55c', h: '#f5cd8b', l: '#fbeccd', p: '#bc7530', n: '#e0918f', i: '#dd968f', e: '#3b2a1e', w: '#ffffff' },
  mackerel: { o: '#494540', d: '#8d887e', m: '#b0aba0', h: '#d2ccc1', l: '#efe9dc', p: '#5d594f', n: '#d99a96', i: '#cf9a95', e: '#33302a', w: '#ffffff' },
  calico:   { o: '#6b4a34', d: '#ddd2bd', m: '#f7f0e2', h: '#ffffff', l: '#ffffff', p: '#cf7c33', n: '#e39a96', i: '#e6a9a2', e: '#3b2a1e', w: '#ffffff' },
  tuxedo:   { o: '#201d1a', d: '#332e28', m: '#4a423a', h: '#665b4e', l: '#f4eee1', p: '#2b2620', n: '#d99a96', i: '#b9847f', e: '#e8c76a', w: '#fff6d8' },
  white:    { o: '#a2937c', d: '#e6dcc7', m: '#f9f4e8', h: '#ffffff', l: '#ffffff', p: '#ebe1cc', n: '#e8a5a1', i: '#eaa9a4', e: '#4a4038', w: '#ffffff' },
  black:    { o: '#1c1917', d: '#2e2824', m: '#453c34', h: '#5d5145', l: '#6d5f52', p: '#332c26', n: '#b88a86', i: '#a97f7b', e: '#e2b95c', w: '#fff5cf' },
  smoke:    { o: '#414b55', d: '#7e8a96', m: '#9fabb6', h: '#c6ced6', l: '#e1e7ec', p: '#6b7681', n: '#cf9498', i: '#c99095', e: '#5e7f5b', w: '#f2fff2' },
  siam:     { o: '#6b5340', d: '#d8c9ab', m: '#f0e5cc', h: '#fdf7e8', l: '#fdf9ee', p: '#7a5f45', n: '#d99a96', i: '#d3a49c', e: '#66a0c4', w: '#eaf7ff' },
  fluff:    { o: '#6b4f34', d: '#cfa76c', m: '#ecc48d', h: '#fadfb4', l: '#fcefd6', p: '#bd8c4e', n: '#e0918f', i: '#dfa197', e: '#3b2a1e', w: '#ffffff' },
  golden:   { o: '#7a5716', d: '#d3a93f', m: '#efca6b', h: '#fbe6a4', l: '#fff5d3', p: '#b98f2c', n: '#dfa08e', i: '#dfa693', e: '#4a3a12', w: '#fffbe8' },
  ghost:    { o: '#93a5b3', d: '#cfdae2', m: '#eaf2f7', h: '#ffffff', l: '#ffffff', p: '#dae4ec', n: '#c9aecd', i: '#d0b6d4', e: '#7d93a6', w: '#ffffff' },
  king:     { o: '#43331f', d: '#7c5c3b', m: '#9c7550', h: '#bb9268', l: '#e6d6ba', p: '#664930', n: '#d99a96', i: '#c89a90', e: '#3b2a1e', w: '#ffffff' },
};

/* ================= 고양이 포즈 =================
   전부 오른쪽을 바라본다. 마지막 행이 바닥에 닿는다. */

/* --- 걷기 A (36 x 28) --- */
const CAT_WALK_A = [
  '.....ooo............................',
  '....ommo............................',
  '....ommo............................',
  '...ommdo............................',
  '...ommdo...............oo.....oo....',
  '...ommdo..............oiio...oiio...',
  '...ommdo.............oiiiio.oiiiio..',
  '...ommdo............oimmmiooimmmmio.',
  '...ommdo...........ommmmmmmmmmmmmmo.',
  '...ommmo..........ommmmmmmmmmmmmmmmo',
  '....ommooooooo....ommhmmmmmmmmmhmmmo',
  '....ommmmmmmmmoooommmmmmmmmmmmmmmmmo',
  '....ohhmmmmmmmmmmmdmmmmmmmmmmmmmmmmo',
  '....ommmmmmmmmmmmmdmmoweommmoweommmo',
  '....ommmmmmmmmmmmmmmmoeeommmoeeommmo',
  '....ommmmmmmmmmmmmmmmmmmmmmmmmmmmmmo',
  '....ommmmmmmmmmmmmmmmmmmmnnmmmmmmmmo',
  '....ommmmmmmmmmmmmmmmmmmmnnmmmmmmmo.',
  '....ommmmmmmmmmmmmmmmmmmmmmmmmmmmo..',
  '....olmmmmmmmmmmmmmmmmmmmmmmmmmmoo..',
  '....ollllmmmmmmmmmmmmmmmmmmmmmmoo...',
  '.....ollllllllllllllllllllllllloo...',
  '......omdo..omdo...omdo..omdo.......',
  '......ommo..ommo...ommo..ommo.......',
  '......ommo..ommo...ommo..ommo.......',
  '......ommo..ommo...ommo..ommo.......',
  '......ollo..ollo...ollo..ollo.......',
  '......oooo..oooo...oooo..oooo.......',
];

/* --- 걷기 B (다리 교차 · 꼬리 살짝 내림) --- */
const CAT_WALK_B = [
  '....................................',
  '.....ooo............................',
  '....ommo............................',
  '....ommo............................',
  '...ommdo...............oo.....oo....',
  '...ommdo..............oiio...oiio...',
  '...ommdo.............oiiiio.oiiiio..',
  '...ommdo............oimmmiooimmmmio.',
  '...ommdo...........ommmmmmmmmmmmmmo.',
  '...ommmo..........ommmmmmmmmmmmmmmmo',
  '....ommooooooo....ommhmmmmmmmmmhmmmo',
  '....ommmmmmmmmoooommmmmmmmmmmmmmmmmo',
  '....ohhmmmmmmmmmmmdmmmmmmmmmmmmmmmmo',
  '....ommmmmmmmmmmmmdmmoweommmoweommmo',
  '....ommmmmmmmmmmmmmmmoeeommmoeeommmo',
  '....ommmmmmmmmmmmmmmmmmmmmmmmmmmmmmo',
  '....ommmmmmmmmmmmmmmmmmmmnnmmmmmmmmo',
  '....ommmmmmmmmmmmmmmmmmmmnnmmmmmmmo.',
  '....ommmmmmmmmmmmmmmmmmmmmmmmmmmmo..',
  '....olmmmmmmmmmmmmmmmmmmmmmmmmmmoo..',
  '....ollllmmmmmmmmmmmmmmmmmmmmmmoo...',
  '.....ollllllllllllllllllllllllloo...',
  '.....omdo....omdo.omdo.....omdo.....',
  '.....ommo....ommo.ommo.....ommo.....',
  '.....ommo....ommo.ommo.....ommo.....',
  '.....ommo....ommo.ommo.....ommo.....',
  '.....ollo....ollo.ollo.....ollo.....',
  '.....oooo....oooo.oooo.....oooo.....',
];

/* --- 앉기 (22 x 30) --- */
const CAT_SIT = [
  '.....oo.....oo........',
  '....oiio...oiio.......',
  '...oiiiio.oiiiio......',
  '..oimmmioimmmmmio.....',
  '.ommmmmmmmmmmmmmmo....',
  '.ommmmmmmmmmmmmmmmo...',
  '.ohhmmmmmmmmmhmmmmo...',
  '.ommmmmmmmmmmmmmmmo...',
  '.ommoweommmoweommmo...',
  '.ommoeeommmoeeommmo...',
  '.ommmmmmmmmmmmmmmmo...',
  '.ommmmmmmnnmmmmmmmo...',
  '..ommmmmmnnmmmmmmo....',
  '...ommmmmmmmmmmmo.....',
  '..ommmmmmmmmmmmmmo....',
  '.ommmmmmmmmmmmmmmmo...',
  '.ommmmmmmmmmmmmmmmmo..',
  'ommmmmmmmmmmmmmmmmmo..',
  'ommmmmmmmmmmmmmmlllo..',
  'ommmmmmmmmmmmmmmlllo..',
  'ommmmmmmmmmmmmmmlllo..',
  'ommmmmmmmmmmmmmmlllo..',
  'ommmmmmmmmmmmmmmlllo..',
  'ommmmmmmmmmmmmmmlllo..',
  'ommmmmmmmmmmmmmmlllo..',
  'ommmmmmmmmmmmmmmlllo..',
  'ommmmmmmmmmmmmmmlllo..',
  'ommmmmmmmommmmmmlllo..',
  'oddddddddoollllllllo..',
  '.oooooooo..ooooooooo..',
];

/* --- 밥 먹기 A (고개 숙임, 36 x 28) --- */
const CAT_EAT_A = [
  '.....ooo............................',
  '....ommo............................',
  '....ommo............................',
  '...ommdo............................',
  '...ommdo............................',
  '...ommdo............................',
  '...ommdo............................',
  '...ommdo............................',
  '...ommmo............................',
  '....ommooooooo......oo.......oo.....',
  '....ommmmmmmmmoo...oiio.....oiio....',
  '....ohhmmmmmmmmmoo.oiiiio..oiiiio...',
  '....ommmmmmmmmmmmmoiimmmioimmmmmio..',
  '....ommmmmmmmmmmmmmmmmmmmmmmmmmmmo..',
  '....ommmmmmmmmmmmmmmhmmmmmmmmmhmmmo.',
  '....ommmmmmmmmmmmmmmmmmmmmmmmmmmmmo.',
  '....ommmmmmmmmmmmmmmoweommmoweommmmo',
  '....olmmmmmmmmmmmmmmoeeommmoeeommmmo',
  '....ollllmmmmmmmmmmmmmmmmmmmmmmmmmmo',
  '.....ollllllllllmmmmmmmmnnmmmmmmmmmo',
  '......omdo..omdommmmmmmmnnmmmmmmmmo.',
  '......ommo..ommommmmmmmmmmmmmmmmmo..',
  '......ommo..ommommmmmmmmmmmmmmmmo...',
  '......ommo..ommommmmmmmmmmmmmmoo....',
  '......ommo..ommoommmmmmmmmmmoo......',
  '......ollo..ollo.oooooooooooo.......',
  '......oooo..oooo....................',
  '....................................',
];

/* --- 밥 먹기 B (한 입 더) --- */
const CAT_EAT_B = [
  '....................................',
  '.....ooo............................',
  '....ommo............................',
  '....ommo............................',
  '...ommdo............................',
  '...ommdo............................',
  '...ommdo............................',
  '...ommdo............................',
  '...ommmo............................',
  '....ommooooooo......................',
  '....ommmmmmmmmoo....oo.......oo.....',
  '....ohhmmmmmmmmmoo.oiio.....oiio....',
  '....ommmmmmmmmmmmmoiiiio..oiiiio....',
  '....ommmmmmmmmmmmmmimmmioimmmmmio...',
  '....ommmmmmmmmmmmmmmmmmmmmmmmmmmmo..',
  '....ommmmmmmmmmmmmmmhmmmmmmmmmhmmmo.',
  '....olmmmmmmmmmmmmmmmmmmmmmmmmmmmmo.',
  '....ollllmmmmmmmmmmmmoweommmoweommmo',
  '.....ollllllllllmmmmmmoeeommmoeeommo',
  '......omdo..omdommmmmmmmmmmmmmmmmmmo',
  '......ommo..ommommmmmmmmnnmmmmmmmmo.',
  '......ommo..ommommmmmmmmnnmmmmmmmo..',
  '......ommo..ommommmmmmmmmmmmmmmmo...',
  '......ommo..ommommmmmmmmmmmmmmoo....',
  '......ollo..ollooommmmmmmmmmoo......',
  '......oooo..oooo..oooooooooo........',
  '....................................',
  '....................................',
];

/* --- 식빵 자세 (32 x 19) --- */
const CAT_LOAF = [
  '.................oo.....oo......',
  '................oiio...oiio.....',
  '...............oiiiio.oiiiio....',
  '..............oimmmioimmmmmio...',
  '........ooooooommmmmmmmmmmmmmo..',
  '.....ooohmmmmmmmmmmmmmmmmmmmmo..',
  '...oohmmmmmmmmmmmmmmmmmmmmmmmmo.',
  '..ommmmmmmmmmmmmmoweommmoweommo.',
  '.ommmmmmmmmmmmmmmoeeommmoeeommmo',
  'ommmmmmmmmmmmmmmmmmmmmmmmmmmmmmo',
  'ommmmmmmmmmmmmmmmmmmmnnmmmmmmmmo',
  'ommmmmmmmmmmmmmmmmmmmnnmmmmmmmo.',
  'ommmmmmmmmmmmmmmmmmmmmmmmmmmmo..',
  'ommmmmmmmmmmmmmmmmmmmmmmmmmmoo..',
  '.ommmmmmmmmmmmmmmmmmmmmmmmmmo...',
  '.ommmmmmmmmmmmmmmmmmmmmmmmmmo...',
  '.olllllllllllllllllllllllllllo..',
  '..oooooooooooooooooooooooooooo..',
  '................................',
];

/* --- 도감용 정면 얼굴 (26 x 22) --- */
const CAT_PORTRAIT = [
  '...ooo..............ooo...',
  '..oiiio............oiiio..',
  '..oiiiio..........oiiiio..',
  '..oimmiio........oiimmio..',
  '..ommmmiiooooooooiimmmmo..',
  '..ommmmmmmmmmmmmmmmmmmmo..',
  '.ommmmmmmmmmmmmmmmmmmmmmo.',
  '.ommhhmmmmmmmmmmmmmmhhmmo.',
  '.ommmmmmmmmmmmmmmmmmmmmmo.',
  'ommmmoweommmmmmmmoweommmmo',
  'ommmmoeeommmmmmmmoeeommmmo',
  'ommmmmmmmmmmmmmmmmmmmmmmmo',
  'ommmmmmmmmmmnnmmmmmmmmmmmo',
  'ommmmmmmmmmmnnmmmmmmmmmmmo',
  '.ommmmmmmmmllllmmmmmmmmmo.',
  '.ommmmmmmmllllllmmmmmmmmo.',
  '..ommmmmmmmllllmmmmmmmmo..',
  '..ommmmmmmmmmmmmmmmmmmmo..',
  '...oommmmmmmmmmmmmmmmoo...',
  '.....oommmmmmmmmmmmoo.....',
  '.......ooooooooooooo......',
];

const CAT_POSES = {
  sit: CAT_SIT,
  walkA: CAT_WALK_A,
  walkB: CAT_WALK_B,
  eatA: CAT_EAT_A,
  eatB: CAT_EAT_B,
  loaf: CAT_LOAF,
  portrait: CAT_PORTRAIT,
};

/* 포즈 방향: side(옆모습) / up(앉은 정면) / face(도감 얼굴) */
const POSE_ORIENT = {
  sit: 'up', portrait: 'face',
  walkA: 'side', walkB: 'side', eatA: 'side', eatB: 'side', loaf: 'side',
};

/* 품종별 무늬 규칙: 어떤 좌표에 p(무늬)를 덧칠할지 (방향별로 분리) */
const CAT_MARK = {
  /* 등·꼬리 줄무늬 */
  stripe: {
    side: function (x, y, w, h) {
      if (y < h * 0.16 || y > h * 0.72) return false;
      return ((x + Math.floor(y / 3)) % 7) < 2 && x > w * 0.12 && x < w * 0.62;
    },
    up: function (x, y, w, h) {
      if (y < h * 0.52 || y > h * 0.94) return false;
      return ((y + Math.floor(x / 4)) % 6) < 2 && x > w * 0.05 && x < w * 0.88;
    },
    face: function (x, y, w, h) {
      if (y > h * 0.26) return false;
      return ((x + Math.floor(y / 2)) % 6) < 2 && x > w * 0.14 && x < w * 0.86;
    },
  },
  /* 큰 얼룩 두 덩이 */
  patch: {
    side: function (x, y, w, h) {
      const inA = Math.pow((x - w * 0.28) / (w * 0.16), 2) + Math.pow((y - h * 0.5) / (h * 0.2), 2) < 1;
      const inB = Math.pow((x - w * 0.58) / (w * 0.13), 2) + Math.pow((y - h * 0.42) / (h * 0.17), 2) < 1;
      return inA || inB;
    },
    up: function (x, y, w, h) {
      const inA = Math.pow((x - w * 0.26) / (w * 0.22), 2) + Math.pow((y - h * 0.70) / (h * 0.14), 2) < 1;
      const inB = Math.pow((x - w * 0.70) / (w * 0.16), 2) + Math.pow((y - h * 0.56) / (h * 0.10), 2) < 1;
      return inA || inB;
    },
    face: function (x, y, w, h) {
      return Math.pow((x - w * 0.20) / (w * 0.20), 2) + Math.pow((y - h * 0.22) / (h * 0.22), 2) < 1;
    },
  },
  /* 등·머리만 진한 색 (샴) */
  cape: {
    side: function (x, y, w, h) { return y < h * 0.46 && x > w * 0.1; },
    up:   function (x, y, w, h) { return y < h * 0.42; },
    face: function (x, y, w, h) { return y < h * 0.30; },
  },
  none: null,
};

const CAT_MARK_BY_BREED = {
  cheese: 'stripe',
  mackerel: 'stripe',
  calico: 'patch',
  tuxedo: 'none',
  white: 'none',
  black: 'none',
  smoke: 'stripe',
  siam: 'cape',
  fluff: 'patch',
  golden: 'none',
  ghost: 'none',
  king: 'stripe',
};

const _catCache = {};

/** 무늬를 입힌 포즈 그리드를 만든다 */
function markRows(rows, mark) {
  if (!mark) return rows;
  const h = rows.length;
  const w = rows.reduce(function (a, r) { return Math.max(a, r.length); }, 0);
  return rows.map(function (row, y) {
    let out = '';
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      out += (ch === 'm' || ch === 'h') && mark(x, y, w, h) ? 'p' : ch;
    }
    return out;
  });
}

/** 품종 스프라이트 세트 (캐시) */
function catSprites(breed) {
  if (_catCache[breed]) return _catCache[breed];
  const base = CAT_PAL[breed] || CAT_PAL.cheese;
  const pal = Object.assign({ '.': null }, base);
  const markSet = CAT_MARK[CAT_MARK_BY_BREED[breed] || 'none'];
  const set = {};
  for (const k in CAT_POSES) {
    const fn = markSet ? markSet[POSE_ORIENT[k] || 'side'] : null;
    set[k] = makeSprite(markRows(CAT_POSES[k], fn), pal);
  }
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
  '..oBBBBBpBBppBBBBBBBBo..',
  '..obBBBBppBppBBBBBBBbo..',
  '...obbBBBBBBBBBBBBbbo...',
  '....oobbbbbbbbbbbboo....',
  '......oooooooooooo......',
];

const BOWL_PAL = {
  bowl_basic:   { o: '#5c4a37', B: '#efe4cc', b: '#cfbf9f', l: '#8f7c62', k: '#f7efdd', p: '#e0d2b6' },
  bowl_ceramic: { o: '#4a4335', B: '#fdf8ee', b: '#ddd2ba', l: '#9c8d75', k: '#ffffff', p: '#ebe2d2' },
  bowl_wood:    { o: '#4a3524', B: '#c1955c', b: '#98703d', l: '#6d5030', k: '#dcb684', p: '#ad8149' },
  bowl_gold:    { o: '#4d3b12', B: '#f4e8c2', b: '#cdb47c', l: '#8f7a45', k: '#e0bb56', p: '#e2d3a4' },
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
  '.oo.',
  'omho',
  'ommo',
  '.oo.',
], { '.': null, o: '#6b4a2a', m: '#a9713c', h: '#c48f56' });

const KIBBLE_SPECIAL = makeSprite([
  '.oo.',
  'owho',
  'ommo',
  '.oo.',
], { '.': null, o: '#8a6a1e', m: '#e0b64a', h: '#f0d075', w: '#fff2c0' });

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
  t: '#e8909c',
  k: '#e3c187',
  b: '#e28361',
};

/* 츄르 튜브 (색만 다른 3종) */
function churuShape(c) {
  return [
    '...oo...',
    '..o' + c + c + 'o..',
    '.o' + c + c + c + c + 'o.',
    'o' + c + 'w' + c + c + c + c + 'o',
    'o' + c + c + c + c + c + c + 'o',
    'o' + c + c + c + c + c + c + 'o',
    'o' + c + c + c + c + c + c + 'o',
    '.oooooo.',
  ];
}

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
  gift_churu_tuna: churuShape('t'),
  gift_churu_chicken: churuShape('k'),
  gift_churu_crab: churuShape('b'),
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
