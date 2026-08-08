/* ===========================================================
   냥밥 — 저장 / 하루 넘김 / 재화
   =========================================================== */

const SAVE_KEY = 'nyangbap.v1';

const State = (function () {
  let s = null;
  const listeners = [];

  function todayKey(d) {
    const t = d || new Date();
    const p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate());
  }

  function fresh() {
    let lang = 'ko';
    try { lang = /^ko/i.test(navigator.language || '') ? 'ko' : 'en'; } catch (e) { lang = 'ko'; }
    return {
      v: 2,
      date: todayKey(),
      lang: lang,
      sound: true,
      kibble: 0,
      special: 0,
      todos: DEFAULT_TODOS.map(function (t, i) {
        return { id: 't' + Date.now() + i, def: i, text: t.text, star: t.star, done: false };
      }),
      history: {},
      bonusGiven: false,
      allDoneGiven: false,
      bowl: 'bowl_basic',
      bowls: ['bowl_basic'],
      food: { n: 0, special: 0 },
      inventory: {},
      cats: {},
      streak: 0,
      totalDone: 0,
      seenGuide: false,
    };
  }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { raw = null; }
    if (!raw) {
      s = fresh();
      return;
    }
    try {
      s = JSON.parse(raw);
    } catch (e) {
      s = fresh();
      return;
    }
    const base = fresh();
    for (const k in base) if (!(k in s)) s[k] = base[k];
    rollover();
  }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* 저장 공간 부족 */ }
  }

  /** 날짜가 바뀌었으면 체크만 초기화한다 (도감 / 츄알은 유지) */
  function rollover() {
    const t = todayKey();
    if (s.date === t) return false;
    const doneCount = s.todos.filter(function (x) { return x.done; }).length;
    stamp();
    s.streak = doneCount > 0 ? (s.streak || 0) + 1 : 0;
    s.todos.forEach(function (x) { x.done = false; });
    s.date = t;
    s.bonusGiven = false;
    s.allDoneGiven = false;
    save();
    return true;
  }

  /** 오늘 달성 현황을 기록에 남긴다 */
  function stamp() {
    if (!s.history) s.history = {};
    const done = s.todos.filter(function (x) { return x.done; }).length;
    if (done <= 0) { delete s.history[s.date]; return; }
    s.history[s.date] = { d: done, t: s.todos.length };
  }

  function history() { return s.history || {}; }

  /** 오늘까지 이어진 연속 달성일 */
  function streakDays() {
    const h = s.history || {};
    const d = new Date();
    let n = 0;
    for (let i = 0; i < 400; i++) {
      const k = todayKey(d);
      if (h[k] && h[k].d > 0) n++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  function setLang(l) {
    s.lang = l === 'en' ? 'en' : 'ko';
    emit({ type: 'lang' });
  }

  function setSound(on) {
    s.sound = !!on;
    emit({ type: 'sound' });
  }

  function on(fn) { listeners.push(fn); }
  function emit(evt) {
    save();
    listeners.forEach(function (fn) { fn(evt || {}); });
  }

  /* ---------- 할 일 ---------- */

  function addTodo(text) {
    const v = (text || '').trim();
    if (!v) return null;
    const item = { id: 't' + Date.now() + Math.floor(Math.random() * 100), text: v, star: false, done: false };
    s.todos.push(item);
    stamp();
    emit({ type: 'todos' });
    return item;
  }

  function removeTodo(id) {
    s.todos = s.todos.filter(function (x) { return x.id !== id; });
    stamp();
    emit({ type: 'todos' });
  }

  function starCount() {
    return s.todos.filter(function (x) { return x.star; }).length;
  }

  function toggleStar(id) {
    const t = s.todos.find(function (x) { return x.id === id; });
    if (!t) return { ok: false };
    if (!t.star && starCount() >= RULES.maxStars) {
      return { ok: false, reason: T.t('starMax', { n: RULES.maxStars }) };
    }
    t.star = !t.star;
    emit({ type: 'todos' });
    return { ok: true, star: t.star };
  }

  /** 체크 → 밥알 획득. 되돌리면 회수한다. */
  function toggleDone(id) {
    const t = s.todos.find(function (x) { return x.id === id; });
    if (!t) return null;
    t.done = !t.done;

    const gain = { kibble: 0, special: 0, bonus: null };
    if (t.done) {
      gain.kibble += RULES.kibblePerTodo;
      if (t.star) gain.special += RULES.specialPerStar;
      s.totalDone++;
    } else {
      gain.kibble -= RULES.kibblePerTodo;
      if (t.star) gain.special -= RULES.specialPerStar;
      s.totalDone = Math.max(0, s.totalDone - 1);
    }

    const done = s.todos.filter(function (x) { return x.done; }).length;
    if (!s.bonusGiven && done >= RULES.bonusAt) {
      s.bonusGiven = true;
      gain.special += RULES.bonusSpecial;
      gain.bonus = T.t('bonusStreak', { n: RULES.bonusAt, b: RULES.bonusSpecial });
    }
    if (!s.allDoneGiven && s.todos.length >= 3 && done === s.todos.length) {
      s.allDoneGiven = true;
      gain.kibble += RULES.allDoneKibble;
      gain.bonus = T.t('bonusAll', { b: RULES.allDoneKibble });
    }

    s.kibble = Math.max(0, s.kibble + gain.kibble);
    s.special = Math.max(0, s.special + gain.special);
    stamp();
    emit({ type: 'todos' });
    return { todo: t, gain: gain };
  }

  /* ---------- 밥그릇 ---------- */

  function capacity() {
    const b = BOWL_BY_ID[s.bowl] || BOWLS[0];
    return b.cap;
  }

  function foodTotal() { return s.food.n; }

  function feed(kind, amount) {
    const cap = capacity();
    const room = cap - s.food.n;
    if (room <= 0) return { ok: false, reason: T.t('bowlFull') };
    let put = Math.min(room, amount);
    if (kind === 'special') {
      put = Math.min(put, s.special);
      if (put <= 0) return { ok: false, reason: T.t('noSpecial') };
      s.special -= put;
      s.food.special += put;
    } else {
      put = Math.min(put, s.kibble);
      if (put <= 0) return { ok: false, reason: T.t('noKibble') };
      s.kibble -= put;
    }
    s.food.n += put;
    emit({ type: 'food' });
    return { ok: true, put: put };
  }

  /** 고양이가 한 알 먹는다 */
  function eatOne() {
    if (s.food.n <= 0) return null;
    let special = false;
    if (s.food.special > 0) {
      special = true;
      s.food.special--;
    }
    s.food.n--;
    emit({ type: 'food' });
    return { special: special };
  }

  /* ---------- 상점 ---------- */

  function buy(id) {
    const bowl = BOWL_BY_ID[id];
    const gift = GIFT_BY_ID[id];
    const item = bowl || gift;
    if (!item) return { ok: false };
    if (bowl && s.bowls.indexOf(id) >= 0) return { ok: false, reason: T.t('already') };
    if (item.gold) {
      if (s.special < item.price) return { ok: false, reason: T.t('notEnoughGold') };
      s.special -= item.price;
    } else {
      if (s.kibble < item.price) return { ok: false, reason: T.t('notEnough') };
      s.kibble -= item.price;
    }
    if (bowl) {
      s.bowls.push(id);
      s.bowl = id;
    } else {
      s.inventory[id] = (s.inventory[id] || 0) + 1;
    }
    emit({ type: 'shop' });
    return { ok: true, item: item };
  }

  function useBowl(id) {
    if (s.bowls.indexOf(id) < 0) return false;
    if (s.food.n > capacity()) return false;
    s.bowl = id;
    emit({ type: 'food' });
    return true;
  }

  function useGift(id) {
    if (!s.inventory[id]) return false;
    s.inventory[id]--;
    if (s.inventory[id] <= 0) delete s.inventory[id];
    emit({ type: 'shop' });
    return true;
  }

  function giftCount() {
    let n = 0;
    for (const k in s.inventory) if (k !== 'item_bell') n += s.inventory[k];
    return n;
  }

  /* ---------- 도감 ---------- */

  function meetCat(id) {
    let rec = s.cats[id];
    const isNew = !rec;
    if (isNew) {
      rec = s.cats[id] = { name: '', visits: 0, aff: 0, photo: '', first: Date.now() };
    }
    rec.visits++;
    emit({ type: 'album' });
    return { rec: rec, isNew: isNew };
  }

  function nameCat(id, name) {
    const rec = s.cats[id];
    if (!rec) return;
    rec.name = (name || '').trim().slice(0, 8);
    emit({ type: 'album' });
  }

  function addAff(id, n) {
    const rec = s.cats[id];
    if (!rec) return 0;
    const before = rec.aff;
    rec.aff = Math.min(99, rec.aff + n);
    emit({ type: 'album' });
    return rec.aff - before;
  }

  function setPhoto(id, dataUrl) {
    const rec = s.cats[id];
    if (!rec) return;
    rec.photo = dataUrl;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    } catch (e) {
      rec.photo = '';
    }
    emit({ type: 'album' });
  }

  function metCount() { return Object.keys(s.cats).length; }

  function reset() {
    const lang = s ? s.lang : 'ko';
    const sound = s ? s.sound : true;
    s = fresh();
    s.lang = lang;
    s.sound = sound;
    emit({ type: 'reset' });
  }

  return {
    load: load,
    get data() { return s; },
    todayKey: todayKey,
    rollover: rollover,
    history: history,
    streakDays: streakDays,
    setLang: setLang,
    setSound: setSound,
    on: on,
    emit: emit,
    addTodo: addTodo,
    removeTodo: removeTodo,
    toggleStar: toggleStar,
    toggleDone: toggleDone,
    starCount: starCount,
    capacity: capacity,
    foodTotal: foodTotal,
    feed: feed,
    eatOne: eatOne,
    buy: buy,
    useBowl: useBowl,
    useGift: useGift,
    giftCount: giftCount,
    meetCat: meetCat,
    nameCat: nameCat,
    addAff: addAff,
    setPhoto: setPhoto,
    metCount: metCount,
    reset: reset,
  };
})();
