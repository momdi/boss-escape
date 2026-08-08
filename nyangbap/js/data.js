/* ===========================================================
   츄두리스트 / ChewDoList — 데이터 (도감 / 상점 / 기본 할 일)
   =========================================================== */

const RARITY = {
  common: { weight: 100 },
  rare: { weight: 30 },
  legend: { weight: 6 },
};

const CATS = [
  {
    id: 'cheese', species: '치즈', species_en: 'Cheese 1', rarity: 'common', coat: 'cheese',
    desc: '해만 나면 창가에 붙어 있는 노랑둥이. 밥그릇 소리를 제일 먼저 알아듣는다.',
    desc_en: '',
    likes: 'gift_can',
  },
  {
    id: 'cheese2', species: '노랑이', species_en: 'Cheese 2', rarity: 'common', coat: 'cheese',
    desc: '창틀에서 해바라기만 한다. 부르면 꼬리만 흔든다.',
    desc_en: '',
    likes: 'gift_yarn',
  },
  {
    id: 'cheese3', species: '단무지', species_en: 'Cheese 3', rarity: 'common', coat: 'cheese',
    desc: '이름값 하듯 노랗다. 밥그릇을 앞발로 톡톡 두드린다.',
    desc_en: '',
    likes: 'gift_churu_tuna',
  },
  {
    id: 'cheese4', species: '호박이', species_en: 'Cheese 4', rarity: 'common', coat: 'cheese',
    desc: '낙엽 밟는 소리를 좋아한다. 가을에 자주 보인다.',
    desc_en: '',
    likes: 'gift_yarn',
  },
  {
    id: 'cheese5', species: '미역이', species_en: 'Cheese 5', rarity: 'common', coat: 'cheese',
    desc: '밥그릇 근처를 빙빙 돌다가 슬쩍 앉는다.',
    desc_en: '',
    likes: 'gift_cushion',
  },
  {
    id: 'cheese6', species: '귤이', species_en: 'Cheese 6', rarity: 'common', coat: 'cheese',
    desc: '겨울이면 이불 위에 자리를 잡는다.',
    desc_en: '',
    likes: 'gift_can',
  },
  {
    id: 'cheese7', species: '노른자', species_en: 'Cheese 7', rarity: 'common', coat: 'cheese',
    desc: '배만 유독 밝다. 뒤집어 자는 버릇이 있다.',
    desc_en: '',
    likes: 'gift_churu_chicken',
  },
  {
    id: 'mackerel', species: '고등어', species_en: 'Mack 1', rarity: 'common', coat: 'mackerel',
    desc: '골목 순찰을 도는 줄무늬. 경계는 심한데 밥은 끝까지 다 먹는다.',
    desc_en: '',
    likes: 'gift_yarn',
  },
  {
    id: 'mackerel2', species: '참치', species_en: 'Mack 2', rarity: 'common', coat: 'mackerel',
    desc: '줄무늬가 유난히 곧다. 먹고도 한참 자리를 안 뜬다.',
    desc_en: '',
    likes: 'gift_churu_tuna',
  },
  {
    id: 'mackerel3', species: '자반이', species_en: 'Mack 3', rarity: 'common', coat: 'mackerel',
    desc: '짠맛 나는 이름과 달리 애교가 많다.',
    desc_en: '',
    likes: 'gift_cushion',
  },
  {
    id: 'mackerel4', species: '줄무늬', species_en: 'Mack 4', rarity: 'common', coat: 'mackerel',
    desc: '아직 이름을 못 지었다는 듯한 얼굴.',
    desc_en: '',
    likes: 'gift_can',
  },
  {
    id: 'mackerel5', species: '비늘이', species_en: 'Mack 5', rarity: 'common', coat: 'mackerel',
    desc: '비 온 다음 날에만 보인다는 소문이 있다.',
    desc_en: '',
    likes: 'gift_yarn',
  },
  {
    id: 'mackerel6', species: '꽁치', species_en: 'Mack 6', rarity: 'common', coat: 'mackerel',
    desc: '작고 날쌔다. 밥그릇 앞에서만 얌전해진다.',
    desc_en: '',
    likes: 'gift_churu_tuna',
  },
  {
    id: 'mackerel7', species: '회색이', species_en: 'Mack 7', rarity: 'common', coat: 'mackerel',
    desc: '이름은 심심한데 성격은 유별나다.',
    desc_en: '',
    likes: 'gift_matatabi',
  },
  {
    id: 'calico', species: '삼색이', species_en: 'Calico 1', rarity: 'common', coat: 'calico',
    desc: '동네에서 제일 오래 산 삼색 무늬. 앉는 자리가 늘 정해져 있다.',
    desc_en: '',
    likes: 'gift_cushion',
  },
  {
    id: 'calico2', species: '알록이', species_en: 'Calico 2', rarity: 'common', coat: 'calico',
    desc: '무늬가 매일 달라 보인다는 착각을 준다.',
    desc_en: '',
    likes: 'gift_yarn',
  },
  {
    id: 'calico3', species: '조각이', species_en: 'Calico 3', rarity: 'common', coat: 'calico',
    desc: '등에 붙은 얼룩이 퍼즐 조각을 닮았다.',
    desc_en: '',
    likes: 'gift_can',
  },
  {
    id: 'calico4', species: '호떡', species_en: 'Calico 4', rarity: 'common', coat: 'calico',
    desc: '엎드리면 딱 호떡 모양이 된다.',
    desc_en: '',
    likes: 'gift_cushion',
  },
  {
    id: 'calico5', species: '꽃분이', species_en: 'Calico 5', rarity: 'common', coat: 'calico',
    desc: '앉을 때 발을 가지런히 모으는 버릇이 있다.',
    desc_en: '',
    likes: 'gift_churu_tuna',
  },
  {
    id: 'calico6', species: '얼룩이', species_en: 'Calico 6', rarity: 'common', coat: 'calico',
    desc: '자기 무늬가 마음에 드는지 자주 핥는다.',
    desc_en: '',
    likes: 'gift_yarn',
  },
  {
    id: 'tuxedo', species: '턱시도', species_en: 'Tuxedo 1', rarity: 'common', coat: 'tuxedo',
    desc: '늘 정장을 차려입은 것 같은 얼굴. 밥 먹기 전에 앞발을 한 번 턴다.',
    desc_en: '',
    likes: 'gift_yarn',
  },
  {
    id: 'tuxedo2', species: '정장이', species_en: 'Tuxedo 2', rarity: 'common', coat: 'tuxedo',
    desc: '어딜 가도 차려입은 티가 난다. 걸음걸이가 점잖다.',
    desc_en: '',
    likes: 'gift_can',
  },
  {
    id: 'tuxedo3', species: '집사', species_en: 'Tuxedo 3', rarity: 'common', coat: 'tuxedo',
    desc: '사람을 관찰하는 게 취미. 밥은 마지막에 먹는다.',
    desc_en: '',
    likes: 'gift_churu_chicken',
  },
  {
    id: 'tuxedo4', species: '펭귄', species_en: 'Tuxedo 4', rarity: 'common', coat: 'tuxedo',
    desc: '뒤뚱거리며 걷는 모습이 꼭 펭귄 같다.',
    desc_en: '',
    likes: 'gift_cushion',
  },
  {
    id: 'tuxedo5', species: '나비', species_en: 'Tuxedo 5', rarity: 'common', coat: 'tuxedo',
    desc: '목 아래 흰 무늬가 나비넥타이를 닮았다.',
    desc_en: '',
    likes: 'gift_matatabi',
  },
  {
    id: 'tuxedo6', species: '까치', species_en: 'Tuxedo 6', rarity: 'common', coat: 'tuxedo',
    desc: '까치처럼 종종거리며 걷는다.',
    desc_en: '',
    likes: 'gift_yarn',
  },
  {
    id: 'white', species: '하양이', species_en: 'Snow 1', rarity: 'common', coat: 'white',
    desc: '먼지 하나 안 묻은 흰 털. 어디서 자고 오는지 아무도 모른다.',
    desc_en: '',
    likes: 'gift_cushion',
  },
  {
    id: 'white2', species: '설이', species_en: 'Snow 2', rarity: 'common', coat: 'white',
    desc: '눈 오는 날엔 어디 있는지 찾을 수가 없다.',
    desc_en: '',
    likes: 'gift_can',
  },
  {
    id: 'white3', species: '두부', species_en: 'Snow 3', rarity: 'common', coat: 'white',
    desc: '만지면 부서질 것 같은 이름. 실제로는 아주 튼튼하다.',
    desc_en: '',
    likes: 'gift_churu_tuna',
  },
  {
    id: 'white4', species: '우유', species_en: 'Snow 4', rarity: 'common', coat: 'white',
    desc: '밥보다 물을 더 오래 마신다.',
    desc_en: '',
    likes: 'gift_cushion',
  },
  {
    id: 'white5', species: '목화', species_en: 'Snow 5', rarity: 'common', coat: 'white',
    desc: '털이 바람에 날리면 솜뭉치 같다.',
    desc_en: '',
    likes: 'gift_yarn',
  },
  {
    id: 'white6', species: '백설', species_en: 'Snow 6', rarity: 'common', coat: 'white',
    desc: '거울 앞을 지날 때마다 멈춰 선다.',
    desc_en: '',
    likes: 'gift_churu_chicken',
  },
  {
    id: 'black', species: '까망이', species_en: 'Inky 1', rarity: 'common', coat: 'black',
    desc: '어두워지면 눈만 보인다. 사진을 찍으면 늘 눈이 두 개의 점으로 남는다.',
    desc_en: '',
    likes: 'gift_matatabi',
  },
  {
    id: 'black2', species: '밤이', species_en: 'Inky 2', rarity: 'common', coat: 'black',
    desc: '밤에는 눈만 둥둥 떠다니는 것처럼 보인다.',
    desc_en: '',
    likes: 'gift_can',
  },
  {
    id: 'black3', species: '먹물', species_en: 'Inky 3', rarity: 'common', coat: 'black',
    desc: '발끝까지 새까맣다. 사진이 늘 실패한다.',
    desc_en: '',
    likes: 'gift_churu_crab',
  },
  {
    id: 'black4', species: '그림자', species_en: 'Inky 4', rarity: 'common', coat: 'black',
    desc: '뒤를 돌아보면 항상 한 발짝 뒤에 있다.',
    desc_en: '',
    likes: 'gift_matatabi',
  },
  {
    id: 'black5', species: '숯이', species_en: 'Inky 5', rarity: 'common', coat: 'black',
    desc: '따뜻한 곳을 기가 막히게 찾아낸다.',
    desc_en: '',
    likes: 'gift_cushion',
  },
  {
    id: 'black6', species: '깨알', species_en: 'Inky 6', rarity: 'common', coat: 'black',
    desc: '작고 새까맣다. 부르면 대답 대신 눈을 감는다.',
    desc_en: '',
    likes: 'gift_yarn',
  },
  {
    id: 'smoke', species: '잿빛이', species_en: 'Smoke 1', rarity: 'common', coat: 'smoke',
    desc: '비 오는 날에만 나타난다는 회색 털. 발소리가 거의 나지 않는다.',
    desc_en: '',
    likes: 'gift_can',
  },
  {
    id: 'smoke2', species: '구름', species_en: 'Smoke 2', rarity: 'common', coat: 'smoke',
    desc: '회색인데 어쩐지 폭신해 보인다.',
    desc_en: '',
    likes: 'gift_cushion',
  },
  {
    id: 'smoke3', species: '철이', species_en: 'Smoke 3', rarity: 'common', coat: 'smoke',
    desc: '쇠 냄새 나는 골목에서 나타난다.',
    desc_en: '',
    likes: 'gift_matatabi',
  },
  {
    id: 'smoke4', species: '안개', species_en: 'Smoke 4', rarity: 'common', coat: 'smoke',
    desc: '발소리가 없다. 어느새 옆에 와 있다.',
    desc_en: '',
    likes: 'gift_churu_tuna',
  },
  {
    id: 'siam', species: '샴이', species_en: 'Siam 1', rarity: 'common', coat: 'siam',
    desc: '어디 사는 집냥이 같은 얼굴로 나타나서, 밥만 먹고 유유히 사라진다.',
    desc_en: '',
    likes: 'gift_matatabi',
  },
  {
    id: 'siam2', species: '포인트', species_en: 'Siam 2', rarity: 'common', coat: 'siam',
    desc: '귀와 발끝만 짙다. 밥 먹을 때 소리를 낸다.',
    desc_en: '',
    likes: 'gift_churu_chicken',
  },
  {
    id: 'siam3', species: '도련님', species_en: 'Siam 3', rarity: 'common', coat: 'siam',
    desc: '어느 집 귀한 아드님 같은 얼굴로 나타난다.',
    desc_en: '',
    likes: 'gift_can',
  },
  {
    id: 'fluff', species: '복슬이', species_en: 'Fluff 1', rarity: 'common', coat: 'fluff',
    desc: '털이 두 배는 많아 보이는 장모종. 앉으면 방석인지 고양이인지 모른다.',
    desc_en: '',
    likes: 'gift_cushion',
  },
  {
    id: 'fluff2', species: '뭉치', species_en: 'Fluff 2', rarity: 'common', coat: 'fluff',
    desc: '앉으면 방석인지 냥이인지 알 수 없다.',
    desc_en: '',
    likes: 'gift_yarn',
  },
  {
    id: 'fluff3', species: '솜사탕', species_en: 'Fluff 3', rarity: 'common', coat: 'fluff',
    desc: '털이 하도 많아 밥 먹고 나면 입가가 지저분하다.',
    desc_en: '',
    likes: 'gift_churu_tuna',
  },
  {
    id: 'king', species: '대장', species_en: 'Boss 1', rarity: 'common', coat: 'king',
    desc: '골목의 진짜 주인. 좋은 밥그릇에만 앉는다는 소문이 있다.',
    desc_en: '',
    likes: 'gift_cushion',
  },
  {
    id: 'king2', species: '호랑이', species_en: 'Boss 2', rarity: 'common', coat: 'king',
    desc: '무늬가 호랑이를 닮았다. 성격은 정반대.',
    desc_en: '',
    likes: 'gift_can',
  },
  {
    id: 'smoke5', species: '재이', species_en: 'Smoke 5', rarity: 'rare', coat: 'smoke',
    desc: '따뜻한 곳만 골라 앉는 재주가 있다.',
    desc_en: '',
    likes: 'gift_churu_chicken',
  },
  {
    id: 'siam4', species: '새침이', species_en: 'Siam 4', rarity: 'rare', coat: 'siam',
    desc: '도도한 척하다가 츄르 앞에서 무너진다.',
    desc_en: '',
    likes: 'gift_churu_crab',
  },
  {
    id: 'siam5', species: '귀족', species_en: 'Siam 5', rarity: 'rare', coat: 'siam',
    desc: '밥그릇이 마음에 안 들면 그냥 간다.',
    desc_en: '',
    likes: 'gift_churu_crab',
  },
  {
    id: 'fluff4', species: '부풀이', species_en: 'Fluff 4', rarity: 'rare', coat: 'fluff',
    desc: '놀라면 두 배로 부푼다. 정작 본인은 모른다.',
    desc_en: '',
    likes: 'gift_yarn',
  },
  {
    id: 'fluff5', species: '목도리', species_en: 'Fluff 5', rarity: 'rare', coat: 'fluff',
    desc: '목덜미 털이 유독 풍성하다.',
    desc_en: '',
    likes: 'gift_cushion',
  },
  {
    id: 'golden', species: '금빛이', species_en: 'Goldie 1', rarity: 'rare', coat: 'golden',
    desc: '특별한 밥 냄새를 맡고 온다는 황금빛 털. 만나면 그날은 운이 좋다.',
    desc_en: '',
    likes: 'gift_can',
  },
  {
    id: 'golden2', species: '금동이', species_en: 'Goldie 2', rarity: 'rare', coat: 'golden',
    desc: '햇빛을 받으면 진짜로 반짝인다.',
    desc_en: '',
    likes: 'gift_churu_tuna',
  },
  {
    id: 'golden3', species: '보름이', species_en: 'Goldie 3', rarity: 'rare', coat: 'golden',
    desc: '보름달 뜬 밤에만 온다는 이야기가 있다.',
    desc_en: '',
    likes: 'gift_matatabi',
  },
  {
    id: 'golden4', species: '노을', species_en: 'Goldie 4', rarity: 'rare', coat: 'golden',
    desc: '해 질 무렵에만 만날 수 있다.',
    desc_en: '',
    likes: 'gift_can',
  },
  {
    id: 'ghost', species: '몽실이', species_en: 'Wisp 1', rarity: 'rare', coat: 'ghost',
    desc: '밤에만 보인다는 하얀 냥이. 사진에는 아주 흐리게 찍힌다.',
    desc_en: '',
    likes: 'gift_matatabi',
  },
  {
    id: 'ghost2', species: '안개비', species_en: 'Wisp 2', rarity: 'rare', coat: 'ghost',
    desc: '비 오는 새벽에만 잠깐 스친다.',
    desc_en: '',
    likes: 'gift_churu_crab',
  },
  {
    id: 'ghost3', species: '새벽', species_en: 'Wisp 3', rarity: 'rare', coat: 'ghost',
    desc: '아침이 오면 사라지고 없다.',
    desc_en: '',
    likes: 'gift_matatabi',
  },
  {
    id: 'king3', species: '두목', species_en: 'Boss 3', rarity: 'rare', coat: 'king',
    desc: '골목을 순찰한다. 다른 냥이들이 자리를 비켜 준다.',
    desc_en: '',
    likes: 'gift_churu_crab',
  },
  {
    id: 'king4', species: '대감', species_en: 'Boss 4', rarity: 'rare', coat: 'king',
    desc: '느긋하게 왔다가 느긋하게 간다.',
    desc_en: '',
    likes: 'gift_churu_chicken',
  },
  {
    id: 'mackerel8', species: '비단이', species_en: 'Mack 8', rarity: 'rare', coat: 'mackerel',
    desc: '줄무늬에 윤기가 흐른다. 아무나 만지게 두지 않는다.',
    desc_en: '',
    likes: 'gift_churu_chicken',
  },
  {
    id: 'berry', species: '딸기', species_en: 'Berry 1', rarity: 'legend', coat: 'berry',
    desc: '어디서 얻었는지 모를 딸기 옷을 입고 다닌다. 단 한 마리뿐이라는 골목의 전설.',
    desc_en: '',
    likes: 'gift_churu_tuna',
  },
];

const CAT_BY_ID = {};
CATS.forEach(function (c) { CAT_BY_ID[c.id] = c; });

/* ================= 상점 ================= */

const BOWLS = [
  {
    id: 'bowl_basic', name: '이 빠진 밥그릇', name_en: 'Chipped Bowl', price: 0, cap: 3, lure: 0,
    desc: '원래 집에 있던 그릇. 한 번에 3알까지 담긴다.',
    desc_en: 'The one you already had. Holds 3 at a time.',
  },
  {
    id: 'bowl_ceramic', name: '하얀 사기 그릇', name_en: 'White Ceramic', price: 3, gold: true, cap: 5, lure: 1,
    desc: '5알까지. 냥이들이 조금 더 자주 들른다.',
    desc_en: 'Holds 5. Cats drop by a little more often.',
  },
  {
    id: 'bowl_wood', name: '나무 밥그릇', name_en: 'Wooden Bowl', price: 8, gold: true, cap: 7, lure: 2,
    desc: '7알까지. 귀한 냥이가 찾아올 확률이 올라간다.',
    desc_en: 'Holds 7. Better odds for rare cats.',
  },
  {
    id: 'bowl_gold', name: '금테 밥그릇', name_en: 'Gilded Bowl', price: 20, gold: true, cap: 10, lure: 3,
    desc: '10알까지. 전설의 냥이도 그냥 지나치지 못한다.',
    desc_en: 'Holds 10. Even legends stop for this one.',
  },
];

const BOWL_BY_ID = {};
BOWLS.forEach(function (b) { BOWL_BY_ID[b.id] = b; });

const GIFTS = [
  {
    id: 'gift_yarn', name: '털실 뭉치', name_en: 'Yarn Ball', price: 1, gold: true, aff: 2,
    desc: '굴려 주면 한참 논다. 친밀도 +2',
    desc_en: 'Roll it and they play for ages. Affection +2',
  },
  {
    id: 'gift_churu_tuna', name: '참치 츄르', name_en: 'Tuna Churu', price: 2, gold: true, aff: 3,
    desc: '짜서 주면 앞발부터 들이민다. 친밀도 +3',
    desc_en: 'Squeeze it and the paws come running. Affection +3',
  },
  {
    id: 'gift_can', name: '참치 캔', name_en: 'Tuna Can', price: 2, gold: true, aff: 3,
    desc: '못 이기는 척 다가온다. 친밀도 +3',
    desc_en: 'They pretend not to care, then come closer. Affection +3',
  },
  {
    id: 'gift_churu_chicken', name: '닭가슴살 츄르', name_en: 'Chicken Churu', price: 3, gold: true, aff: 4,
    desc: '한 줄로는 절대 안 끝난다. 친밀도 +4',
    desc_en: 'One tube is never enough. Affection +4',
  },
  {
    id: 'gift_cushion', name: '작은 방석', name_en: 'Little Cushion', price: 4, gold: true, aff: 4,
    desc: '자리를 깔아 주면 더 오래 머문다. 친밀도 +4',
    desc_en: 'Lay it down and they stay much longer. Affection +4',
  },
  {
    id: 'gift_churu_crab', name: '게맛살 츄르', name_en: 'Crab Churu', price: 5, gold: true, aff: 5,
    desc: '이거 하나면 낯가림도 사라진다. 친밀도 +5',
    desc_en: 'Even the shyest cat gives in. Affection +5',
  },
  {
    id: 'gift_matatabi', name: '마따따비', name_en: 'Matatabi Stick', price: 6, gold: true, aff: 6,
    desc: '한 번 맡으면 잊지 못한다. 친밀도 +6',
    desc_en: 'One sniff and they never forget you. Affection +6',
  },
  {
    id: 'item_bell', name: '딸랑 방울', name_en: 'Jingle Bell', price: 3, gold: true, aff: 0, summon: true,
    desc: '흔들면 근처 냥이가 바로 찾아온다. 밥그릇에 밥이 있어야 한다.',
    desc_en: 'Ring it and a nearby cat comes over. Needs food in the bowl.',
  },
];

const GIFT_BY_ID = {};
GIFTS.forEach(function (g) { GIFT_BY_ID[g.id] = g; });

/* ================= 기본 할 일 ================= */

const DEFAULT_TODOS = [
  { text: '밥그릇을 눌러 밥을 담아 보세요', text_en: 'Tap the bowl to fill it', star: false },
  { text: '냥이가 오면 사진을 찍어 보세요', text_en: 'Snap a photo when a cat visits', star: false },
  { text: '사진을 찍으면 이름을 지어 줄 수 있어요', text_en: 'Name the cat after the photo', star: false },
  { text: '별표 할 일을 끝내면 황금 사료가 생겨요', text_en: 'Star a to-do to earn golden kibble', star: true },
  { text: '상점에서 선물을 사서 냥이에게 주세요', text_en: 'Buy a gift and give it to a cat', star: false },
  { text: '이 안내는 지우고 내 할 일을 적어 보세요', text_en: 'Clear these and write your own', star: false },
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

const APP_INFO = {
  version: '1.0',
  author: 'momdi',
  home: 'https://www.heymomdi.com/',
  mail: 'merrymerim@gmail.com',
};
