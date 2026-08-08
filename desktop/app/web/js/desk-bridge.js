/* ===========================================================
   데스크톱 브리지 — 이 창이 상태의 주인이고,
   바탕화면 오버레이(냥이·밥그릇)와 사료/밥을 주고받는다.
   =========================================================== */
(function () {
  if (!window.desk) return;                 /* 웹으로 열면 아무것도 안 한다 */

  document.documentElement.classList.add('is-desktop');

  function snapshot() {
    const s = State.data;
    return { kibble: s.kibble, special: s.special, food: s.food, cap: State.capacity() };
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

  window.desk.onFeed(function (mode) {
    const s = State.data;
    const room = State.capacity() - s.food.n;
    if (room <= 0) return;
    const amount = mode === 'one' ? 1 : room;
    const r = State.feed('normal', amount);
    if (r.ok) {
      Sound.play('drop');
      UI.renderHeader();
      UI.renderScene();
      push();
    } else {
      Sound.play('nope');
      UI.toast(r.reason);
    }
  });

  window.desk.onMet(function (breed) {
    State.meetCat(breed);
    UI.renderHeader();
    push();
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
