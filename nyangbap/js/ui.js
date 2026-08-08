/* ===========================================================
   냥밥 — 화면 그리기 / 시트
   =========================================================== */

const UI = (function () {
  const $ = function (id) { return document.getElementById(id); };

  const el = {};
  let toastTimer = 0;
  let shopTab = 'bowl';

  const ICON = {
    check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 7h2v2H2zM4 9h2v2H4zM6 11h2v2H6zM8 9h2v2H8zM10 7h2v2h-2zM12 5h2v2h-2zM14 3h2v2h-2z"/></svg>',
    star: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8l1.9 4 4.3.5-3.2 2.9.9 4.3L8 11.4 4.1 13.5l.9-4.3L1.8 6.3l4.3-.5z"/></svg>',
  };

  function cache() {
    ['hdDate', 'hdKibble', 'hdBowlIcon', 'hdSpecial', 'hdSpecialNum', 'hdFood',
      'todoList', 'addForm', 'addInput', 'albumGrid', 'albumCount', 'shopList',
      'tabs', 'toast', 'sheetWrap', 'sheet', 'sheetDim', 'camBtn', 'giftBtn',
      'sceneHint', 'scene', 'pageHome', 'pageAlbum', 'pageShop'].forEach(function (id) {
      el[id] = $(id);
    });
  }

  function pad3(n) {
    const v = Math.max(0, n | 0);
    return v < 10 ? '00' + v : v < 100 ? '0' + v : '' + v;
  }

  /* ================= 헤더 ================= */

  function renderHeader() {
    const s = State.data;
    const d = new Date();
    el.hdDate.textContent = State.todayKey() + ' ' + WEEKDAY[d.getDay()];
    el.hdKibble.textContent = pad3(s.kibble);

    el.hdBowlIcon.innerHTML = '';
    el.hdBowlIcon.appendChild(bowlIconEl(s.bowl, s.food.n, 34));

    if (s.special > 0) {
      el.hdSpecial.hidden = false;
      el.hdSpecialNum.textContent = s.special;
    } else {
      el.hdSpecial.hidden = true;
    }
  }

  /* ================= 할 일 ================= */

  function renderTodos() {
    const s = State.data;
    el.todoList.innerHTML = '';
    s.todos.forEach(function (t) {
      const li = document.createElement('li');
      li.className = 'todo' + (t.done ? ' done' : '') + (t.star ? ' star' : '');
      li.dataset.id = t.id;

      const hit = document.createElement('button');
      hit.type = 'button';
      hit.className = 'todo-hit';
      hit.setAttribute('aria-label', t.text + (t.done ? ' 완료 취소' : ' 완료'));
      hit.dataset.act = 'toggle';

      const box = document.createElement('span');
      box.className = 'todo-box';
      box.innerHTML = ICON.check;

      const txt = document.createElement('span');
      txt.className = 'todo-text';
      txt.textContent = t.text;

      const mark = document.createElement('button');
      mark.type = 'button';
      mark.className = 'todo-mark';
      mark.dataset.act = 'star';
      if (t.done) {
        mark.setAttribute('aria-label', '밥알 획득함');
        mark.appendChild(kibbleImg(t.star));
      } else {
        mark.setAttribute('aria-label', t.star ? '특별한 할 일 해제' : '특별한 할 일로 지정');
        mark.innerHTML = ICON.star;
      }

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'todo-del';
      del.dataset.act = 'del';
      del.textContent = '✕';
      del.setAttribute('aria-label', t.text + ' 삭제');

      li.appendChild(hit);
      li.appendChild(box);
      li.appendChild(txt);
      li.appendChild(mark);
      li.appendChild(del);
      el.todoList.appendChild(li);
    });
  }

  let kibbleUrl = '';
  let kibbleSpUrl = '';
  function kibbleImg(special) {
    if (!kibbleUrl) {
      kibbleUrl = KIBBLE.canvas.toDataURL();
      kibbleSpUrl = KIBBLE_SPECIAL.canvas.toDataURL();
    }
    const img = document.createElement('img');
    img.src = special ? kibbleSpUrl : kibbleUrl;
    img.alt = special ? '특별한 밥' : '밥알';
    img.width = 16;
    img.height = 16;
    return img;
  }

  /* ================= 도감 ================= */

  function renderAlbum() {
    const s = State.data;
    el.albumCount.textContent = State.metCount() + ' / ' + CATS.length + ' 마리';
    el.albumGrid.innerHTML = '';

    CATS.forEach(function (cat) {
      const rec = s.cats[cat.id];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'cat-card' + (rec ? '' : ' locked');
      card.dataset.cat = cat.id;

      const pc = spriteEl(catSprites(cat.id).portrait, 56);
      if (!rec) pc.style.filter = 'grayscale(1) brightness(0.5) opacity(0.3)';
      card.appendChild(pc);

      const name = document.createElement('span');
      name.className = 'cc-name';
      name.textContent = rec ? (rec.name || cat.species) : '？？？';
      card.appendChild(name);

      const sub = document.createElement('span');
      sub.className = 'cc-sub';
      sub.textContent = rec ? cat.species + ' · ' + rec.visits + '번 방문' : RARITY[cat.rarity].label;
      card.appendChild(sub);

      if (rec) {
        const hearts = document.createElement('span');
        hearts.className = 'cc-hearts';
        const lv = Math.min(5, Math.ceil(rec.aff / 2));
        for (let i = 0; i < 5; i++) {
          const dot = document.createElement('i');
          if (i < lv) dot.className = 'on';
          hearts.appendChild(dot);
        }
        card.appendChild(hearts);
        if (rec.aff >= RULES.affRegular) {
          const b = document.createElement('span');
          b.className = 'cc-badge';
          b.textContent = '단골';
          card.appendChild(b);
        }
      }
      el.albumGrid.appendChild(card);
    });
  }

  /* ================= 상점 ================= */

  function renderShop() {
    const s = State.data;
    el.shopList.innerHTML = '';
    const items = shopTab === 'bowl' ? BOWLS : GIFTS;

    items.forEach(function (it) {
      const row = document.createElement('div');
      row.className = 'shop-row';

      const isBowl = shopTab === 'bowl';
      const sprite = isBowl ? bowlSprite(it.id) : giftSprite(it.id);
      row.appendChild(spriteEl(sprite, 40));

      const info = document.createElement('div');
      info.className = 'shop-info';
      const nm = document.createElement('div');
      nm.className = 'shop-name';
      nm.textContent = it.name;
      const ds = document.createElement('div');
      ds.className = 'shop-desc';
      ds.textContent = it.desc;
      info.appendChild(nm);
      info.appendChild(ds);

      const owned = isBowl ? s.bowls.indexOf(it.id) >= 0 : (s.inventory[it.id] || 0) > 0;
      if (owned) {
        const hv = document.createElement('div');
        hv.className = 'shop-have';
        hv.textContent = isBowl ? (s.bowl === it.id ? '사용 중' : '보유 중') : (s.inventory[it.id] + '개 보유');
        info.appendChild(hv);
      }
      row.appendChild(info);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-buy';
      if (isBowl && owned) {
        btn.classList.add('owned');
        btn.textContent = s.bowl === it.id ? '사용 중' : '바꾸기';
        btn.disabled = s.bowl === it.id;
        btn.dataset.use = it.id;
      } else {
        btn.textContent = '밥알 ' + it.price;
        btn.disabled = s.kibble < it.price;
        btn.dataset.buy = it.id;
      }
      row.appendChild(btn);
      el.shopList.appendChild(row);
    });

    const help = document.createElement('button');
    help.type = 'button';
    help.className = 'shop-buy';
    help.style.width = '100%';
    help.style.marginTop = '20px';
    help.dataset.help = '1';
    help.textContent = '놀이 방법 보기';
    el.shopList.appendChild(help);
  }

  function setShopTab(t) { shopTab = t; renderShop(); }

  /* ================= 씬 버튼 ================= */

  function renderScene() {
    const s = State.data;
    const cat = Scene.focusCat();
    el.camBtn.disabled = !cat;
    el.camBtn.classList.toggle('ready', !!cat && !cat.photographed);
    const canGift = !!cat && State.giftCount() > 0 && !cat.gifted;
    el.giftBtn.hidden = !canGift;

    let hint = '';
    if (cat) hint = cat.photographed ? '' : '카메라로 찍어 도감에 남겨 보세요';
    else if (s.food.n <= 0) hint = s.kibble > 0 ? '밥그릇을 눌러 밥을 담아 주세요' : '할 일을 체크하면 밥알이 생겨요';
    else hint = '밥을 두고 기다리면 냥이가 찾아와요';
    el.sceneHint.textContent = hint;
    el.sceneHint.classList.toggle('on', !!hint);
  }

  /* ================= 토스트 ================= */

  function toast(msg) {
    if (!msg) return;
    el.toast.hidden = false;
    el.toast.textContent = msg;
    requestAnimationFrame(function () { el.toast.classList.add('on'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.toast.classList.remove('on');
      setTimeout(function () { el.toast.hidden = true; }, 260);
    }, 2200);
  }

  /* ================= 시트 ================= */

  let sheetOnClose = null;

  function openSheet(build, onClose) {
    el.sheet.innerHTML = '';
    build(el.sheet);
    el.sheetWrap.hidden = false;
    sheetOnClose = onClose || null;
    const focusable = el.sheet.querySelector('input, button');
    if (focusable) setTimeout(function () { focusable.focus(); }, 40);
  }

  function closeSheet() {
    if (el.sheetWrap.hidden) return;
    el.sheetWrap.hidden = true;
    el.sheet.innerHTML = '';
    const fn = sheetOnClose;
    sheetOnClose = null;
    if (fn) fn();
  }

  function sheetHead(box, title, sub) {
    const h = document.createElement('h2');
    h.textContent = title;
    box.appendChild(h);
    if (sub) {
      const p = document.createElement('p');
      p.textContent = sub;
      box.appendChild(p);
    }
  }

  function sheetRow(box, opts) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sh-row';
    if (opts.disabled) b.disabled = true;
    if (opts.sprite) b.appendChild(spriteEl(opts.sprite, 36));
    const main = document.createElement('div');
    main.className = 'shr-main';
    const n = document.createElement('div');
    n.className = 'shr-name';
    n.textContent = opts.name;
    main.appendChild(n);
    if (opts.sub) {
      const su = document.createElement('div');
      su.className = 'shr-sub';
      su.textContent = opts.sub;
      main.appendChild(su);
    }
    b.appendChild(main);
    if (opts.go) {
      const g = document.createElement('div');
      g.className = 'shr-go';
      g.textContent = opts.go;
      b.appendChild(g);
    }
    b.addEventListener('click', opts.onClick);
    box.appendChild(b);
    return b;
  }

  function sheetActions(box, actions) {
    const wrap = document.createElement('div');
    wrap.className = 'sh-acts';
    actions.forEach(function (a) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = a.label;
      if (a.ghost) b.className = 'ghost';
      b.addEventListener('click', a.onClick);
      wrap.appendChild(b);
    });
    box.appendChild(wrap);
  }

  return {
    cache: cache,
    el: el,
    ICON: ICON,
    pad3: pad3,
    renderHeader: renderHeader,
    renderTodos: renderTodos,
    renderAlbum: renderAlbum,
    renderShop: renderShop,
    setShopTab: setShopTab,
    renderScene: renderScene,
    toast: toast,
    openSheet: openSheet,
    closeSheet: closeSheet,
    sheetHead: sheetHead,
    sheetRow: sheetRow,
    sheetActions: sheetActions,
  };
})();
