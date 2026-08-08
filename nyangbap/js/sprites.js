/* ===========================================================
   츄두리스트 — 스프라이트
   고양이: 마스터 시트(Cat.jpeg)에서 추출한 이미지 스프라이트.
           전부 왼쪽을 바라본다 (scene에서 방향에 따라 뒤집는다).
   밥그릇·선물: 픽셀 도트 (makeSprite)
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

/* ================= 고양이 이미지 스프라이트 ================= */

/* 그림 파일을 교체하면 이 숫자를 올린다 (브라우저 캐시 무효화) */
const IMG_VER = 4;

/* 품종 → 시트 에셋 (stand: 서있기 / loaf: 식빵, 없으면 stand 사용) */
const CAT_ASSETS = {
  cheese:   { stand: ['img/cats/cheese_stand.png', 193, 168], loaf: ['img/cats/cheese_loaf.png', 175, 113], sameScale: true, sizeMul: 0.782 },
  mackerel: { stand: ['img/cats/tb_stand.png', 97, 86], loaf: ['img/cats/tb_loaf.png', 94, 65], sameScale: true, sizeMul: 1.539 },
  calico:   { stand: ['img/cats/cc_stand.png', 204, 175], loaf: ['img/cats/cc_loaf.png', 165, 121], sameScale: true, sizeMul: 0.730 },
  siam:     { stand: ['img/cats/siam_stand.png', 193, 168], loaf: ['img/cats/siam_loaf.png', 174, 113], sameScale: true, sizeMul: 0.783 },
  smoke:    { stand: ['img/cats/smoke_stand.png', 97, 86], loaf: ['img/cats/smoke_loaf.png', 95, 65], sameScale: true, sizeMul: 1.519 },
  black:    { stand: ['img/cats/black_stand.png', 97, 86], loaf: ['img/cats/black_loaf.png', 95, 65], sameScale: true, sizeMul: 1.519 },
  fluff:    { stand: ['img/cats/fluff_stand.png', 212, 168], loaf: ['img/cats/fluff_loaf.png', 175, 105], sameScale: true, sizeMul: 0.736 },
  golden:   { stand: ['img/cats/golden_stand.png', 97, 86], loaf: ['img/cats/golden_loaf.png', 95, 65], sameScale: true, sizeMul: 1.519 },
  white:    { stand: ['img/cats/w_stand.png', 97, 86], loaf: ['img/cats/w_loaf.png', 95, 65], sameScale: true, sizeMul: 1.519 },
  ghost:    { stand: ['img/cats/ghost_stand.png', 212, 168], loaf: ['img/cats/ghost_loaf.png', 175, 105], sameScale: true, sizeMul: 0.738 },
  king:     { stand: ['img/cats/king_stand.png', 193, 168], loaf: ['img/cats/king_loaf.png', 174, 113], sameScale: true, sizeMul: 0.783 },
  berry:    { stand: ['img/cats/berry_stand.png', 185, 139], loaf: ['img/cats/berry_loaf.png', 159, 88], sameScale: true, sizeMul: 0.876 },
};

const _catCache = {};

/** 냥이 id → 털 종류(스프라이트가 있는 기본 품종) */
function coatOf(breed) {
  if (CAT_ASSETS[breed]) return breed;
  const info = (typeof CAT_BY_ID !== 'undefined') && CAT_BY_ID[breed];
  return (info && info.coat) || 'cheese';
}

/** 스프라이트 슬롯: canvas는 즉시 만들고, 이미지가 로드되면 그려 넣는다 */
function _imgSprite(file, w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const sp = { canvas: cv, w: w, h: h, ok: false, img: null };
  const img = new Image();
  img.onload = function () {
    const c = cv.getContext('2d');
    c.clearRect(0, 0, w, h);
    c.drawImage(img, 0, 0);
    sp.ok = true;
    sp.img = img;
  };
  img.src = file + '?v=' + IMG_VER;
  return sp;
}

/** 도감용 얼굴: 어떤 품종이든 같은 크기의 정사각 썸네일로 만든다 */
const PORTRAIT_PX = 128;
function _portraitSprite(standSp, faceRight) {
  const cv = document.createElement('canvas');
  cv.width = PORTRAIT_PX;
  cv.height = PORTRAIT_PX;
  const sp = { canvas: cv, w: PORTRAIT_PX, h: PORTRAIT_PX };
  const draw = function () {
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, PORTRAIT_PX, PORTRAIT_PX);

    /* 머리 쪽을 잘라 낸다 (오른쪽을 보는 원본은 오른쪽이 머리) */
    const cw = Math.round(standSp.w * 0.52);
    const ch = Math.round(standSp.h * 0.66);
    const sx = faceRight ? standSp.w - cw : 0;
    const sy = Math.round(standSp.h * 0.04);

    /* 잘라낸 조각을 정사각 안에 꽉 차게 (품종마다 같은 크기로 보인다) */
    const fit = PORTRAIT_PX * 0.94;
    const r = Math.min(fit / cw, fit / ch);
    const dw = Math.round(cw * r);
    const dh = Math.round(ch * r);
    const dx = Math.round((PORTRAIT_PX - dw) / 2);
    const dy = Math.round((PORTRAIT_PX - dh) / 2);

    c.save();
    if (!faceRight) { c.translate(PORTRAIT_PX, 0); c.scale(-1, 1); }
    c.drawImage(standSp.canvas, sx, sy, cw, ch, faceRight ? dx : PORTRAIT_PX - dx - dw, dy, dw, dh);
    c.restore();
  };
  const t = setInterval(function () {
    if (standSp.ok) { draw(); clearInterval(t); }
  }, 60);
  return sp;
}

/** 품종 스프라이트 세트 (캐시): { stand, loaf, portrait } */
function catSprites(breed) {
  const coat = coatOf(breed);
  if (_catCache[coat]) return _catCache[coat];
  const a = CAT_ASSETS[coat] || CAT_ASSETS.cheese;
  const stand = _imgSprite(a.stand[0], a.stand[1], a.stand[2]);
  const loaf = a.loaf ? _imgSprite(a.loaf[0], a.loaf[1], a.loaf[2]) : stand;
  const set = {
    stand: stand,
    loaf: loaf,
    hasLoaf: !!a.loaf,
    sameScale: !!a.sameScale,   /* 같은 시트 스케일: 포즈별 크기 보정 불필요 */
    sizeMul: a.sizeMul || 1,    /* 품종별 몸집 (아깽이는 작다) */
    portrait: _portraitSprite(stand, !!a.sameScale),
    walk: null,
    eat: null,
  };
  const anim = CAT_ANIM[coat];
  if (anim) {
    ['walk', 'eat', 'groom', 'meow', 'play', 'sleep'].forEach(function (kind) {
      if (!anim[kind]) return;
      set[kind] = {
        face: anim[kind].face,
        frames: anim[kind].frames.map(function (f) { return _imgSprite(f[0], f[1], f[2]); }),
      };
    });
  }
  _catCache[coat] = set;
  return set;
}

/* 부팅 시 전 품종 미리 로드 */
for (const b in CAT_ASSETS) catSprites(b);

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
  '.oooo.',
  'ohhmmo',
  'ohmmmo',
  'ommmmo',
  'ommmdo',
  '.oooo.',
], { '.': null, o: '#4a2f16', m: '#a05f22', h: '#d08a3c', d: '#6d3f18' });

const KIBBLE_SPECIAL = makeSprite([
  '.oo..oo.',
  'owwoowwo',
  'owmmmmwo',
  'ommmmmmo',
  '.ommmmo.',
  '..ommo..',
  '...oo...',
  '........',
], { '.': null, o: '#7a4a12', m: '#e8a83a', w: '#ffe08a' });

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
