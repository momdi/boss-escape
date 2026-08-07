/* ===========================================================
   상사 피하기 - 픽셀 스프라이트 / 팔레트
   캐릭터는 [머리 8행] + [상체 5행] + [다리 3행] = 12x16 조합
   =========================================================== */

const BASE_PAL = {
  '.': null,
  k: '#1a1c2c', // 아웃라인 / 눈
  s: '#ffcd75', // 피부
  h: '#333c57', // 머리
  w: '#e6ebf2', // 상의
  t: '#b13e53', // 넥타이 / 포인트
  p: '#29366f', // 하의
  b: '#1a1c2c', // 신발
  g: '#1a1c2c', // 안경
  e: '#8a6a9a', // 다크서클
};

// 배경 / 소품 색 — 엑셀 시트 위장 테마 (밝은 배경 + 진한 잉크)
const COL = {
  floorA: '#ffffff',
  floorB: '#ffffff',
  floorDot: '#fbfbfb',
  wall: '#ffffff',
  wallTop: '#f7f7f7',
  wallLine: '#c9c9c9',
  propLite: '#dbe3ec',   // 소품의 밝은 면 — 흰 배경에 묻히지 않게
  propEdge: '#8b9bb0',   // 소품 외곽선
  shadow: 'rgba(0,0,0,0.06)',
  hudBg: '#f2f5fa',
  hudLine: '#c8c8c8',
  white: '#1f3864',
  gray: '#6b7686',
  dim: '#a3adba',
  red: '#a33a3a',
  orange: '#9c6a2f',
  yellow: '#8f7328',
  green: '#3a6b4a',
  lime: '#4f7a52',
  cyan: '#3c6fa5',
  blue: '#3c6fa5',
  navy: '#1f3864',
  purple: '#6b4b8a',
  wood: '#a9743f',
  wood2: '#c9955c',
  carpet: '#e6d2d7',
  carpet2: '#dcc3ca',
};

function makeSprite(rows, pal) {
  const P = pal ? Object.assign({}, BASE_PAL, pal) : BASE_PAL;
  const w = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
  const h = rows.length;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const col = P[row[x]];
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(x, y, 1, 1);
    }
  }
  return { canvas: cv, w: w, h: h };
}

/* ================= 머리 (8행 x 12칸) ================= */

const HEADS = {
  // 대머리 + 콧수염 (김부장)
  bald: {
    down: ['....ssss....', '...ssssss...', '..ssssssss..', '..skksskks..', '..skssssks..', '..ssssssss..', '..sskkkkss..', '...ssssss...'],
    up: ['....ssss....', '...ssssss...', '..ssssssss..', '..ssssssss..', '..ssssssss..', '..ssssssss..', '...ssssss...', '...ssssss...'],
    side: ['....ssss....', '...ssssss...', '..ssssssss..', '..sssksss...', '..ssssssss..', '..sskkkks...', '...sssss....', '...sssss....'],
  },
  // 짧은 머리 (플레이어 / 동기)
  short: {
    down: ['...hhhhhh...', '..hhhhhhhh..', '..hssssssh..', '..skssssks..', '..ssssssss..', '...skkkks...', '...ssssss...', '....ssss....'],
    up: ['...hhhhhh...', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '...hhhhhh...', '...ssssss...', '....ssss....'],
    side: ['...hhhhhh...', '..hhhhhhhh..', '..hhhsssss..', '..hhsskss...', '..hsssssss..', '...sskkkk...', '...sssss....', '....ssss....'],
  },
  // 긴 생머리 + 안경 (이과장)
  long: {
    down: ['...hhhhhh...', '..hhhhhhhh..', '.hhsssssshh.', '.hhgksskghh.', '.hhsssssshh.', '.hhsskksshh.', '..hssssssh..', '..hhsssshh..'],
    up: ['...hhhhhh...', '..hhhhhhhh..', '.hhhhhhhhhh.', '.hhhhhhhhhh.', '.hhhhhhhhhh.', '.hhhhhhhhhh.', '..hhhhhhhh..', '..hhhhhhhh..'],
    side: ['...hhhhhh...', '..hhhhhhhh..', '.hhhhsssss..', '.hhhgksss...', '.hhhsssss...', '.hhhskkss...', '.hhhsssss...', '..hhhsss....'],
  },
  // 바코드 머리 (박이사)
  comb: {
    down: ['....ssss....', '...hhhhhh...', '..hssssssh..', '..skssssks..', '..ssssssss..', '..sskkkkss..', '...ssssss...', '...ssssss...'],
    up: ['....ssss....', '...hhhhhh...', '..ssssssss..', '..hhhhhhhh..', '..ssssssss..', '..hhhhhhhh..', '...ssssss...', '...ssssss...'],
    side: ['....ssss....', '...hhhhh....', '..hsssssss..', '..sssksss...', '..ssssssss..', '..sskkkks...', '...sssss....', '...sssss....'],
  },
  // 떡진 머리 + 다크서클 (노과장)
  messy: {
    down: ['..h.hhh.hh..', '..hhhhhhhh..', '..hssssssh..', '..skssssks..', '..sesssses..', '..ssssssss..', '...skkks....', '...ssssss...'],
    up: ['..h.hhh.hh..', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '...hhhhhh...', '...ssssss...'],
    side: ['..h.hhh.h...', '..hhhhhhhh..', '..hhhsssss..', '..hhsskss...', '..hhseesss..', '..hsssssss..', '...skkks....', '...sssss....'],
  },
};

/* ================= 상체 (5행) ================= */

const TORSOS = {
  lean: {
    down: ['...wwwwww...', '..wwwttwww..', '..swwttwws..', '..swwwwwws..', '...wwwwww...'],
    up: ['...wwwwww...', '..wwwwwwww..', '..swwwwwws..', '..swwwwwws..', '...wwwwww...'],
    side: ['...wwwww....', '..wwwwwws...', '..wwwwwws...', '..wwwwww....', '...wwwww....'],
  },
  normal: {
    down: ['..wwwwwwww..', '.wwwwttwwww.', '.swwwttwwws.', '.swwwwwwwws.', '..wwwwwwww..'],
    up: ['..wwwwwwww..', '.wwwwwwwwww.', '.swwwwwwwws.', '.swwwwwwwws.', '..wwwwwwww..'],
    side: ['..wwwwwww...', '.wwwwwwws...', '.wwwwwwws...', '.wwwwwww....', '..wwwwww....'],
  },
  fat: {
    down: ['.wwwwwwwwww.', 'wwwwwttwwwww', 'swwwwttwwwws', 'swwwwwwwwwws', '.wwwwwwwwww.'],
    up: ['.wwwwwwwwww.', 'wwwwwwwwwwww', 'swwwwwwwwwws', 'swwwwwwwwwws', '.wwwwwwwwww.'],
    side: ['.wwwwwwwww..', 'wwwwwwwwws..', 'wwwwwwwwws..', '.wwwwwwww...', '.wwwwwwww...'],
  },
};

/* ================= 다리 (3행) ================= */

const LEGS = {
  std: {
    a: ['...pppppp...', '...pp..pp...', '...bb..bb...'],
    b: ['...pppppp...', '..pp....pp..', '..bb....bb..'],
    sa: ['...ppppp....', '...pp.pp....', '...bb.bbb...'],
    sb: ['...ppppp....', '...pppp.....', '...bbbb.....'],
  },
  fat: {
    a: ['..pppppppp..', '..ppp..ppp..', '..bbb..bbb..'],
    b: ['..pppppppp..', '.ppp....ppp.', '.bbb....bbb.'],
    sa: ['..pppppp....', '..ppp.ppp...', '..bbb.bbbb..'],
    sb: ['..pppppp....', '..ppppp.....', '..bbbbb.....'],
  },
};

/** 캐릭터 스프라이트 세트 생성 */
function buildChar(cfg) {
  const head = HEADS[cfg.hair] || HEADS.short;
  const torso = TORSOS[cfg.build] || TORSOS.lean;
  const legs = cfg.build === 'fat' ? LEGS.fat : LEGS.std;
  const pal = cfg.pal || {};
  function mk(dir, legRows) {
    return makeSprite(head[dir].concat(torso[dir], legRows), pal);
  }
  return {
    down: [mk('down', legs.a), mk('down', legs.b)],
    up: [mk('up', legs.a), mk('up', legs.b)],
    side: [mk('side', legs.sa), mk('side', legs.sb)],
  };
}

/** 웅크려 숨은 자세 */
function buildCrouch(pal) {
  return makeSprite([
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '...hhhhhh...',
    '..hssssssh..',
    '..skssssks..',
    '..wwwwwwww..',
    '.wwwwttwwww.',
    '.bppppppppb.',
    '..bb....bb..',
    '............',
    '............',
  ], pal);
}

/* ================= 위장(변신) 스프라이트 ================= */
/* 12x16, 캐릭터와 동일 앵커(발밑). 어딘가 어설퍼야 웃기다. */

const DG_PAL = {
  k: '#1a1c2c',
  L: '#38b764', // 잎
  l: '#a7f070', // 잎 하이라이트
  P: '#a4633a', // 화분
  p: '#7a4a2b', // 화분 그늘
  C: '#b13e53', // 쿠션
  c: '#d05070', // 쿠션 밝은
  S: '#94b0c2', // 석고 밝은
  s: '#566c86', // 석고 그늘
  A: '#c0cbdc', // 기계 밝은
  a: '#8b93a8', // 기계 그늘
  B: '#41a6f6', // 물 / 유리
  W: '#e6ebf2', // 흰색
  G: '#333c57', // 프레임 / 어두운
  R: '#7d2b42', // 골프백
  r: '#b13e53',
  Y: '#ffcd75', // 금색
  b: '#1a1c2c', // 신발
  o: '#ef7d57', // 포인트
};

const SPR_DG = {
  // 화분으로 위장 - 잎 사이로 눈이 빼꼼
  plant: makeSprite([
    '.....l......',
    '...lLlLl....',
    '..lLLLLLl.l.',
    '.lLLLLLLLLl.',
    '.lLLLLLLLLl.',
    '..lLLLLLLl..',
    '..lLkLLkLl..',
    '...lLLLLl...',
    '....lLLl....',
    '..PPPPPPPP..',
    '..PPPPPPPP..',
    '..PppppppP..',
    '..PppppppP..',
    '...pppppp...',
    '....pppp....',
    '............',
  ], DG_PAL),

  // 대형 화분 - 완전히 파묻힘
  bigplant: makeSprite([
    '..l..l..l...',
    '.lLl.lLl.lL.',
    '.lLLllLLllL.',
    'llLLLLLLLLll',
    'lLLLLLLLLLLl',
    'lLLLLLLLLLLl',
    '.lLLkLLkLLl.',
    '.lLLLLLLLLl.',
    '..lLLLLLLl..',
    '...lLLLLl...',
    '.PPPPPPPPPP.',
    '.PPPPPPPPPP.',
    '.PppppppppP.',
    '..pppppppp..',
    '..pppppppp..',
    '............',
  ], DG_PAL),

  // 소파 쿠션 - 신발이 삐져나옴
  cushion: makeSprite([
    '............',
    '............',
    '............',
    '..CCCCCCCC..',
    '.CccccccccC.',
    '.CccccccccC.',
    '.CckcccckcC.',
    '.CccccccccC.',
    '.CccccccccC.',
    '.CccccccccC.',
    '.CccccccccC.',
    '..CCCCCCCC..',
    '..C......C..',
    '..bb....bb..',
    '............',
    '............',
  ], DG_PAL),

  // 창업주 흉상 - 완벽 위장
  statue: makeSprite([
    '....SSSS....',
    '...SSSSSS...',
    '..SSSSSSSS..',
    '..SsSSSSsS..',
    '..SSSSSSSS..',
    '..SSssssSS..',
    '...SSSSSS...',
    '..SSSSSSSS..',
    '.SSSSSSSSSS.',
    '.SSSSSSSSSS.',
    '.SsSSSSSSsS.',
    '..SSSSSSSS..',
    '.ssssssssss.',
    'ssssssssssss',
    'ssssssssssss',
    '............',
  ], DG_PAL),

  // 정수기 - 머리에 물통을 얹었다
  cooler: makeSprite([
    '............',
    '...BBBBBB...',
    '..BBBBBBBB..',
    '..BBBBBBBB..',
    '...BBBBBB...',
    '....AAAA....',
    '..AAAAAAAA..',
    '..AAAAAAAA..',
    '..AkAAAAkA..',
    '..AAAAAAAA..',
    '..AaaaaaaA..',
    '..AAAAAAAA..',
    '..AAAAAAAA..',
    '..aaaaaaaa..',
    '............',
    '............',
  ], DG_PAL),

  // 복사기 - 삐- 용지 없음
  copier: makeSprite([
    '............',
    '............',
    '..AAAAAAAA..',
    '..ABBBBBBA..',
    '..AAAAAAAA..',
    '..AkAAAAkA..',
    '..AAAAAAAA..',
    '..AWWWWWWA..',
    '..AAAAAAAA..',
    '..AoAAAAaA..',
    '..AAAAAAAA..',
    '..AaaaaaaA..',
    '..AAAAAAAA..',
    '..aaaaaaaa..',
    '............',
    '............',
  ], DG_PAL),

  // 화이트보드 뒤 - 눈만 빼꼼
  board: makeSprite([
    '....k..k....',
    '..GGGGGGGG..',
    '..GWWWWWWG..',
    '..GWoWWWWG..',
    '..GWWWWBWG..',
    '..GWWWWWWG..',
    '..GWBWWWWG..',
    '..GWWWWoWG..',
    '..GGGGGGGG..',
    '....G..G....',
    '....G..G....',
    '....G..G....',
    '....G..G....',
    '..bbb..bbb..',
    '............',
    '............',
  ], DG_PAL),

  // 골프백 - 임원실 필수품
  golf: makeSprite([
    '.....YY.....',
    '....Y.YY....',
    '...Y..Y.Y...',
    '...S..S.S...',
    '...SSSSSS...',
    '..RRRRRRRR..',
    '..RkRRRRkR..',
    '..RRRRRRRR..',
    '..RrrrrrrR..',
    '..RRRRRRRR..',
    '..RRRRRRRR..',
    '..RrrrrrrR..',
    '..RRRRRRRR..',
    '...RRRRRR...',
    '....bbbb....',
    '............',
  ], DG_PAL),
};

/* ================= 아이템 / 아이콘 ================= */

const SPR_DOC = makeSprite([
  '.wwwwww.',
  'w.pp..w.',
  'w.pppp.w',
  'w......w',
  'w.pppp.w',
  'w......w',
  'w.pp...w',
  '.kkkkkk.',
], { w: '#dbe3ec', p: '#44618f', k: '#7c8fa5' });

const SPR_DOC_BAD = makeSprite([
  '.wwwwww.',
  'w.pp..w.',
  'w.tttt.w',
  'w.tttt.w',
  'w.tttt.w',
  'w......w',
  'w.pp...w',
  '.kkkkkk.',
], { w: '#dbe3ec', p: '#44618f', t: '#a33a3a', k: '#7c8fa5' });

const SPR_COFFEE = makeSprite([
  '.wwwwww.',
  '.wtttw..',
  '.wtttww.',
  '.wwwwww.',
  '..wwww..',
  '..wwww..',
  '..kkkk..',
  '........',
], { w: '#dbe3ec', t: '#7a4a2b', k: '#7c8fa5' });

const SPR_BANG = makeSprite([
  '.ttt.',
  '.ttt.',
  '.ttt.',
  '.ttt.',
  '.....',
  '.ttt.',
  '.ttt.',
], { t: '#b13e53' });

const SPR_QUESTION = makeSprite([
  '.sss.',
  'ss.ss',
  '...ss',
  '..ss.',
  '..s..',
  '.....',
  '..s..',
], { s: '#ffcd75' });

const SPR_HEART = makeSprite([
  '.tt.tt.',
  'ttttttt',
  'ttttttt',
  '.ttttt.',
  '..ttt..',
  '...t...',
], { t: '#b13e53' });

const SPR_HEART_OFF = makeSprite([
  '.tt.tt.',
  'ttttttt',
  'ttttttt',
  '.ttttt.',
  '..ttt..',
  '...t...',
], { t: '#3a3f55' });
