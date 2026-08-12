/* ===========================================================
   츄두리스트 데스크톱 — 바탕화면 위 길냥이
   overlay: 투명·클릭통과 창 (냥이 + 밥그릇)
   memo   : 할 일 창 (밥그릇 더블클릭으로 열림)
   =========================================================== */
const { app, BrowserWindow, screen, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const STORE = path.join(app.getPath('userData'), 'state.json');
const LOGF = path.join(app.getPath('userData'), 'run.log');
function log() {
  try {
    fs.appendFileSync(LOGF, Array.prototype.join.call(arguments, ' ') + '\n');
  } catch (e) { /* 무시 */ }
}
process.on('uncaughtException', function (e) { log('UNCAUGHT', e && e.stack); });
app.on('will-quit', function () { log('will-quit'); });
app.on('window-all-closed', function () { log('all-closed'); });

const DEFAULT_STATE = {
  kibble: 0,
  food: { n: 0 },
  bowl: { x: 0.5, y: 0.94 },    /* 화면 비율 좌표 — 처음엔 화면 아래쪽 */
  bowlId: 'bowl_basic',         /* 쓰고 있는 밥그릇 종류 (위치와 별개) */
  todos: [],
  cats: {},
  sound: true,
  seen: false,
  feedMode: 'full',
  date: '',
};

let state = null;
let overlay = null;
let catsHere = [];
let memo = null;

function today() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function loadState() {
  try {
    state = Object.assign({}, DEFAULT_STATE, JSON.parse(fs.readFileSync(STORE, 'utf8')));
  } catch (e) {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  if (state.date !== today()) {
    state.date = today();
    state.todos.forEach(function (t) { t.done = false; });
  }
  if (!state.todos.length) {
    state.todos = [
      { id: 1, text: '물 마시기', done: false },
      { id: 2, text: '스트레칭 10분', done: false },
      { id: 3, text: '책 20분 읽기', done: false },
    ];
  }
}

function saveState() {
  try { fs.writeFileSync(STORE, JSON.stringify(state)); } catch (e) { /* 무시 */ }
}

function broadcast() {
  saveState();
  [overlay, memo].forEach(function (w) {
    if (w && !w.isDestroyed()) w.webContents.send('state', state);
  });
}

function createOverlay() {
  const d = screen.getPrimaryDisplay();
  const b = d.bounds;
  overlay = new BrowserWindow({
    x: b.x, y: b.y, width: b.width, height: b.height,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    hasShadow: false,
    skipTaskbar: true,
    focusable: true,
    alwaysOnTop: true,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
    },
  });
  /* 'screen-saver' 레벨은 화면 녹화·캡처에서 뒤 창을 검게 만든다.
     한 단계 낮춘 'floating' 이면 캡처에 정상으로 함께 담긴다. */
  overlay.setAlwaysOnTop(true, 'floating');
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  overlay.setIgnoreMouseEvents(true, { forward: true });   /* 기본은 클릭 통과 */
  overlay.webContents.on('render-process-gone', function (e, d) {
    log('overlay gone', JSON.stringify(d));
  });
  overlay.loadFile(path.join(__dirname, 'app', 'overlay.html'));
}

function createMemo(show) {
  if (memo && !memo.isDestroyed()) {
    if (show !== false) { memo.show(); memo.focus(); }
    return;
  }
  memo = new BrowserWindow({
    width: 380, height: 620,
    minWidth: 320, minHeight: 480,
    title: '츄두리스트',
    resizable: true,
    show: show !== false,
    backgroundColor: '#faf8f4',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
    },
  });
  memo.loadFile(path.join(__dirname, 'app', 'web', 'index.html'));

  /* 할 일 창이 덮은 영역에서는 오버레이가 클릭을 가로채지 않게 한다 */
  const sendBounds = function () {
    if (!overlay || overlay.isDestroyed()) return;
    const vis = memo && !memo.isDestroyed() && memo.isVisible();
    overlay.webContents.send('memoBounds', vis ? memo.getBounds() : null);
  };
  ['move', 'resize', 'show', 'hide', 'focus', 'blur', 'minimize', 'restore'].forEach(function (ev) {
    memo.on(ev, sendBounds);
  });
  memo.webContents.on('did-finish-load', sendBounds);
  /* 닫아도 상태 엔진은 살려 둔다 */
  memo.on('close', function (e) {
    if (!app.isQuitting) { e.preventDefault(); memo.hide(); }
  });
}

/* ---------- IPC ---------- */

ipcMain.handle('state:get', function () { return state; });

ipcMain.on('overlay:interactive', function (e, on) {
  if (!overlay || overlay.isDestroyed()) return;
  overlay.setIgnoreMouseEvents(!on, { forward: true });
});

ipcMain.on('bowl:move', function (e, pos) {
  state.bowl = pos;
  broadcast();
});

function toMemo(channel, payload) {
  createMemo(false);                       /* 없으면 숨긴 채로 띄운다 */
  if (memo && !memo.isDestroyed()) memo.webContents.send(channel, payload);
}

ipcMain.on('bowl:feed', function (e, mode) { toMemo('feed', mode || 'full'); });
ipcMain.on('bowl:undoFeed', function () { toMemo('undoFeed'); });
ipcMain.on('food:eat', function () { toMemo('eat'); });
ipcMain.on('cats:here', function (e, list) { catsHere = list || []; });

/* 웹 앱이 알려 준 사료·밥 상태를 오버레이에 전달 */
ipcMain.on('state:push', function (e, snap) {
  state.kibble = snap.kibble;
  state.special = snap.special;
  state.food = snap.food;
  state.cap = snap.cap;
  state.gifts = snap.gifts || [];
  state.bowlId = snap.bowlId || 'bowl_basic';
  broadcast();
});

ipcMain.on('memo:open', function () { createMemo(); });
ipcMain.on('seen', function () { state.seen = true; saveState(); });

/* 게임 메시지는 바탕화면 밥그릇 옆에 띄운다 */
ipcMain.on('notice', function (e, text) {
  if (overlay && !overlay.isDestroyed()) overlay.webContents.send('notice', text);
});

ipcMain.on('sound:set', function (e, on) { state.sound = !!on; broadcast(); });

/* 고양이 우클릭 메뉴 — 선물 주기 */
ipcMain.on('cat:menu', function (e, cat) {
  const gifts = state.gifts || [];
  const items = [
    { label: cat.name, enabled: false },
    { type: 'separator' },
    { label: '사진 찍기', click: function () {
        if (overlay && !overlay.isDestroyed()) overlay.webContents.send('shoot', cat.id);
      } },
    { label: '보내주기', click: function () {
        if (overlay && !overlay.isDestroyed()) overlay.webContents.send('sendAway', cat.id);
      } },
    { type: 'separator' },
  ];
  if (!gifts.length) {
    items.push({ label: '상점에서 선물을 사 보세요', enabled: false });
  } else {
    gifts.forEach(function (g) {
      items.push({
        label: g.name + ' × ' + g.n,
        click: function () {
          toMemo('gift', { id: g.id, breed: cat.breed });
          if (overlay && !overlay.isDestroyed()) {
            overlay.webContents.send('giftDone', { id: cat.id, summon: g.summon });
          }
        },
      });
    });
  }
  items.push({ type: 'separator' });
  items.push({ label: '할 일 창 열기', click: function () { createMemo(); } });
  Menu.buildFromTemplate(items).popup({ window: overlay });
});

/* 밥그릇 우클릭 메뉴 */
ipcMain.on('bowl:menu', function () {
  const menu = Menu.buildFromTemplate([
    { label: '지금 밥 주기', click: function () { toMemo('feed', state.feedMode); } },
    { label: '황금 사료 담기' + (state.special ? ' (' + state.special + ')' : ''),
      enabled: !!state.special,
      click: function () { toMemo('feedSpecial'); } },
    { type: 'separator' },
    { label: '가득 채우기', type: 'radio', checked: state.feedMode !== 'one',
      click: function () { state.feedMode = 'full'; broadcast(); } },
    { label: '한 알만 채우기', type: 'radio', checked: state.feedMode === 'one',
      click: function () { state.feedMode = 'one'; broadcast(); } },
    { type: 'separator' },
    { label: '할 일 창 열기', click: function () { createMemo(); } },
    { label: '냥이 부르기', click: function () {
        if (overlay && !overlay.isDestroyed()) overlay.webContents.send('summon');
      } },
    { label: '모두 보내주기', click: function () {
        if (overlay && !overlay.isDestroyed()) overlay.webContents.send('sendAway', '*');
      } },
    { label: '소리', type: 'checkbox', checked: state.sound !== false,
      click: function () { state.sound = !state.sound; broadcast(); } },
    { type: 'separator' },
    { label: '츄두리스트 종료', click: function () { app.quit(); } },
  ]);
  menu.popup({ window: overlay });
});

ipcMain.on('cat:met', function (e, breed) { toMemo('met', breed); });
ipcMain.on('cat:left', function (e, breed) { toMemo('left', breed); });

/* 오버레이가 찍은 사진을 메모 창(도감)에 저장 */
ipcMain.on('photo:save', function (e, p) { toMemo('photo', p); });

/* 두 번 실행되면 밥그릇도 두 개가 된다 — 한 번만 뜨도록 */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', function () { createMemo(); });
}

/* 창 안에서 외부 페이지가 열리지 않게 막는다 */
app.on('web-contents-created', function (e, contents) {
  contents.setWindowOpenHandler(function (d) {
    if (/^https?:$/.test(new URL(d.url).protocol)) shell.openExternal(d.url);
    return { action: 'deny' };
  });
  contents.on('will-navigate', function (ev, url) {
    if (!url.startsWith('file://')) ev.preventDefault();
  });
});

app.whenReady().then(function () {
  log('=== ready ===', process.version, process.versions.electron);
  loadState();
  log('state loaded');
  createOverlay();
  log('overlay ok');
  createMemo();
  log('memo ok');

  /* 오버레이를 모든 데스크톱에 띄우면 Electron 이 앱을 백그라운드(UIElement)로
     바꿔 버려서 Dock 에 안 뜬다. 다시 일반 앱으로 되돌린다. */
  if (app.dock) {
    app.dock.show();
    const icon = path.join(__dirname, 'app', 'img', 'icon-512.png');
    try {
      const { nativeImage } = require('electron');
      if (fs.existsSync(icon)) app.dock.setIcon(nativeImage.createFromPath(icon));
    } catch (e) { log('dock icon', e && e.message); }
  }
  log('dock shown');

  /* 처음 켠 사람에게 옮길 수 있다는 걸 알려 준다 */
  if (!state.seen && overlay && !overlay.isDestroyed()) {
    setTimeout(function () {
      overlay.webContents.send('notice', '밥그릇과 고양이는 끌어서 옮길 수 있어요');
    }, 2500);
    setTimeout(function () {
      overlay.webContents.send('notice', '밥그릇을 두 번 누르면 할 일 창이 열려요');
    }, 7000);
    state.seen = true;
    saveState();
  }

});

app.on('activate', function () { createMemo(); });
app.on('before-quit', function () { app.isQuitting = true; });
app.on('window-all-closed', function () { app.quit(); });
