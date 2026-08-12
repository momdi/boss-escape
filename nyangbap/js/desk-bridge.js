/* ===========================================================
   데스크톱 브리지 — 이 창이 상태의 주인이고,
   바탕화면 오버레이(냥이·밥그릇)와 사료/밥을 주고받는다.
   =========================================================== */
(function () {
  if (!window.desk) return;                 /* 웹으로 열면 아무것도 안 한다 */

  document.documentElement.classList.add('is-desktop');

  /* 냥이는 바탕화면에만 산다. 창 안의 시뮬레이션은 멈춘다. */
  Scene.hooks.canSpawn = function () { return false; };
  Scene.hooks.onArrive = function () {};
  Scene.hooks.onLeave = function () {};
  Scene.leaveAll();
  Scene.visitors.length = 0;

  function snapshot() {
    const s = State.data;
    const gifts = GIFTS.filter(function (g) { return (s.inventory[g.id] || 0) > 0; })
      .map(function (g) {
        return { id: g.id, name: T.tx(g, 'name'), n: s.inventory[g.id], summon: !!g.summon };
      });
    return {
      kibble: s.kibble, special: s.special, food: s.food,
      cap: State.capacity(), gifts: gifts,
      /* 메인 쪽 state.bowl 은 밥그릇 '위치'라 이름이 겹친다 — id 는 따로 보낸다 */
      bowlId: s.bowl,
    };
  }

  let pushTimer = null;
  function push() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { window.desk.pushState(snapshot()); }, 30);
  }

  /* 상태가 바뀔 때마다 오버레이에 알린다 */
  State.on(push);

  /* 오버레이에서 온 요청 */
  window.desk.onEat(function () {
    const g = State.eatOne();
    if (g) { UI.renderHeader(); push(); }
  });

  let lastPut = 0;

  window.desk.onFeed(function (mode) {
    const s = State.data;
    const room = State.capacity() - s.food.n;
    if (room <= 0) return;
    const amount = mode === 'one' ? 1 : room;
    const r = State.feed('normal', amount);
    if (r.ok) {
      lastPut = r.put;
      /* 소리는 바탕화면 쪽에서 한 번만 낸다 (양쪽에서 나면 따닥 하고 겹친다) */
      UI.renderHeader();
      UI.renderScene();
      push();
    } else {
      Sound.play('nope');
      UI.toast(r.reason);
    }
  });

  /* 황금 사료 담기 */
  window.desk.onFeedSpecial(function () {
    const r = State.feed('special', 1);
    if (r.ok) { UI.renderHeader(); push(); }
    else { Sound.play('nope'); UI.toast(r.reason); }
  });

  /* 선물 주기 — 친밀도는 웹 앱이 계산한다 */
  window.desk.onGift(function (p) {
    const gift = GIFT_BY_ID[p.id];
    if (!gift) return;
    if (!State.useGift(gift.id)) { Sound.play('nope'); return; }
    if (gift.summon) { Sound.play('bell'); push(); return; }
    const info = CAT_BY_ID[p.breed];
    const bonus = info && info.likes === gift.id ? 2 : 0;
    State.addAff(p.breed, gift.aff + bonus);
    Sound.play('gift');
    const rec = State.data.cats[p.breed] || {};
    UI.toast(T.t('giftLiked', {
      name: rec.name || (info ? T.tx(info, 'species') : ''),
      fav: bonus ? T.t('giftFavToast') : '',
    }));
    push();
  });

  function nameOf(breed) {
    const info = CAT_BY_ID[breed];
    const rec = State.data.cats[breed];
    return (rec && rec.name) || (info ? T.tx(info, 'species') : breed);
  }

  /* 더블클릭으로 창을 열 때, 직전 클릭으로 담긴 밥을 되돌린다 */
  window.desk.onUndoFeed(function () {
    const s = State.data;
    const back = Math.min(s.food.n, lastPut);
    if (back > 0) {
      s.food.n -= back;
      s.kibble += back;
      UI.renderHeader();
      push();
    }
    lastPut = 0;
  });

  window.desk.onMet(function (breed) {
    const res = State.meetCat(breed);
    const info = CAT_BY_ID[breed];
    window.desk.notice(res.isNew && info
      ? T.t('newVisitor', { rarity: T.rarityLabel(info.rarity) })
      : T.t('visitorCame', { name: nameOf(breed) }));
    UI.renderHeader();
    push();
  });

  window.desk.onPhoto(function (p) {
    if (!p || !p.url) return;
    const rec = State.data.cats[p.breed];
    const first = !rec || !rec.photo;
    State.setPhoto(p.breed, p.url);
    if (first) State.addAff(p.breed, RULES.photoAff);
    window.desk.notice(T.t('photoSaved'));
    UI.renderHeader();
    push();
  });

  window.desk.onLeft(function (breed) {
    window.desk.notice(T.t('visitorLeft', { name: nameOf(breed) }));
  });

  /* 게임 메시지는 메모 창 대신 바탕화면 밥그릇 옆에 */
  const origToast = UI.toast;
  UI.toast = function (msg) {
    if (!msg) return;
    window.desk.notice(msg);
  };
  window.deskOrigToast = origToast;

  /* 첫 동기화 */
  setTimeout(push, 100);
})();
