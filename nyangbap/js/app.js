/* ===========================================================
   냥밥 — 진행 로직 / 이벤트 연결
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
    const label = res.rec.name || info.species;
    if (res.isNew) {
      UI.toast('처음 보는 ' + RARITY[info.rarity].label + '가 찾아왔어요');
    } else {
      UI.toast(label + ' 왔다');
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
    const info = CAT_BY_ID[cat.breed];
    const rec = State.data.cats[cat.breed];
    const label = (rec && rec.name) || info.species;
    UI.toast(label + '이(가) 돌아갔어요');
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
    el.scene.style.display = next === 'home' ? '' : 'none';
    el.pageHome.hidden = next !== 'home';
    el.pageAlbum.hidden = next !== 'album';
    el.pageShop.hidden = next !== 'shop';
    if (next === 'home') {
      markHomeDot(false);
      requestAnimationFrame(function () { Scene.resize(); });
    }
    if (next === 'album') UI.renderAlbum();
    if (next === 'shop') UI.renderShop();
  }

  /* ================= 시트들 ================= */

  function feedSheet() {
    const s = State.data;
    const bowl = BOWL_BY_ID[s.bowl];
    UI.openSheet(function (box) {
      UI.sheetHead(box, '밥그릇에 밥 담기',
        bowl.name + ' · ' + s.food.n + ' / ' + State.capacity() + '알 담겨 있어요');
      const body = document.createElement('div');
      body.className = 'sh-body';

      UI.sheetRow(body, {
        sprite: KIBBLE,
        name: '밥알 한 알 담기',
        sub: '보유 ' + s.kibble + '알',
        go: '담기',
        disabled: s.kibble <= 0 || s.food.n >= State.capacity(),
        onClick: function () { doFeed('normal', 1); },
      });

      UI.sheetRow(body, {
        sprite: KIBBLE,
        name: '가득 채우기',
        sub: '빈자리만큼 한 번에',
        go: '담기',
        disabled: s.kibble <= 0 || s.food.n >= State.capacity(),
        onClick: function () { doFeed('normal', State.capacity() - s.food.n); },
      });

      UI.sheetRow(body, {
        sprite: KIBBLE_SPECIAL,
        name: '특별한 밥 담기',
        sub: s.special > 0 ? '보유 ' + s.special + '개 · 귀한 냥이가 올 확률이 크게 올라가요'
          : '★ 할 일을 끝내면 생겨요',
        go: '담기',
        disabled: s.special <= 0 || s.food.n >= State.capacity(),
        onClick: function () { doFeed('special', 1); },
      });

      if (s.inventory.item_bell) {
        UI.sheetRow(body, {
          sprite: giftSprite('item_bell'),
          name: '딸랑 방울 흔들기',
          sub: '보유 ' + s.inventory.item_bell + '개 · 냥이를 바로 부른다',
          go: '흔들기',
          disabled: s.food.n <= 0 || Scene.visitors.length >= 2,
          onClick: function () {
            State.useGift('item_bell');
            const b = pickBreed();
            if (b) Scene.spawn(b);
            UI.closeSheet();
          },
        });
      }

      box.appendChild(body);
      UI.sheetActions(box, [{ label: '닫기', ghost: true, onClick: UI.closeSheet }]);
    });
  }

  function doFeed(kind, amount) {
    const r = State.feed(kind, amount);
    if (!r.ok) {
      UI.toast(r.reason);
      return;
    }
    UI.renderHeader();
    UI.renderScene();
    UI.closeSheet();
    UI.toast(kind === 'special' ? '특별한 밥을 담았어요' : '밥알 ' + r.put + '알을 담았어요');
  }

  function giftSheet() {
    const cat = Scene.focusCat();
    if (!cat) return;
    const s = State.data;
    const info = CAT_BY_ID[cat.breed];
    const rec = s.cats[cat.breed];
    UI.openSheet(function (box) {
      UI.sheetHead(box, '선물 주기', (rec.name || info.species) + '에게 무엇을 줄까요');
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
          name: g.name,
          sub: have + '개 보유 · 친밀도 +' + g.aff + (info.likes === g.id ? ' (좋아하는 선물!)' : ''),
          go: '주기',
          onClick: function () { doGift(cat, g); },
        });
      });
      if (!any) {
        const p = document.createElement('p');
        p.textContent = '가진 선물이 없어요. 상점에서 살 수 있어요.';
        body.appendChild(p);
      }
      box.appendChild(body);
      UI.sheetActions(box, [{ label: '닫기', ghost: true, onClick: UI.closeSheet }]);
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
    UI.closeSheet();
    UI.renderScene();
    const rec = State.data.cats[cat.breed];
    UI.toast((rec.name || info.species) + '이(가) 좋아해요' + (bonus ? ' (최애 선물!)' : ''));
    if (rec.aff >= RULES.affRegular && !rec.regularNoticed) {
      rec.regularNoticed = true;
      setTimeout(function () { UI.toast((rec.name || info.species) + '이(가) 단골이 되었어요'); }, 2400);
    }
  }

  function nameSheet(catId, after) {
    const info = CAT_BY_ID[catId];
    const rec = State.data.cats[catId];
    UI.openSheet(function (box) {
      UI.sheetHead(box, '이름 지어 주기', info.species + '에게 부를 이름을 정해 주세요');
      const stack = document.createElement('div');
      stack.className = 'sh-body sh-stack';
      const pw = document.createElement('div');
      pw.className = 'sh-portrait';
      pw.appendChild(spriteEl(catSprites(catId).portrait, 84));
      stack.appendChild(pw);
      box.appendChild(stack);

      const input = document.createElement('input');
      input.className = 'sh-input';
      input.type = 'text';
      input.maxLength = 8;
      input.placeholder = info.species;
      input.value = rec ? rec.name : '';
      input.autocomplete = 'off';
      box.appendChild(input);

      function commit() {
        State.nameCat(catId, input.value || info.species);
        UI.closeSheet();
        UI.renderAlbum();
        UI.toast('이제 ' + (State.data.cats[catId].name) + '(이)라고 부를게요');
        if (after) after();
      }
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
      });
      UI.sheetActions(box, [
        { label: '나중에', ghost: true, onClick: function () { UI.closeSheet(); if (after) after(); } },
        { label: '이 이름으로', onClick: commit },
      ]);
    });
  }

  function catSheet(catId) {
    const info = CAT_BY_ID[catId];
    const rec = State.data.cats[catId];
    UI.openSheet(function (box) {
      if (!rec) {
        UI.sheetHead(box, '아직 만나지 못했어요', RARITY[info.rarity].label);
        const body = document.createElement('div');
        body.className = 'sh-body';
        const p = document.createElement('p');
        p.textContent = info.rarity === 'common'
          ? '밥그릇에 밥을 담아 두고 기다려 보세요.'
          : '특별한 밥을 담아 두면 만날 확률이 올라가요.';
        body.appendChild(p);
        box.appendChild(body);
        UI.sheetActions(box, [{ label: '닫기', ghost: true, onClick: UI.closeSheet }]);
        return;
      }

      UI.sheetHead(box, rec.name || info.species, info.species + ' · ' + RARITY[info.rarity].label);
      const stack = document.createElement('div');
      stack.className = 'sh-body sh-stack';

      if (rec.photo) {
        const pol = document.createElement('div');
        pol.className = 'polaroid';
        const img = document.createElement('img');
        img.src = rec.photo;
        img.alt = (rec.name || info.species) + ' 사진';
        pol.appendChild(img);
        stack.appendChild(pol);
      } else {
        const empty = document.createElement('div');
        empty.className = 'polaroid empty';
        empty.textContent = '아직 사진이 없어요';
        stack.appendChild(empty);
      }

      const meta = document.createElement('dl');
      meta.className = 'sh-meta';
      [['방문', rec.visits + '번'],
        ['친밀도', rec.aff + (rec.aff >= RULES.affRegular ? ' · 단골' : '')],
        ['좋아하는 것', (GIFT_BY_ID[info.likes] || {}).name || '-']].forEach(function (row) {
        const dt = document.createElement('dt');
        dt.textContent = row[0];
        const dd = document.createElement('dd');
        dd.textContent = row[1];
        meta.appendChild(dt);
        meta.appendChild(dd);
      });
      stack.appendChild(meta);

      const desc = document.createElement('p');
      desc.textContent = info.desc;
      stack.appendChild(desc);
      box.appendChild(stack);

      UI.sheetActions(box, [
        { label: '닫기', ghost: true, onClick: UI.closeSheet },
        { label: '이름 바꾸기', onClick: function () { nameSheet(catId); } },
      ]);
    });
  }

  function guideSheet() {
    UI.openSheet(function (box) {
      UI.sheetHead(box, '냥밥 놀이 방법', '하루 할 일을 체크하고 길냥이를 모아요');
      const body = document.createElement('div');
      body.className = 'sh-body';
      [['할 일을 체크하면', '밥알이 한 알씩 생겨요.'],
        ['★ 특별한 할 일', '끝내면 특별한 밥이 생겨요. 하루 ' + RULES.maxStars + '개까지 지정할 수 있어요.'],
        ['하루 ' + RULES.bonusAt + '개를 넘기면', '특별한 밥을 덤으로 받아요.'],
        ['밥그릇을 누르면', '밥을 담을 수 있어요. 밥이 있어야 냥이가 찾아와요.'],
        ['특별한 밥을 담으면', '귀하거나 전설의 냥이가 올 수 있어요.'],
        ['냥이가 오면', '카메라로 찍어 도감에 남기고 이름을 지어 주세요.'],
        ['선물을 주면', '친밀도가 올라가고, 단골이 되면 더 자주 들러요.']].forEach(function (r) {
        const p = document.createElement('p');
        p.style.marginBottom = '10px';
        const b = document.createElement('b');
        b.style.color = 'var(--ink)';
        b.style.fontWeight = '700';
        b.textContent = r[0] + ' ';
        p.appendChild(b);
        p.appendChild(document.createTextNode(r[1]));
        body.appendChild(p);
      });
      box.appendChild(body);
      UI.sheetActions(box, [{ label: '알겠어요', onClick: UI.closeSheet }]);
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
      UI.toast('사진을 도감에 담았어요');
    }
  }

  /* ================= 이벤트 ================= */

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
          if (r.gain.bonus) UI.toast(r.gain.bonus);
          else if (r.gain.special > 0) UI.toast('특별한 밥이 생겼어요');
          else UI.toast('밥알 +' + r.gain.kibble);
        }
      } else if (act === 'star') {
        const t = State.data.todos.find(function (x) { return x.id === id; });
        if (t && t.done) { UI.toast('이미 끝낸 할 일이에요'); return; }
        const r = State.toggleStar(id);
        if (!r.ok) { UI.toast(r.reason); return; }
        UI.renderTodos();
        if (r.star) UI.toast('특별한 할 일로 정했어요');
      } else if (act === 'del') {
        State.removeTodo(id);
        UI.renderTodos();
      }
    });

    el.addForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const v = el.addInput.value;
      if (!v.trim()) return;
      State.addTodo(v);
      el.addInput.value = '';
      UI.renderTodos();
    });

    // 밥그릇 / 씬
    el.scene.addEventListener('click', function (e) {
      if (e.target.closest('.sbtn')) return;
      feedSheet();
    });
    el.hdFood.addEventListener('click', feedSheet);
    el.camBtn.addEventListener('click', function (e) { e.stopPropagation(); shoot(); });
    el.giftBtn.addEventListener('click', function (e) { e.stopPropagation(); giftSheet(); });

    // 탭
    el.tabs.addEventListener('click', function (e) {
      const b = e.target.closest('[data-tab]');
      if (b) setTab(b.dataset.tab);
    });

    // 도감
    el.albumGrid.addEventListener('click', function (e) {
      const c = e.target.closest('[data-cat]');
      if (c) catSheet(c.dataset.cat);
    });

    // 상점
    document.querySelector('.shop-tabs').addEventListener('click', function (e) {
      const b = e.target.closest('[data-shop]');
      if (!b) return;
      Array.prototype.forEach.call(b.parentNode.children, function (x) {
        x.classList.toggle('on', x === b);
      });
      UI.setShopTab(b.dataset.shop);
    });

    el.shopList.addEventListener('click', function (e) {
      const buy = e.target.closest('[data-buy]');
      const use = e.target.closest('[data-use]');
      const help = e.target.closest('[data-help]');
      if (help) { guideSheet(); return; }
      if (use) {
        if (State.useBowl(use.dataset.use)) {
          UI.renderShop();
          UI.renderHeader();
          UI.toast('밥그릇을 바꿨어요');
        } else {
          UI.toast('담긴 밥을 먼저 비워 주세요');
        }
        return;
      }
      if (buy) {
        const r = State.buy(buy.dataset.buy);
        if (!r.ok) { UI.toast(r.reason || '살 수 없어요'); return; }
        UI.renderShop();
        UI.renderHeader();
        UI.renderScene();
        UI.toast(r.item.name + '을(를) 샀어요');
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
        UI.toast('새로운 하루예요. 할 일을 다시 체크해 보세요');
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
    Scene.init(document.getElementById('room'));
    bind();
    UI.renderHeader();
    UI.renderTodos();
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
