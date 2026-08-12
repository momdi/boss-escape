/* ===========================================================
   츄두리스트 — 진행 로직 / 이벤트 연결
   =========================================================== */

(function () {
  const el = UI.el;
  let tab = 'home';

  /* ================= 길냥이 선택 ================= */

  function isEligible(cat) {
    const s = State.data;
    if (cat.id === 'ghost') {
      const h = new Date().getHours();
      if (h >= 7 && h < 18) return false;
    }
    if (cat.id === 'king') {
      if (s.bowl !== 'bowl_wood' && s.bowl !== 'bowl_gold') return false;
    }
    return true;
  }

  function pickBreed() {
    const s = State.data;
    const bowl = BOWL_BY_ID[s.bowl] || BOWLS[0];
    const lure = bowl.lure;
    const sp = s.food.special > 0;

    const weights = {
      common: sp ? 42 : 100,
      rare: 10 + lure * 12 + (sp ? 55 : 0),
      legend: 1 + lure * 3 + (sp ? 16 : 0),
    };

    // 친해진 냥이는 더 자주 들른다
    const regulars = CATS.filter(function (c) {
      const r = s.cats[c.id];
      return r && r.aff >= RULES.affRegular && isEligible(c);
    });
    if (regulars.length && Math.random() < 0.3) {
      return regulars[Math.floor(Math.random() * regulars.length)].id;
    }

    const total = weights.common + weights.rare + weights.legend;
    let roll = Math.random() * total;
    let rarity = 'common';
    if (roll < weights.legend) rarity = 'legend';
    else if (roll < weights.legend + weights.rare) rarity = 'rare';

    let pool = CATS.filter(function (c) { return c.rarity === rarity && isEligible(c); });
    if (!pool.length) pool = CATS.filter(function (c) { return c.rarity === 'common' && isEligible(c); });
    if (!pool.length) pool = CATS.filter(isEligible);
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)].id;
  }

  function catLabel(breed) {
    const info = CAT_BY_ID[breed];
    const rec = State.data.cats[breed];
    return (rec && rec.name) || T.tx(info, 'species');
  }

  /* ================= 씬 훅 ================= */

  Scene.hooks.canSpawn = function () { return State.data.food.n > 0; };
  Scene.hooks.pickBreed = pickBreed;
  Scene.hooks.bowlId = function () { return State.data.bowl; };
  Scene.hooks.bowlGrains = function () { return State.data.food.n; };
  Scene.hooks.bowlSpecial = function () { return State.data.food.special; };
  Scene.hooks.change = function () { UI.renderScene(); };

  Scene.hooks.onArrive = function (cat) {
    const res = State.meetCat(cat.breed);
    cat.isNew = res.isNew;
    const info = CAT_BY_ID[cat.breed];
    Sound.play('meow');
    if (res.isNew) {
      UI.toast(T.t('newVisitor', { rarity: T.rarityLabel(info.rarity) }));
    } else {
      UI.toast(T.t('visitorCame', { name: catLabel(cat.breed) }));
    }
    if (tab !== 'home') markHomeDot(true);
    UI.renderHeader();
    UI.renderScene();
  };

  Scene.hooks.onEatGrain = function () {
    const g = State.eatOne();
    UI.renderHeader();
    return g;
  };

  Scene.hooks.onLeave = function (cat) {
    Sound.play('bye');
    UI.toast(T.t('visitorLeft', { name: catLabel(cat.breed) }));
    UI.renderScene();
  };

  function markHomeDot(on) {
    const btn = el.tabs.querySelector('[data-tab="home"]');
    let dot = btn.querySelector('.dot');
    if (on && !dot) {
      dot = document.createElement('span');
      dot.className = 'dot';
      btn.appendChild(dot);
    } else if (!on && dot) {
      dot.remove();
    }
  }

  /* ================= 탭 ================= */

  function setTab(next) {
    tab = next;
    Array.prototype.forEach.call(el.tabs.children, function (b) {
      b.classList.toggle('on', b.dataset.tab === next);
    });
    el.hdShop.classList.toggle('on', next === 'shop');
    el.hdAlbum.classList.toggle('on', next === 'album');
    el.scene.style.display = next === 'home' ? '' : 'none';
    el.pageHome.hidden = next !== 'home';
    el.pageLog.hidden = next !== 'log';
    el.pageAlbum.hidden = next !== 'album';
    el.pageShop.hidden = next !== 'shop';
    el.pageSet.hidden = next !== 'set';
    if (next === 'home') {
      markHomeDot(false);
      requestAnimationFrame(function () { Scene.resize(); });
    }
    if (next === 'log') UI.renderCalendar();
    if (next === 'album') UI.renderAlbum();
    if (next === 'shop') UI.renderShop();
    if (next === 'set') UI.renderSettings();
  }

  /* ================= 시트들 ================= */

  function feedSheet() {
    const s = State.data;
    const bowl = BOWL_BY_ID[s.bowl];
    UI.openSheet(function (box) {
      UI.sheetHead(box, T.t('feedTitle'),
        T.t('feedSub', { bowl: T.tx(bowl, 'name'), n: s.food.n, cap: State.capacity() }));
      const body = document.createElement('div');
      body.className = 'sh-body';

      UI.sheetRow(body, {
        sprite: KIBBLE,
        name: T.t('feedOne'),
        sub: T.t('feedOneSub', { n: s.kibble }),
        go: T.t('put'),
        disabled: s.kibble <= 0 || s.food.n >= State.capacity(),
        onClick: function () { doFeed('normal', 1); },
      });

      UI.sheetRow(body, {
        sprite: KIBBLE,
        name: T.t('feedFull'),
        sub: T.t('feedFullSub'),
        go: T.t('put'),
        disabled: s.kibble <= 0 || s.food.n >= State.capacity(),
        onClick: function () { doFeed('normal', State.capacity() - s.food.n); },
      });

      UI.sheetRow(body, {
        sprite: KIBBLE_SPECIAL,
        name: T.t('feedSpecial'),
        sub: s.special > 0 ? T.t('feedSpecialHave', { n: s.special }) : T.t('feedSpecialNone'),
        go: T.t('put'),
        disabled: s.special <= 0 || s.food.n >= State.capacity(),
        onClick: function () { doFeed('special', 1); },
      });

      if (s.inventory.item_bell) {
        UI.sheetRow(body, {
          sprite: giftSprite('item_bell'),
          name: T.t('bellUse', { name: T.tx(GIFT_BY_ID.item_bell, 'name') }),
          sub: T.t('bellSub', { n: s.inventory.item_bell }),
          go: T.t('shake'),
          disabled: s.food.n <= 0 || Scene.visitors.length >= 2,
          onClick: function () {
            State.useGift('item_bell');
            Sound.play('bell');
            const b = pickBreed();
            if (b) Scene.spawn(b);
            UI.closeSheet();
          },
        });
      }

      box.appendChild(body);
      UI.sheetActions(box, [{ label: T.t('close'), ghost: true, onClick: UI.closeSheet }]);
    });
  }

  function doFeed(kind, amount) {
    const r = State.feed(kind, amount);
    if (!r.ok) {
      Sound.play('nope');
      UI.toast(r.reason);
      return;
    }
    Sound.play('drop');
    UI.renderHeader();
    UI.renderScene();
    UI.closeSheet();
    UI.toast(kind === 'special' ? T.t('fedSpecial') : T.t('fedNormal', { n: r.put }));
  }

  /* 밥주기 버튼: 한 번 누르면 기본 옵션대로 바로 담고,
     우클릭(길게 누르기)하면 기본 옵션을 고르는 미니 메뉴가 뜬다 */
  function quickFeed() {
    const s = State.data;
    const mode = s.feedMode === 'one' ? 'one' : 'full';
    const amount = mode === 'one' ? 1 : Math.max(1, State.capacity() - s.food.n);
    doFeed('normal', amount);
  }

  function closeFeedMenu() {
    const m = document.getElementById('feedMenu');
    if (m) m.remove();
    document.removeEventListener('click', closeFeedMenu);
  }

  function feedMenu() {
    closeFeedMenu();
    const s = State.data;
    const menu = document.createElement('div');
    menu.className = 'feed-menu';
    menu.id = 'feedMenu';
    [
      { mode: 'one', label: T.t('feedOne') },
      { mode: 'full', label: T.t('feedFull') },
    ].forEach(function (opt) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = opt.label;
      const cur = s.feedMode === 'one' ? 'one' : 'full';
      if (cur === opt.mode) b.classList.add('on');
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        s.feedMode = opt.mode;
        closeFeedMenu();
        quickFeed();
      });
      menu.appendChild(b);
    });
    document.getElementById('scene').appendChild(menu);
    setTimeout(function () { document.addEventListener('click', closeFeedMenu); }, 0);
  }

  function giftSheet() {
    const cat = Scene.focusCat();
    if (!cat) return;
    const s = State.data;
    const info = CAT_BY_ID[cat.breed];
    UI.openSheet(function (box) {
      UI.sheetHead(box, T.t('giftTitle'), T.t('giftSub', { name: catLabel(cat.breed) }));
      const body = document.createElement('div');
      body.className = 'sh-body';
      let any = false;
      GIFTS.forEach(function (g) {
        if (g.summon) return;
        const have = s.inventory[g.id] || 0;
        if (have <= 0) return;
        any = true;
        UI.sheetRow(body, {
          sprite: giftSprite(g.id),
          name: T.tx(g, 'name'),
          sub: T.t('giftHave', { n: have, aff: g.aff, fav: info.likes === g.id ? T.t('giftFav') : '' }),
          go: T.t('give'),
          onClick: function () { doGift(cat, g); },
        });
      });
      if (!any) {
        const p = document.createElement('p');
        p.textContent = T.t('giftNone');
        body.appendChild(p);
      }
      box.appendChild(body);
      UI.sheetActions(box, [{ label: T.t('close'), ghost: true, onClick: UI.closeSheet }]);
    });
  }

  function doGift(cat, gift) {
    if (!State.useGift(gift.id)) return;
    const info = CAT_BY_ID[cat.breed];
    const bonus = info.likes === gift.id ? 2 : 0;
    State.addAff(cat.breed, gift.aff + bonus);
    cat.gifted = true;
    cat.rest += 8;
    Scene.pop(cat);
    Scene.act(cat, 'play', 2.6);
    Sound.play('gift');
    UI.closeSheet();
    UI.renderScene();
    const rec = State.data.cats[cat.breed];
    UI.toast(T.t('giftLiked', { name: catLabel(cat.breed), fav: bonus ? T.t('giftFavToast') : '' }));
    if (rec.aff >= RULES.affRegular && !rec.regularNoticed) {
      rec.regularNoticed = true;
      setTimeout(function () {
        Sound.play('sparkle');
        UI.toast(T.t('becameRegular', { name: catLabel(cat.breed) }));
      }, 2400);
    }
  }

  function nameSheet(catId, after) {
    const info = CAT_BY_ID[catId];
    const rec = State.data.cats[catId];
    UI.openSheet(function (box) {
      UI.sheetHead(box, T.t('nameTitle'), T.t('nameSub', { species: T.tx(info, 'species') }));
      const stack = document.createElement('div');
      stack.className = 'sh-body sh-stack';
      const pw = document.createElement('div');
      pw.className = 'sh-portrait';
      pw.appendChild(spriteEl(catSprites(catId).portrait, 76));
      stack.appendChild(pw);
      box.appendChild(stack);

      const input = document.createElement('input');
      input.className = 'sh-input';
      input.type = 'text';
      input.maxLength = 8;
      input.placeholder = T.tx(info, 'species');
      input.value = rec ? rec.name : '';
      input.autocomplete = 'off';
      box.appendChild(input);

      function commit() {
        State.nameCat(catId, input.value || T.tx(info, 'species'));
        Sound.play('sparkle');
        UI.closeSheet();
        UI.renderAlbum();
        UI.toast(T.t('named', { name: State.data.cats[catId].name }));
        if (after) after();
      }
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
      });
      UI.sheetActions(box, [
        { label: T.t('later'), ghost: true, onClick: function () { UI.closeSheet(); if (after) after(); } },
        { label: T.t('nameOk'), onClick: commit },
      ]);
    });
  }

  function catSheet(catId) {
    const info = CAT_BY_ID[catId];
    const rec = State.data.cats[catId];
    UI.openSheet(function (box) {
      if (!rec) {
        UI.sheetHead(box, T.t('notMet'), T.rarityLabel(info.rarity));
        const body = document.createElement('div');
        body.className = 'sh-body';
        const p = document.createElement('p');
        p.textContent = info.rarity === 'common' ? T.t('notMetCommon') : T.t('notMetRare');
        body.appendChild(p);
        box.appendChild(body);
        UI.sheetActions(box, [{ label: T.t('close'), ghost: true, onClick: UI.closeSheet }]);
        return;
      }

      UI.sheetHead(box, rec.name || T.tx(info, 'species'),
        T.tx(info, 'species') + ' · ' + T.rarityLabel(info.rarity));
      const stack = document.createElement('div');
      stack.className = 'sh-body sh-stack';

      if (rec.photo) {
        const pol = document.createElement('div');
        pol.className = 'polaroid';
        const img = document.createElement('img');
        img.src = rec.photo;
        img.alt = T.t('photoAlt', { name: catLabel(catId) });
        pol.appendChild(img);
        stack.appendChild(pol);
      } else {
        const empty = document.createElement('div');
        empty.className = 'polaroid empty';
        empty.textContent = T.t('noPhoto');
        stack.appendChild(empty);
      }

      const meta = document.createElement('dl');
      meta.className = 'sh-meta';
      [[T.t('mVisit'), T.t('mVisitN', { n: rec.visits })],
        [T.t('mAff'), rec.aff + (rec.aff >= RULES.affRegular ? ' · ' + T.t('regular') : '')],
        [T.t('mLikes'), T.tx(GIFT_BY_ID[info.likes], 'name') || '-']].forEach(function (row) {
        const dt = document.createElement('dt');
        dt.textContent = row[0];
        const dd = document.createElement('dd');
        dd.textContent = row[1];
        meta.appendChild(dt);
        meta.appendChild(dd);
      });
      stack.appendChild(meta);

      const desc = document.createElement('p');
      desc.textContent = T.tx(info, 'desc');
      stack.appendChild(desc);
      box.appendChild(stack);

      UI.sheetActions(box, [
        { label: T.t('close'), ghost: true, onClick: UI.closeSheet },
        { label: T.t('rename'), onClick: function () { nameSheet(catId); } },
      ]);
    });
  }

  function guideSheet() {
    UI.openSheet(function (box) {
      UI.sheetHead(box, T.t('guideTitle'), T.t('guideSub'));
      const body = document.createElement('div');
      body.className = 'sh-body';
      /* 바탕화면 앱과 웹은 조작이 달라 문구를 나눈다 */
      const onDesk = !!window.desk;
      const rows = [
        [T.t('g1a'), T.t('g1b')],
        [T.t('g2a'), T.t('g2b', { n: RULES.maxStars })],
        [T.t('g3a', { n: RULES.bonusAt }), T.t('g3b')],
        onDesk ? [T.t('g4a'), T.t('g4b')] : [T.t('g4wa'), T.t('g4wb')],
      ];
      if (onDesk) rows.push([T.t('g5a'), T.t('g5b')]);
      rows.push([T.t('g6a'), T.t('g6b')]);
      rows.push(onDesk ? [T.t('g7a'), T.t('g7b')] : [T.t('g7wa'), T.t('g7wb')]);
      if (onDesk) rows.push([T.t('g8a'), T.t('g8b')]);
      rows.push([T.t('g9a'), T.t('g9b')]);
      rows.forEach(function (r) {
        const p = document.createElement('p');
        p.style.marginBottom = '9px';
        const b = document.createElement('b');
        b.style.color = 'var(--ink)';
        b.style.fontWeight = '700';
        b.textContent = r[0] + ' ';
        p.appendChild(b);
        p.appendChild(document.createTextNode(r[1]));
        body.appendChild(p);
      });
      box.appendChild(body);
      UI.sheetActions(box, [{ label: T.t('gotIt'), onClick: UI.closeSheet }]);
    });
  }

  function daySheet(key, n) {
    UI.openSheet(function (box) {
      const parts = key.split('-');
      const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      const isToday = key === State.todayKey();
      UI.sheetHead(box, T.dateLabel(d), isToday ? T.t('logToday') : '');
      const body = document.createElement('div');
      body.className = 'sh-body';
      const p = document.createElement('p');
      p.textContent = n > 0 ? T.t('logDone', { n: n }) : T.t('logNone');
      body.appendChild(p);
      box.appendChild(body);
      UI.sheetActions(box, [{ label: T.t('close'), ghost: true, onClick: UI.closeSheet }]);
    });
  }

  function resetSheet() {
    UI.openSheet(function (box) {
      UI.sheetHead(box, T.t('setResetAsk'), T.t('setResetSub2'));
      UI.sheetActions(box, [
        { label: T.t('cancel'), ghost: true, onClick: UI.closeSheet },
        {
          label: T.t('confirmReset'),
          onClick: function () {
            State.reset();
            UI.closeSheet();
            refreshAll();
            UI.toast(T.t('resetDone'));
          },
        },
      ]);
    });
  }

  /* ================= 카메라 ================= */

  function shoot() {
    const cat = Scene.focusCat();
    if (!cat) return;
    const flash = document.getElementById('flash');
    flash.classList.remove('fire');
    void flash.offsetWidth;
    flash.classList.add('fire');
    Sound.play('shutter');

    const url = Scene.capture(cat);
    State.setPhoto(cat.breed, url);
    if (!cat.photographed) {
      cat.photographed = true;
      State.addAff(cat.breed, RULES.photoAff);
    }
    Scene.pop(cat);
    UI.renderScene();

    const rec = State.data.cats[cat.breed];
    if (!rec.name) {
      setTimeout(function () { nameSheet(cat.breed); }, 420);
    } else {
      UI.toast(T.t('photoSaved'));
    }
  }

  /* 최신 버전 받아오기: 저장 데이터는 그대로, 캐시만 비우고 새로 읽는다 */
  function checkUpdate() {
    Sound.play('tap');
    if (window.desk) {
      /* 앱 파일은 설치본 안에 들어 있어 새로 받아올 게 없다. 창만 다시 그린다. */
      location.reload();
      return;
    }
    UI.toast(T.t('setUpdateBtn'));
    const done = function () {
      const u = location.href.split('#')[0].split('?')[0];
      location.replace(u + '?u=' + Date.now());
    };
    let waited = false;
    const go = function () { if (!waited) { waited = true; done(); } };
    setTimeout(go, 1200);            /* 정리에 실패해도 반드시 새로고침 */
    try {
      const jobs = [];
      if (window.caches && caches.keys) {
        jobs.push(caches.keys().then(function (ks) {
          return Promise.all(ks.map(function (k) { return caches.delete(k); }));
        }));
      }
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        jobs.push(navigator.serviceWorker.getRegistrations().then(function (rs) {
          return Promise.all(rs.map(function (r) { return r.unregister(); }));
        }));
      }
      if (jobs.length) Promise.all(jobs).then(go, go);
      else go();
    } catch (e) { go(); }
  }

  /* ================= 전체 갱신 ================= */

  function refreshAll() {
    T.apply();
    UI.renderHeader();
    UI.renderTodos();
    UI.renderNotes();
    UI.renderScene();
    if (tab === 'log') UI.renderCalendar();
    if (tab === 'album') UI.renderAlbum();
    if (tab === 'shop') UI.renderShop();
    if (tab === 'set') UI.renderSettings();
  }

  /* ================= 이벤트 ================= */

  /** 할 일 글자를 그 자리에서 고친다 */
  function startEditTodo(li, id) {
    if (li.querySelector('.todo-edit')) return;
    const txt = li.querySelector('.todo-text');
    if (!txt) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-edit';
    input.maxLength = 24;
    input.value = txt.textContent;
    txt.replaceWith(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    let closed = false;
    const finish = function (save) {
      if (closed) return;
      closed = true;
      if (save && input.value.trim() && input.value.trim() !== txt.textContent) {
        State.editTodo(id, input.value);
        Sound.play('tap');
      }
      UI.renderTodos();
    };
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
    input.addEventListener('blur', function () { finish(true); });
  }

  function bind() {
    // 할 일
    el.todoList.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const li = btn.closest('.todo');
      if (!li) return;
      const id = li.dataset.id;
      const act = btn.dataset.act;

      if (act === 'toggle') {
        const r = State.toggleDone(id);
        if (!r) return;
        UI.renderTodos();
        UI.renderHeader();
        UI.renderScene();
        if (r.todo.done) {
          if (r.gain.bonus) { Sound.play('sparkle'); UI.toast(r.gain.bonus); }
          else if (r.gain.special > 0) { Sound.play('sparkle'); UI.toast(T.t('gotSpecial')); }
          else { Sound.play('check'); UI.toast(T.t('gotKibble', { n: r.gain.kibble })); }
        } else {
          Sound.play('uncheck');
        }
      } else if (act === 'edit') {
        startEditTodo(li, id);
      } else if (act === 'star') {
        const t = State.data.todos.find(function (x) { return x.id === id; });
        if (t && t.done) { Sound.play('nope'); UI.toast(T.t('alreadyDone')); return; }
        const r = State.toggleStar(id);
        if (!r.ok) { Sound.play('nope'); UI.toast(r.reason); return; }
        UI.renderTodos();
        if (r.star) { Sound.play('sparkle'); UI.toast(T.t('starSet')); }
      } else if (act === 'del') {
        State.removeTodo(id);
        Sound.play('uncheck');
        UI.renderTodos();
      }
    });

    function toggleNoteForm(on) {
      const show = on === undefined ? el.noteForm.hidden : on;
      el.noteForm.hidden = !show;
      el.noteToggle.classList.toggle('on', show);
      if (show) el.noteInput.focus();
      else { el.noteInput.value = ''; el.noteDue.value = ''; }
    }

    el.noteToggle.addEventListener('click', function () {
      Sound.play('tap');
      toggleNoteForm();
    });

    el.noteInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') toggleNoteForm(false);
    });

    el.noteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const v = el.noteInput.value;
      if (!v.trim()) return;
      State.addNote(v, el.noteDue.value || '');
      el.noteInput.value = '';
      el.noteDue.value = '';
      Sound.play('tap');
      UI.renderNotes();
      toggleNoteForm(false);
    });

    el.addForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const v = el.addInput.value;
      if (!v.trim()) return;
      State.addTodo(v);
      el.addInput.value = '';
      Sound.play('tap');
      UI.renderTodos();
    });

    // 밥그릇 / 씬
    el.scene.addEventListener('click', function (e) {
      if (e.target.closest('.sbtn')) return;
      if (Scene.hitBowl(e)) { quickFeed(); return; }
      const cat = Scene.hit(e);
      if (cat) {
        cat.napping = false;   /* 자던 냥이는 깨어난다 */
        Sound.play('meow');
        Scene.jump(cat);
        Scene.act(cat, 'meow', 1.2);
        Scene.pop(cat);
      }
    });
    el.hdFood.addEventListener('click', feedSheet);
    el.scene.addEventListener('contextmenu', function (e) {
      if (e.target.closest('.sbtn')) return;
      if (!Scene.hitBowl(e)) return;
      e.preventDefault();
      feedMenu();
    });
    el.camBtn.addEventListener('click', function (e) { e.stopPropagation(); shoot(); });
    el.giftBtn.addEventListener('click', function (e) { e.stopPropagation(); giftSheet(); });
    el.hdShop.addEventListener('click', function () {
      Sound.play('tap');
      setTab('shop');
    });
    el.hdAlbum.addEventListener('click', function () {
      Sound.play('tap');
      setTab('album');
    });

    // 탭
    el.tabs.addEventListener('click', function (e) {
      const b = e.target.closest('[data-tab]');
      if (b) { Sound.play('tap'); setTab(b.dataset.tab); }
    });

    // 기록
    el.calPrev.addEventListener('click', function () { Sound.play('tap'); UI.calShift(-1); });
    el.calNext.addEventListener('click', function () { Sound.play('tap'); UI.calShift(1); });
    el.calGrid.addEventListener('click', function (e) {
      const c = e.target.closest('[data-day]');
      if (c) daySheet(c.dataset.day, +c.dataset.n);
    });

    // 도감
    el.albumGrid.addEventListener('click', function (e) {
      const c = e.target.closest('[data-cat]');
      if (c) catSheet(c.dataset.cat);
    });

    // 설정
    UI.onSettingsChange = function (kind, value) {
      if (kind === 'lang') {
        State.setLang(value);
        Sound.play('tap');
        refreshAll();
      } else if (kind === 'sound') {
        State.setSound(value);
        Sound.setEnabled(value);
        if (value) Sound.play('sparkle');
        UI.renderSettings();
      } else if (kind === 'update') {
        checkUpdate();
      } else if (kind === 'reset') {
        resetSheet();
      }
    };

    // 상점
    document.querySelector('.shop-tabs').addEventListener('click', function (e) {
      const b = e.target.closest('[data-shop]');
      if (!b) return;
      Array.prototype.forEach.call(b.parentNode.children, function (x) {
        x.classList.toggle('on', x === b);
      });
      Sound.play('tap');
      UI.setShopTab(b.dataset.shop);
    });

    el.shopList.addEventListener('click', function (e) {
      const buy = e.target.closest('[data-buy]');
      const use = e.target.closest('[data-use]');
      const help = e.target.closest('[data-help]');
      if (help) { guideSheet(); return; }
      if (use) {
        if (State.useBowl(use.dataset.use)) {
          /* 'drop' 은 밥 주는 소리 — 교체에 쓰면 밥이 채워진 걸로 들린다 */
          Sound.play('pop');
          UI.renderShop();
          UI.renderHeader();
          UI.toast(T.t('bowlSwapped'));
        } else {
          Sound.play('nope');
          UI.toast(T.t('emptyFirst'));
        }
        return;
      }
      if (buy) {
        const r = State.buy(buy.dataset.buy);
        if (!r.ok) { Sound.play('nope'); UI.toast(r.reason || T.t('cantBuy')); return; }
        Sound.play('coin');
        UI.renderShop();
        UI.renderHeader();
        UI.renderScene();
        UI.toast(T.t('bought', { name: T.tx(r.item, 'name') }));
      }
    });

    // 시트 닫기
    document.getElementById('sheetDim').addEventListener('click', UI.closeSheet);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') UI.closeSheet();
    });

    // 날짜 넘김
    setInterval(function () {
      if (State.rollover()) {
        UI.renderTodos();
        UI.renderHeader();
        UI.toast(T.t('newDay'));
      }
    }, 30000);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && State.rollover()) {
        UI.renderTodos();
        UI.renderHeader();
      }
    });
  }

  /* ================= 시작 ================= */

  function boot() {
    State.load();
    UI.cache();
    T.apply();
    Sound.setEnabled(State.data.sound !== false);
    Sound.unlock();
    Scene.init(document.getElementById('room'));
    bind();
    UI.renderHeader();
    UI.renderTodos();
    UI.renderNotes();
    UI.renderScene();
    setTab('home');
    Scene.start();
    if (!State.data.seenGuide) {
      State.data.seenGuide = true;
      State.emit({ type: 'guide' });
      setTimeout(guideSheet, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
