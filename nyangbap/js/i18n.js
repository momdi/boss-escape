/* ===========================================================
   츄두리스트 / ChewDoList — 다국어 (ko / en)
   =========================================================== */

const I18N_TEXT = {
  ko: {
    appName: '츄두리스트',
    docTitle: '츄두리스트 (베타) — 오늘의 할 일',

    /* 재화 */
    currency: '사료',
    currencyUnit: '알',
    currencySpecial: '황금 사료',

    /* 탭 / 페이지 */
    tabHome: '메모',
    tabLog: '캘린더',
    tabAlbum: '도감',
    tabShop: '상점',
    todayTitle: '오늘의 할 일',
    notesTitle: '중요한 일',
    notesPlaceholder: '중요한 일 (매일 남아요)',
    notesAdd: '중요한 일 추가',
    notesDue: '날짜를 정하면 D-day가 표시돼요',
    dday: 'D-{n}',
    ddayToday: 'D-DAY',
    ddayPast: 'D+{n}',
    addPlaceholder: '할 일 추가',
    addAria: '추가',
    albumTitle: '냥이 도감',
    albumCount: '{n} / {total} 마리',
    shopTitle: '상점',
    shopBowl: '밥그릇',
    shopGift: '선물',
    logTitle: '지난 기록',
    logSub: '진하게 칠해진 날일수록 열심히 한 날이에요',
    settingsTitle: '설정',

    /* 헤더 / 씬 */
    feedTitle: '밥그릇에 담기',
    giftAria: '선물 주기',
    camAria: '사진 찍기',
    settingsAria: '설정',
    hintFeed: '밥그릇을 눌러 밥을 담아 주세요',
    hintNoFood: '할 일을 체크하면 {c}가 생겨요',
    hintWait: '밥을 두고 기다리면 냥이가 찾아와요',
    hintShoot: '카메라로 찍어 도감에 남겨 보세요',

    /* 할 일 */
    aDone: '{t} 완료',
    aUndone: '{t} 완료 취소',
    aGot: '{c} 획득함',
    aStarOn: '특별한 할 일로 지정',
    aStarOff: '특별한 할 일 해제',
    aDel: '{t} 삭제',
    gotKibble: '{c} +{n}',
    gotSpecial: '{cs}이 생겼어요',
    bonusStreak: '{n}개 달성! {cs} +{b}',
    bonusAll: '오늘 할 일 전부 완료! {c} +{b}',
    starMax: '특별한 할 일은 하루 {n}개까지예요',
    starSet: '특별한 할 일로 정했어요',
    alreadyDone: '이미 끝낸 할 일이에요',
    newDay: '새로운 하루예요. 할 일을 다시 체크해 보세요',

    /* 밥 담기 시트 */
    feedSub: '{bowl} · {n} / {cap}알 담겨 있어요',
    feedOne: '{c} 한 알 담기',
    feedOneSub: '보유 {n}알',
    feedFull: '가득 채우기',
    feedFullSub: '빈자리만큼 한 번에',
    feedSpecial: '{cs} 담기',
    feedSpecialHave: '보유 {n}개 · 귀한 냥이가 올 확률이 크게 올라가요',
    feedSpecialNone: '★ 할 일을 끝내면 생겨요',
    put: '담기',
    fedNormal: '{c} {n}알을 담았어요',
    fedSpecial: '{cs}을 담았어요',
    bowlFull: '밥그릇이 가득 찼어요',
    noSpecial: '{cs}이 없어요',
    noKibble: '{c}가 없어요',
    bellUse: '{name} 흔들기',
    bellSub: '보유 {n}개 · 냥이를 바로 부른다',
    shake: '흔들기',

    /* 선물 */
    giftTitle: '선물 주기',
    giftSub: '{name}에게 무엇을 줄까요',
    giftHave: '{n}개 보유 · 친밀도 +{aff}{fav}',
    giftFav: ' (좋아하는 선물!)',
    give: '주기',
    giftNone: '가진 선물이 없어요. 상점에서 살 수 있어요.',
    giftLiked: '{name}이(가) 좋아해요{fav}',
    giftFavToast: ' (최애 선물!)',
    becameRegular: '{name}이(가) 단골이 되었어요',

    /* 도감 / 이름 */
    unknown: '？？？',
    visits: '{n}번 방문',
    regular: '단골',
    nameTitle: '이름 지어 주기',
    nameSub: '{species}에게 부를 이름을 정해 주세요',
    later: '나중에',
    nameOk: '이 이름으로',
    named: '이제 {name}(이)라고 부를게요',
    notMet: '아직 만나지 못했어요',
    notMetCommon: '밥그릇에 밥을 담아 두고 기다려 보세요.',
    notMetRare: '{cs}을 담아 두면 만날 확률이 올라가요.',
    mVisit: '방문',
    mVisitN: '{n}번',
    mAff: '친밀도',
    mLikes: '좋아하는 것',
    noPhoto: '아직 사진이 없어요',
    photoAlt: '{name} 사진',
    photoSaved: '사진을 도감에 담았어요',
    close: '닫기',
    rename: '이름 바꾸기',

    /* 방문 */
    newVisitor: '처음 보는 {rarity}가 찾아왔어요',
    visitorCame: '{name} 왔다',
    visitorLeft: '{name}이(가) 돌아갔어요',

    /* 상점 */
    buyPrice: '{c} {n}',
    inUse: '사용 중',
    owned: '보유 중',
    ownedN: '{n}개 보유',
    swap: '바꾸기',
    bought: '{name}을(를) 샀어요',
    cantBuy: '살 수 없어요',
    already: '이미 가지고 있어요',
    notEnough: '{c}가 모자라요',
    notEnoughGold: '{cs}이 모자라요',
    buyPriceGold: '{cs} {n}',
    bowlSwapped: '밥그릇을 바꿨어요',
    emptyFirst: '담긴 밥을 먼저 비워 주세요',
    howTo: '놀이 방법 보기',

    /* 가이드 */
    guideTitle: '츄두리스트 놀이 방법',
    guideSub: '하루 할 일을 체크하고 길냥이를 모아요',
    g1a: '할 일을 체크하면', g1b: '{c}가 한 알씩 생겨요.',
    g2a: '★ 특별한 할 일', g2b: '끝내면 {cs}이 생겨요. 하루 {n}개까지 지정할 수 있어요.',
    g3a: '하루 {n}개를 넘기면', g3b: '{cs}을 덤으로 받아요.',
    g4a: '밥그릇을 누르면', g4b: '밥을 담을 수 있어요. 밥이 있어야 냥이가 찾아와요.',
    g5a: '{cs}을 담으면', g5b: '귀하거나 전설의 냥이가 올 수 있어요.',
    g6a: '냥이가 오면', g6b: '카메라로 찍어 도감에 남기고 이름을 지어 주세요.',
    g7a: '선물을 주면', g7b: '친밀도가 올라가고, 단골이 되면 더 자주 들러요.',
    gotIt: '알겠어요',

    /* 기록 / 캘린더 */
    logDone: '완료 {n}개',
    logNone: '기록 없음',
    logToday: '오늘',
    logTotal: '이 달 완료 {n}개 · {d}일 활동',
    logLegendLow: '적음',
    logLegendHigh: '많음',
    logStreak: '연속 {n}일',
    prevMonth: '지난달',
    nextMonth: '다음달',
    monthFmt: '{y}년 {m}월',
    weekdayShort: ['일', '월', '화', '수', '목', '금', '토'],
    weekday: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    dateFmt: '{y}-{m}-{d} {w}',

    /* 설정 */
    setLang: '언어 / Language',
    setLangKo: '한국어',
    setLangEn: 'English',
    setSound: '효과음',
    setSoundOn: '켜기',
    setSoundOff: '끄기',
    setUpdate: '업데이트',
    setUpdateBtn: '최신 버전 확인',
    setUpdateSub: '새 버전이 있으면 받아옵니다. 냥이 도감과 기록은 그대로예요.',
    setUpdateDone: '최신 버전이에요',
    setData: '데이터',
    setReset: '처음부터 다시 시작',
    setResetSub: '모아 둔 냥이와 기록이 모두 사라져요',
    setResetAsk: '정말 다시 시작할까요?',
    setResetSub2: '되돌릴 수 없어요',
    cancel: '취소',
    confirmReset: '지우고 시작',
    resetDone: '처음부터 다시 시작했어요',
    setAbout: '만든 사람',
    madeBy: 'made by momdi',
    setHome: '홈페이지',
    setMail: '메일',
    setVersion: '버전',

    /* 희귀도 */
    r_common: '길냥이',
    r_rare: '귀한 냥이',
    r_legend: '전설의 냥이',
  },

  en: {
    appName: 'ChewDoList',
    docTitle: 'ChewDoList — Today',

    currency: 'Kibble',
    currencyUnit: '',
    currencySpecial: 'Golden Kibble',

    tabHome: 'Notes',
    tabLog: 'Calendar',
    tabAlbum: 'Cats',
    tabShop: 'Shop',
    todayTitle: "Today's To-do",
    notesTitle: "Don't forget",
    notesPlaceholder: 'Something important',
    notesAdd: 'Add important item',
    notesDue: 'Pick a date to show a countdown',
    dday: 'D-{n}',
    ddayToday: 'D-DAY',
    ddayPast: 'D+{n}',
    addPlaceholder: 'Add a to-do',
    addAria: 'Add',
    albumTitle: 'Cat Album',
    albumCount: '{n} / {total} found',
    shopTitle: 'Shop',
    shopBowl: 'Bowls',
    shopGift: 'Gifts',
    logTitle: 'History',
    logSub: 'The darker the day, the harder you worked',
    settingsTitle: 'Settings',

    feedTitle: 'Fill the bowl',
    giftAria: 'Give a gift',
    camAria: 'Take a photo',
    settingsAria: 'Settings',
    hintFeed: 'Tap the bowl to fill it',
    hintNoFood: 'Check off a to-do to earn {c}',
    hintWait: 'Leave the food out and a cat will drop by',
    hintShoot: 'Snap a photo for your album',

    aDone: 'Complete {t}',
    aUndone: 'Undo {t}',
    aGot: '{c} earned',
    aStarOn: 'Mark as special',
    aStarOff: 'Unmark special',
    aDel: 'Delete {t}',
    gotKibble: '{c} +{n}',
    gotSpecial: 'Got a {cs}',
    bonusStreak: '{n} done! {cs} +{b}',
    bonusAll: 'All done today! {c} +{b}',
    starMax: 'Up to {n} special to-dos a day',
    starSet: 'Marked as special',
    alreadyDone: 'Already finished',
    newDay: "It's a new day. Time to check things off",

    feedSub: '{bowl} · {n} / {cap} in the bowl',
    feedOne: 'Add one {c}',
    feedOneSub: 'You have {n}',
    feedFull: 'Fill it up',
    feedFullSub: 'Fill every empty spot',
    feedSpecial: 'Add a {cs}',
    feedSpecialHave: 'You have {n} · much better odds for rare cats',
    feedSpecialNone: '★ Finish special to-dos to earn one',
    put: 'Add',
    fedNormal: 'Added {n} {c}',
    fedSpecial: 'Added a {cs}',
    bowlFull: 'The bowl is full',
    noSpecial: 'No {cs} left',
    noKibble: 'No {c} left',
    bellUse: 'Ring the {name}',
    bellSub: 'You have {n} · calls a cat right away',
    shake: 'Ring',

    giftTitle: 'Give a gift',
    giftSub: 'What should {name} get?',
    giftHave: 'You have {n} · affection +{aff}{fav}',
    giftFav: ' (favorite!)',
    give: 'Give',
    giftNone: 'No gifts yet. You can buy some in the shop.',
    giftLiked: '{name} loves it{fav}',
    giftFavToast: ' (all-time favorite!)',
    becameRegular: '{name} became a regular',

    unknown: '???',
    visits: '{n} visits',
    regular: 'Regular',
    nameTitle: 'Give a name',
    nameSub: 'What should this {species} be called?',
    later: 'Later',
    nameOk: 'Use this name',
    named: "I'll call them {name} from now on",
    notMet: 'Not met yet',
    notMetCommon: 'Leave some food in the bowl and wait.',
    notMetRare: 'A {cs} in the bowl raises your chances.',
    mVisit: 'Visits',
    mVisitN: '{n}',
    mAff: 'Affection',
    mLikes: 'Favorite',
    noPhoto: 'No photo yet',
    photoAlt: 'Photo of {name}',
    photoSaved: 'Photo saved to the album',
    close: 'Close',
    rename: 'Rename',

    newVisitor: 'A new {rarity} came by',
    visitorCame: '{name} is here',
    visitorLeft: '{name} went home',

    buyPrice: '{n} {c}',
    inUse: 'In use',
    owned: 'Owned',
    ownedN: '{n} owned',
    swap: 'Switch',
    bought: 'Bought {name}',
    cantBuy: "Can't buy that",
    already: 'Already owned',
    notEnough: 'Not enough {c}',
    notEnoughGold: 'Not enough {cs}',
    buyPriceGold: '{n} {cs}',
    bowlSwapped: 'Switched the bowl',
    emptyFirst: 'Empty the bowl first',
    howTo: 'How to play',

    guideTitle: 'How ChewDoList works',
    guideSub: 'Check off your day and collect stray cats',
    g1a: 'Check off a to-do', g1b: 'and you earn one {c}.',
    g2a: '★ Special to-dos', g2b: 'give you a {cs}. Up to {n} a day.',
    g3a: 'Finish {n} in a day', g3b: 'for a bonus {cs}.',
    g4a: 'Tap the bowl', g4b: 'to fill it. Cats only come if there is food.',
    g5a: 'A {cs} in the bowl', g5b: 'can bring rare or legendary cats.',
    g6a: 'When a cat shows up', g6b: 'snap a photo and give them a name.',
    g7a: 'Gifts', g7b: 'raise affection — regulars visit far more often.',
    gotIt: 'Got it',

    logDone: '{n} done',
    logNone: 'Nothing logged',
    logToday: 'Today',
    logTotal: '{n} done this month · {d} active days',
    logLegendLow: 'Less',
    logLegendHigh: 'More',
    logStreak: '{n} day streak',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    monthFmt: '{mn} {y}',
    weekdayShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    weekday: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dateFmt: '{w}, {mn} {d}',

    setLang: 'Language / 언어',
    setLangKo: '한국어',
    setLangEn: 'English',
    setSound: 'Sound',
    setSoundOn: 'On',
    setSoundOff: 'Off',
    setUpdate: 'Update',
    setUpdateBtn: 'Check for updates',
    setUpdateSub: 'Fetches the latest version. Your album and history stay put.',
    setUpdateDone: 'You are up to date',
    setData: 'Data',
    setReset: 'Start over',
    setResetSub: 'Every cat and record will be gone',
    setResetAsk: 'Really start over?',
    setResetSub2: "This can't be undone",
    cancel: 'Cancel',
    confirmReset: 'Erase & restart',
    resetDone: 'Started over',
    setAbout: 'About',
    madeBy: 'made by momdi',
    setHome: 'Homepage',
    setMail: 'Mail',
    setVersion: 'Version',

    r_common: 'Stray',
    r_rare: 'Rare cat',
    r_legend: 'Legendary cat',
  },
};

const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const T = (function () {
  function lang() {
    try {
      const l = State.data && State.data.lang;
      return l === 'en' ? 'en' : 'ko';
    } catch (e) { return 'ko'; }
  }

  function raw(key) {
    const d = I18N_TEXT[lang()] || I18N_TEXT.ko;
    return d[key] !== undefined ? d[key] : I18N_TEXT.ko[key];
  }

  /** 문자열 치환. {c}/{cs}는 재화 이름으로 자동 채움 */
  function t(key, p) {
    let v = raw(key);
    if (v === undefined) return key;
    if (typeof v !== 'string') return v;
    const vars = Object.assign({ c: raw('currency'), cs: raw('currencySpecial') }, p || {});
    for (const k in vars) v = v.split('{' + k + '}').join(vars[k]);
    return v;
  }

  /** 데이터 객체의 언어별 필드 (name / name_en) */
  function tx(obj, field) {
    if (!obj) return '';
    if (lang() === 'en' && obj[field + '_en']) return obj[field + '_en'];
    return obj[field] || '';
  }

  function rarityLabel(r) { return t('r_' + r); }

  /** 오늘 날짜 라벨 */
  function dateLabel(d) {
    const dt = d || new Date();
    const p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return t('dateFmt', {
      y: dt.getFullYear(), m: p(dt.getMonth() + 1), d: dt.getDate(),
      w: raw('weekday')[dt.getDay()], mn: MONTH_EN[dt.getMonth()],
    });
  }

  function monthLabel(y, m) {
    return t('monthFmt', { y: y, m: m + 1, mn: MONTH_EN[m] });
  }

  /** data-i18n 속성이 붙은 정적 노드를 갱신 */
  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(function (n) { n.textContent = t(n.dataset.i18n); });
    scope.querySelectorAll('[data-i18n-ph]').forEach(function (n) { n.placeholder = t(n.dataset.i18nPh); });
    scope.querySelectorAll('[data-i18n-al]').forEach(function (n) { n.setAttribute('aria-label', t(n.dataset.i18nAl)); });
    scope.querySelectorAll('[data-i18n-ti]').forEach(function (n) { n.title = t(n.dataset.i18nTi); });
    document.title = t('docTitle');
    document.documentElement.lang = lang();
  }

  return {
    t: t, tx: tx, raw: raw, lang: lang, apply: apply,
    rarityLabel: rarityLabel, dateLabel: dateLabel, monthLabel: monthLabel,
  };
})();
