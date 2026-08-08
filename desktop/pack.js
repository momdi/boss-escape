/* 배포용 .app 을 만든다.
   electron-builder 가 내려받는 바이너리 대신, npm 으로 설치된
   node_modules/electron 을 그대로 써서 이 맥에서 확실히 도는 앱을 만든다. */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const NAME = 'ChewDoList';
const DISPLAY = '츄두리스트';
const VERSION = require('./package.json').version;
const OUT = path.join(ROOT, 'dist');
const APP = path.join(OUT, NAME + '.app');

function sh(cmd, args) { execFileSync(cmd, args, { stdio: 'inherit' }); }
function plist(key, value, file) {
  execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Set :' + key + ' ' + value, file]);
}

/* 1) 앱 파일 준비 (심볼릭 링크 풀기) */
require('./build.js');

/* 2) Electron 껍데기 복사 */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
sh('cp', ['-R', path.join(ROOT, 'node_modules/electron/dist/Electron.app'), APP]);

/* 3) 기본 앱 제거하고 우리 앱 심기 */
const RES = path.join(APP, 'Contents', 'Resources');
fs.rmSync(path.join(RES, 'default_app.asar'), { force: true });
sh('cp', ['-R', path.join(ROOT, 'build'), path.join(RES, 'app')]);

/* 4) 이름·아이콘 */
const INFO = path.join(APP, 'Contents', 'Info.plist');
fs.renameSync(path.join(APP, 'Contents/MacOS/Electron'), path.join(APP, 'Contents/MacOS/' + NAME));
plist('CFBundleExecutable', NAME, INFO);
plist('CFBundleName', NAME, INFO);
plist('CFBundleDisplayName', DISPLAY, INFO);
plist('CFBundleIdentifier', 'com.momdi.chewdolist', INFO);
plist('CFBundleShortVersionString', VERSION, INFO);
plist('CFBundleVersion', VERSION, INFO);

const icns = path.join(ROOT, 'icon.icns');
if (fs.existsSync(icns)) {
  fs.copyFileSync(icns, path.join(RES, 'electron.icns'));
}

/* 5) 서명 (애드혹) */
sh('codesign', ['--force', '--deep', '--sign', '-', APP]);

/* 6) 압축 + DMG */
sh('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', APP,
             path.join(OUT, NAME + '-' + VERSION + '-mac.zip')]);
try {
  sh('hdiutil', ['create', '-volname', DISPLAY, '-srcfolder', APP, '-ov', '-format', 'UDZO',
                 path.join(OUT, NAME + '-' + VERSION + '.dmg')]);
} catch (e) {
  console.log('DMG 생성 실패 (zip 은 정상):', e.message);
}
console.log('\n완료 →', OUT);
