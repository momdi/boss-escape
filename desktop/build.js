/* 심볼릭 링크를 실제 파일로 풀어서 배포용 스테이징 폴더를 만든다 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'build');

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }

const SKIP = new Set(['.DS_Store', 'node_modules', '.git']);

function copyDeref(src, dst) {
  const st = fs.statSync(src);              /* statSync는 링크를 따라간다 */
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      if (SKIP.has(name)) continue;
      copyDeref(path.join(src, name), path.join(dst, name));
    }
  } else {
    fs.copyFileSync(src, dst);
  }
}

rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });

for (const f of ['main.js', 'preload.js']) {
  fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
}
copyDeref(path.join(ROOT, 'app'), path.join(OUT, 'app'));
fs.copyFileSync(path.join(ROOT, 'entitlements.mac.plist'),
                path.join(OUT, 'entitlements.mac.plist'));

/* 배포용 package.json (devDependencies 없이) */
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const outPkg = {
  name: pkg.name, version: pkg.version, description: pkg.description,
  main: 'main.js', author: pkg.author || 'momdi', license: 'UNLICENSED',
  build: Object.assign({}, pkg.build, { directories: { output: '../dist' } }),
};
fs.writeFileSync(path.join(OUT, 'package.json'), JSON.stringify(outPkg, null, 2));

console.log('staged →', OUT);
