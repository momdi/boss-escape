/* ===========================================================
   츄두리스트 데스크톱 — 바탕화면 위 길냥이
   overlay: 투명·클릭통과 창 (냥이 + 밥그릇)
   memo   : 할 일 창 (밥그릇 더블클릭으로 열림)
   =========================================================== */
const { app, BrowserWindow, screen, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const STORE = path.join(app.getPath('userData'), 'state.json');

const DEFAULT_STATE = {
  kibble: 0,
  food: { n: 0 },
  bowl: { x: 0.5, y: 0.8 },     /* 화면 비율 좌표 */
  todos: [],
  cats: {},
  sound: true,
  feedMode: 'full',
  date: '',
};

let state = null;
let overlay = null;
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
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  overlay.setAlwaysOnTop(true, 'screen-saver');
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlay.setIgnoreMouseEvents(true, { forward: true });   /* 기본은 클릭 통과 */
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
    backgroundColor: '#f4eee3',
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  memo.loadFile(path.join(__dirname, 'app', 'web', 'index.html'));
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
ipcMain.on('food:eat', function () { toMemo('eat'); });

/* 웹 앱이 알려 준 사료·밥 상태를 오버레이에 전달 */
ipcMain.on('state:push', function (e, snap) {
  state.kibble = snap.kibble;
  state.special = snap.special;
  state.food = snap.food;
  state.cap = snap.cap;
  broadcast();
});

ipcMain.on('memo:open', function () { createMemo(); });

/* 게임 메시지는 바탕화면 밥그릇 옆에 띄운다 */
ipcMain.on('notice', function (e, text) {
  if (overlay && !overlay.isDestroyed()) overlay.webContents.send('notice', text);
});

ipcMain.on('sound:set', function (e, on) { state.sound = !!on; broadcast(); });

/* 밥그릇 우클릭 메뉴 */
ipcMain.on('bowl:menu', function () {
  const menu = Menu.buildFromTemplate([
    { label: '지금 밥 주기', click: function () { toMemo('feed', state.feedMode); } },
    { type: 'separator' },
    { label: '가득 채우기', type: 'radio', checked: state.feedMode !== 'one',
      click: function () { state.feedMode = 'full'; broadcast(); toMemo('feed', 'full'); } },
    { label: '한 알만 채우기', type: 'radio', checked: state.feedMode === 'one',
      click: function () { state.feedMode = 'one'; broadcast(); toMemo('feed', 'one'); } },
    { type: 'separator' },
    { label: '할 일 창 열기', click: function () { createMemo(); } },
    { label: '냥이 부르기', click: function () {
        if (overlay && !overlay.isDestroyed()) overlay.webContents.send('summon');
      } },
    { label: '소리', type: 'checkbox', checked: state.sound !== false,
      click: function () { state.sound = !state.sound; broadcast(); } },
    { type: 'separator' },
    { label: '츄두리스트 종료', click: function () { app.quit(); } },
  ]);
  menu.popup({ window: overlay });
});

ipcMain.on('cat:met', function (e, breed) { toMemo('met', breed); });

app.whenReady().then(function () {
  loadState();
  createOverlay();
  createMemo();
});

app.on('before-quit', function () { app.isQuitting = true; });
app.on('window-all-closed', function () { app.quit(); });
