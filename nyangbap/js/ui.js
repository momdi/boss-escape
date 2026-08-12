/* ===========================================================
   츄두리스트 — 화면 그리기 / 시트
   =========================================================== */

const UI = (function () {
  const $ = function (id) { return document.getElementById(id); };

  const el = {};
  let toastTimer = 0;
  let shopTab = 'bowl';
  let calCursor = null; // {y, m}

  const ICON = {
    check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 7h2v2H2zM4 9h2v2H4zM6 11h2v2H6zM8 9h2v2H8zM10 7h2v2h-2zM12 5h2v2h-2zM14 3h2v2h-2z"/></svg>',
    star: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8l1.9 4 4.3.5-3.2 2.9.9 4.3L8 11.4 4.1 13.5l.9-4.3L1.8 6.3l4.3-.5z"/></svg>',
  };

  function cache() {
    ['hdDate', 'hdKibble', 'hdSpecial', 'hdSpecialNum', 'hdFood', 'hdShop', 'hdAlbum',
      'hdKibbleIco', 'hdSpecialIco',
      'todoList', 'addForm', 'addInput', 'noteList', 'noteForm', 'noteInput', 'noteDue', 'noteToggle', 'albumGrid', 'albumCount', 'shopList',
      'tabs', 'toast', 'sheetWrap', 'sheet', 'sheetDim', 'camBtn', 'giftBtn',
      'sceneHint', 'scene', 'pageHome', 'pageLog', 'pageAlbum', 'pageShop', 'pageSet',
      'calMonth', 'calGrid', 'calDow', 'calSum', 'calPrev', 'calNext', 'setList'].forEach(function (id) {
      el[id] = $(id);
    });
  }

  function pad3(n) {
    const v = Math.max(0, n | 0);
    return v < 10 ? '00' + v : v < 100 ? '0' + v : '' + v;
  }

  function todoLabel(t) {
    if (t.def != null && DEFAULT_TODOS[t.def]) return T.tx(DEFAULT_TODOS[t.def], 'text');
    return t.text;
  }

  /* ================= 헤더 ================= */

  function renderHeader() {
    const s = State.data;
    el.hdDate.textContent = T.dateLabel();
    el.hdKibble.textContent = s.kibble;
    el.hdSpecialNum.textContent = s.special;

    if (!el.hdKibbleIco.firstChild) el.hdKibbleIco.appendChild(spriteEl(KIBBLE, 14));
    if (!el.hdSpecialIco.firstChild) el.hdSpecialIco.appendChild(spriteEl(KIBBLE_SPECIAL, 14));
    el.hdSpecial.classList.toggle('empty', s.special <= 0);


  }

  /* ================= 기억할 일 ================= */

  function renderNotes() {
    const s = State.data;
    const list = s.notes || [];
    el.noteList.innerHTML = '';
    list.forEach(function (n) {
      const li = document.createElement('li');
      const dot = document.createElement('i');
      dot.className = 'note-dot';
      const sp = document.createElement('span');
      sp.textContent = n.text;

      let badge = null;
      const left = State.daysLeft(n.due);
      if (left !== null) {
        badge = document.createElement('b');
        badge.className = 'note-dday';
        if (left > 0) badge.textContent = T.t('dday', { n: left });
        else if (left === 0) { badge.textContent = T.t('ddayToday'); badge.classList.add('today'); }
        else { badge.textContent = T.t('ddayPast', { n: -left }); badge.classList.add('past'); }
        if (left > 0 && left <= 3) badge.classList.add('soon');
        badge.title = n.due;
      }

      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'note-x';
      x.textContent = '\u00d7';
      x.setAttribute('aria-label', T.t('deleteAria') || 'delete');
      x.addEventListener('click', function () {
        State.removeNote(n.id);
        Sound.play('tap');
        renderNotes();
      });
      li.append(dot, sp);
      if (badge) li.appendChild(badge);
      li.appendChild(x);
      el.noteList.appendChild(li);
    });
    el.noteList.hidden = list.length === 0;
  }

  /* ================= 할 일 ================= */

  function renderTodos() {
    const s = State.data;
    el.todoList.innerHTML = '';
    s.todos.forEach(function (t) {
      const label = todoLabel(t);
      const li = document.createElement('li');
      li.className = 'todo' + (t.done ? ' done' : '') + (t.star ? ' star' : '');
      li.dataset.id = t.id;

      const hit = document.createElement('button');
      hit.type = 'button';
      hit.className = 'todo-hit';
      hit.setAttribute('aria-label', T.t(t.done ? 'aUndone' : 'aDone', { t: label }));
      hit.dataset.act = 'toggle';

      const box = document.createElement('span');
      box.className = 'todo-box';
      box.innerHTML = ICON.check;

      const txt = document.createElement('button');
      txt.type = 'button';
      txt.className = 'todo-text';
      txt.dataset.act = 'edit';
      txt.textContent = label;

      const mark = document.createElement('button');
      mark.type = 'button';
      mark.className = 'todo-mark';
      mark.dataset.act = 'star';
      if (t.done) {
        mark.setAttribute('aria-label', T.t('aGot'));
        mark.appendChild(kibbleImg(t.star));
      } else {
        mark.setAttribute('aria-label', T.t(t.star ? 'aStarOff' : 'aStarOn'));
        mark.innerHTML = ICON.star;
      }

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'todo-del';
      del.dataset.act = 'del';
      del.textContent = '✕';
      del.setAttribute('aria-label', T.t('aDel', { t: label }));

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
    img.alt = T.t(special ? 'currencySpecial' : 'currency');
    img.width = 14;
    img.height = 14;
    return img;
  }

  /* ================= 기록 (캘린더) ================= */

  function calLevel(n) {
    if (!n) return 0;
    if (n >= 7) return 4;
    if (n >= 5) return 3;
    if (n >= 3) return 2;
    return 1;
  }

  function renderCalendar() {
    const now = new Date();
    if (!calCursor) calCursor = { y: now.getFullYear(), m: now.getMonth() };
    const h = State.history();
    const y = calCursor.y;
    const m = calCursor.m;

    el.calMonth.textContent = T.monthLabel(y, m);
    el.calNext.disabled = (y > now.getFullYear()) || (y === now.getFullYear() && m >= now.getMonth());

    el.calDow.innerHTML = '';
    T.raw('weekdayShort').forEach(function (w) {
      const c = document.createElement('span');
      c.textContent = w;
      el.calDow.appendChild(c);
    });

    el.calGrid.innerHTML = '';
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const todayK = State.todayKey();
    let sumDone = 0;
    let activeDays = 0;

    for (let i = 0; i < first; i++) {
      const pad = document.createElement('span');
      pad.className = 'cal-cell pad';
      el.calGrid.appendChild(pad);
    }
    for (let d = 1; d <= days; d++) {
      const key = y + '-' + (m + 1 < 10 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d;
      const rec = h[key];
      const n = rec ? rec.d : 0;
      if (n > 0) { sumDone += n; activeDays++; }
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cal-cell l' + calLevel(n) + (key === todayK ? ' today' : '');
      cell.dataset.day = key;
      cell.dataset.n = n;
      cell.textContent = d;
      cell.setAttribute('aria-label', key + ' · ' + (n ? T.t('logDone', { n: n }) : T.t('logNone')));
      el.calGrid.appendChild(cell);
    }

    const streak = State.streakDays();
    el.calSum.textContent = T.t('logTotal', { n: sumDone, d: activeDays })
      + (streak > 1 ? ' · ' + T.t('logStreak', { n: streak }) : '');
  }

  function calShift(delta) {
    const now = new Date();
    if (!calCursor) calCursor = { y: now.getFullYear(), m: now.getMonth() };
    let m = calCursor.m + delta;
    let y = calCursor.y;
    while (m < 0) { m += 12; y--; }
    while (m > 11) { m -= 12; y++; }
    if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth())) return;
    calCursor = { y: y, m: m };
    renderCalendar();
  }

  /* ================= 도감 ================= */

  function renderAlbum() {
    const s = State.data;
    el.albumCount.textContent = T.t('albumCount', { n: State.metCount(), total: CATS.length });
    el.albumGrid.innerHTML = '';

    CATS.forEach(function (cat) {
      const rec = s.cats[cat.id];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'cat-card' + (rec ? '' : ' locked');
      card.dataset.cat = cat.id;

      const pc = spriteEl(catSprites(cat.id).portrait, 48);
      if (!rec) pc.style.filter = 'grayscale(1) brightness(0.5) opacity(0.3)';
      card.appendChild(pc);

      const name = document.createElement('span');
      name.className = 'cc-name';
      name.textContent = rec ? (rec.name || T.tx(cat, 'species')) : T.t('unknown');
      card.appendChild(name);

      const sub = document.createElement('span');
      sub.className = 'cc-sub';
      sub.textContent = rec
        ? T.tx(cat, 'species') + ' · ' + T.t('visits', { n: rec.visits })
        : T.rarityLabel(cat.rarity);
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
          b.textContent = T.t('regular');
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
      row.appendChild(spriteEl(sprite, 34));

      const info = document.createElement('div');
      info.className = 'shop-info';
      const nm = document.createElement('div');
      nm.className = 'shop-name';
      nm.textContent = T.tx(it, 'name');
      const ds = document.createElement('div');
      ds.className = 'shop-desc';
      ds.textContent = T.tx(it, 'desc');
      info.appendChild(nm);
      info.appendChild(ds);

      const owned = isBowl ? s.bowls.indexOf(it.id) >= 0 : (s.inventory[it.id] || 0) > 0;
      if (owned) {
        const hv = document.createElement('div');
        hv.className = 'shop-have';
        hv.textContent = isBowl
          ? (s.bowl === it.id ? T.t('inUse') : T.t('owned'))
          : T.t('ownedN', { n: s.inventory[it.id] });
        info.appendChild(hv);
      }
      row.appendChild(info);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-buy';
      if (isBowl && owned) {
        btn.classList.add('owned');
        btn.textContent = s.bowl === it.id ? T.t('inUse') : T.t('swap');
        btn.disabled = s.bowl === it.id;
        btn.dataset.use = it.id;
      } else {
        btn.textContent = it.gold
          ? T.t('buyPriceGold', { n: it.price })
          : T.t('buyPrice', { n: it.price });
        btn.disabled = it.gold ? s.special < it.price : s.kibble < it.price;
        btn.dataset.buy = it.id;
      }
      row.appendChild(btn);
      el.shopList.appendChild(row);
    });

    const help = document.createElement('button');
    help.type = 'button';
    help.className = 'shop-buy';
    help.style.width = '100%';
    help.style.marginTop = '16px';
    help.dataset.help = '1';
    help.textContent = T.t('howTo');
    el.shopList.appendChild(help);
  }

  function setShopTab(t) { shopTab = t; renderShop(); }

  /* ================= 설정 ================= */

  let onSetChange = null;

  function setSection(title) {
    const h = document.createElement('h2');
    h.className = 'set-h';
    h.textContent = title;
    el.setList.appendChild(h);
  }

  function segRow(options, active, onPick) {
    const wrap = document.createElement('div');
    wrap.className = 'seg';
    options.forEach(function (o) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o.label;
      if (o.value === active) b.classList.add('on');
      b.addEventListener('click', function () { onPick(o.value); });
      wrap.appendChild(b);
    });
    el.setList.appendChild(wrap);
  }

  function linkRow(label, text, href) {
    const a = document.createElement('a');
    a.className = 'set-row';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noreferrer noopener';
    const k = document.createElement('span');
    k.className = 'set-k';
    k.textContent = label;
    const v = document.createElement('span');
    v.className = 'set-v';
    v.textContent = text;
    a.appendChild(k);
    a.appendChild(v);
    el.setList.appendChild(a);
    return a;
  }

  function textRow(label, text) {
    const d = document.createElement('div');
    d.className = 'set-row';
    const k = document.createElement('span');
    k.className = 'set-k';
    k.textContent = label;
    const v = document.createElement('span');
    v.className = 'set-v';
    v.textContent = text;
    d.appendChild(k);
    d.appendChild(v);
    el.setList.appendChild(d);
  }

  function renderSettings() {
    const s = State.data;
    el.setList.innerHTML = '';

    setSection(T.t('setLang'));
    segRow([
      { value: 'ko', label: T.t('setLangKo') },
      { value: 'en', label: T.t('setLangEn') },
    ], T.lang(), function (v) { if (onSetChange) onSetChange('lang', v); });

    setSection(T.t('setSound'));
    segRow([
      { value: true, label: T.t('setSoundOn') },
      { value: false, label: T.t('setSoundOff') },
    ], !!s.sound, function (v) { if (onSetChange) onSetChange('sound', v); });

    /* 만든 사람 정보는 맨 아래 한 줄로 조용히 */
    const about = document.createElement('p');
    about.className = 'set-about';
    const home = document.createElement('a');
    home.href = APP_INFO.home;
    home.target = '_blank';
    home.rel = 'noopener';
    home.textContent = 'heymomdi.com';
    const mail = document.createElement('a');
    mail.href = 'mailto:' + APP_INFO.mail;
    mail.textContent = APP_INFO.mail;
    about.append(T.t('madeBy') + ' · v' + APP_INFO.version + ' · ', home,
                 document.createTextNode(' · '), mail);

    /* 업데이트 확인은 웹에서만 의미가 있다 (앱은 설치 파일을 새로 받아야 한다) */
    if (!window.desk) {
      setSection(T.t('setUpdate'));
      const upd = document.createElement('button');
      upd.type = 'button';
      upd.className = 'set-go';
      upd.textContent = T.t('setUpdateBtn');
      upd.addEventListener('click', function () { if (onSetChange) onSetChange('update'); });
      el.setList.appendChild(upd);
      const updSub = document.createElement('p');
      updSub.className = 'set-note';
      updSub.textContent = T.t('setUpdateSub');
      el.setList.appendChild(updSub);
    }

    setSection(T.t('setData'));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'set-danger';
    btn.textContent = T.t('setReset');
    btn.addEventListener('click', function () { if (onSetChange) onSetChange('reset'); });
    el.setList.appendChild(btn);
    const sub = document.createElement('p');
    sub.className = 'set-note';
    sub.textContent = T.t('setResetSub');
    el.setList.appendChild(sub);

    el.setList.appendChild(about);
  }

  /* ================= 씬 버튼 ================= */

  function renderScene() {
    const s = State.data;
    const cat = Scene.focusCat();
    el.camBtn.disabled = !cat;
    el.camBtn.classList.toggle('ready', !!cat && !cat.photographed);
    const canGift = !!cat && State.giftCount() > 0 && !cat.gifted;
    el.giftBtn.hidden = !canGift;

    /* 사진 안내는 카메라 버튼 툴팁으로 (씬 위 텍스트는 고양이를 가린다) */
    el.camBtn.setAttribute('data-tip', T.t('hintShoot'));

    let hint = '';
    if (!cat) {
      if (s.food.n <= 0) hint = s.kibble > 0 ? T.t('hintFeed') : T.t('hintNoFood');
      else hint = T.t('hintWait');
    }
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
    Sound.play('pop');
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
    if (opts.sprite) b.appendChild(spriteEl(opts.sprite, 32));
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
    todoLabel: todoLabel,
    renderHeader: renderHeader,
    renderTodos: renderTodos,
    renderNotes: renderNotes,
    renderCalendar: renderCalendar,
    calShift: calShift,
    renderAlbum: renderAlbum,
    renderShop: renderShop,
    setShopTab: setShopTab,
    renderSettings: renderSettings,
    set onSettingsChange(fn) { onSetChange = fn; },
    renderScene: renderScene,
    toast: toast,
    openSheet: openSheet,
    closeSheet: closeSheet,
    sheetHead: sheetHead,
    sheetRow: sheetRow,
    sheetActions: sheetActions,
  };
})();
