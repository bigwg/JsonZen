/* eslint-env node */
/**
 * prepack 钩子：发布前把根目录构建好的 dist 拷贝进 cli/dist，
 * 确保发布到 npm 的包内含预构建产物（使用者无需源码）。
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const rootDist = path.join(root, 'dist');
const cliDist = path.join(__dirname, 'dist');

if (!fs.existsSync(rootDist)) {
  console.log('根目录 dist/ 不存在，先执行 npm run build ...');
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
}

fs.rmSync(cliDist, { recursive: true, force: true });
fs.cpSync(rootDist, cliDist, { recursive: true });
console.log('✔ 已将 dist/ 拷贝到 cli/dist，可发布。');
