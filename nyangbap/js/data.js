/* ===========================================================
   냥밥 — 데이터 (길냥이 도감 / 상점 / 기본 할 일)
   =========================================================== */

const RARITY = {
  common: { label: '길냥이', weight: 100 },
  rare: { label: '귀한 냥이', weight: 30 },
  legend: { label: '전설의 냥이', weight: 6 },
};

const CATS = [
  {
    id: 'cheese', species: '치즈', rarity: 'common',
    desc: '해만 나면 창가에 붙어 있는 노랑둥이. 밥그릇 소리를 제일 먼저 알아듣는다.',
    likes: 'gift_can',
  },
  {
    id: 'mackerel', species: '고등어', rarity: 'common',
    desc: '골목 순찰을 도는 줄무늬. 경계는 심한데 밥은 끝까지 다 먹고 간다.',
    likes: 'gift_yarn',
  },
  {
    id: 'calico', species: '삼색이', rarity: 'common',
    desc: '동네에서 제일 오래 산 삼색 무늬. 앉는 자리가 늘 정해져 있다.',
    likes: 'gift_cushion',
  },
  {
    id: 'tuxedo', species: '턱시도', rarity: 'common',
    desc: '늘 정장을 차려입은 것 같은 얼굴. 밥 먹기 전에 앞발을 한 번 턴다.',
    likes: 'gift_yarn',
  },
  {
    id: 'white', species: '하양이', rarity: 'common',
    desc: '먼지 하나 안 묻은 흰 털. 어디서 자고 오는지 아무도 모른다.',
    likes: 'gift_cushion',
  },
  {
    id: 'black', species: '까망이', rarity: 'common',
    desc: '어두워지면 눈만 보인다. 사진을 찍으면 늘 눈이 두 개의 점으로 남는다.',
    likes: 'gift_matatabi',
  },
  {
    id: 'smoke', species: '잿빛이', rarity: 'rare',
    desc: '비 오는 날에만 나타난다는 회색 털. 발소리가 거의 나지 않는다.',
    likes: 'gift_can',
  },
  {
    id: 'siam', species: '샴이', rarity: 'rare',
    desc: '어디 사는 집냥이 같은 얼굴로 나타나서, 밥만 먹고 유유히 사라진다.',
    likes: 'gift_matatabi',
  },
  {
    id: 'fluff', species: '복슬이', rarity: 'rare',
    desc: '털이 두 배는 많아 보이는 장모종. 앉으면 방석인지 고양이인지 모른다.',
    likes: 'gift_cushion',
  },
  {
    id: 'golden', species: '금빛이', rarity: 'legend',
    desc: '특별한 밥 냄새를 맡고 온다는 황금빛 털. 만나면 그날은 운이 좋다.',
    likes: 'gift_can',
  },
  {
    id: 'ghost', species: '몽실이', rarity: 'legend',
    desc: '밤에만 보인다는 하얀 냥이. 사진에는 아주 흐리게 찍힌다.',
    likes: 'gift_matatabi',
  },
  {
    id: 'king', species: '대장', rarity: 'legend',
    desc: '골목의 진짜 주인. 좋은 밥그릇에만 앉는다는 소문이 있다.',
    likes: 'gift_cushion',
  },
];

const CAT_BY_ID = {};
CATS.forEach(function (c) { CAT_BY_ID[c.id] = c; });

/* ================= 상점 ================= */

const BOWLS = [
  {
    id: 'bowl_basic', name: '이 빠진 밥그릇', price: 0, cap: 3, lure: 0,
    desc: '원래 집에 있던 그릇. 한 번에 밥알 3개까지 담긴다.',
  },
  {
    id: 'bowl_ceramic', name: '하얀 사기 그릇', price: 320, cap: 5, lure: 1,
    desc: '밥알 5개까지. 냥이들이 조금 더 자주 들른다.',
  },
  {
    id: 'bowl_wood', name: '나무 밥그릇', price: 780, cap: 7, lure: 2,
    desc: '밥알 7개까지. 귀한 냥이가 찾아올 확률이 올라간다.',
  },
  {
    id: 'bowl_gold', name: '금테 밥그릇', price: 1800, cap: 10, lure: 3,
    desc: '밥알 10개까지. 전설의 냥이도 그냥 지나치지 못한다.',
  },
];

const BOWL_BY_ID = {};
BOWLS.forEach(function (b) { BOWL_BY_ID[b.id] = b; });

const GIFTS = [
  {
    id: 'gift_yarn', name: '털실 뭉치', price: 40, aff: 2,
    desc: '굴려 주면 한참 논다. 친밀도 +2',
  },
  {
    id: 'gift_can', name: '참치 캔', price: 90, aff: 3,
    desc: '못 이기는 척 다가온다. 친밀도 +3',
  },
  {
    id: 'gift_cushion', name: '작은 방석', price: 180, aff: 4,
    desc: '자리를 깔아 주면 더 오래 머문다. 친밀도 +4',
  },
  {
    id: 'gift_matatabi', name: '마따따비', price: 260, aff: 6,
    desc: '한 번 맡으면 잊지 못한다. 친밀도 +6',
  },
  {
    id: 'item_bell', name: '딸랑 방울', price: 150, aff: 0, summon: true,
    desc: '흔들면 근처 냥이가 바로 찾아온다. 밥그릇에 밥이 있어야 한다.',
  },
];

const GIFT_BY_ID = {};
GIFTS.forEach(function (g) { GIFT_BY_ID[g.id] = g; });

/* ================= 기본 할 일 ================= */

const DEFAULT_TODOS = [
  { text: '물 마시기', star: false },
  { text: '스트레칭 10분 하기', star: false },
  { text: '책 20분 읽기', star: true },
  { text: '영양제 챙겨 먹기', star: false },
  { text: '일기 쓰기', star: false },
];

/* ================= 규칙 상수 ================= */

const RULES = {
  kibblePerTodo: 1,
  specialPerStar: 1,
  maxStars: 2,
  bonusAt: 5,
  bonusSpecial: 1,
  allDoneKibble: 3,
  affRegular: 8,
  photoAff: 1,
};

const WEEKDAY = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
