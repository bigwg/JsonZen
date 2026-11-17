#!/usr/bin/env node
/* eslint-env node */
/**
 * JsonZen 零依赖 CLI 启动器
 * 用法: jsonzen [start|stop|update]   （无参数默认 start；npx @bigvvg/jsonzen 或 npm i -g @bigvvg/jsonzen 后使用）
 * 直接 serve 同包内的预构建 dist 静态文件，监听 8508；stop 通过 PID 文件管理后台进程。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const PORT = 8508;
const DIST = path.join(__dirname, 'dist');
const PID_FILE = path.join(os.homedir(), '.jsonzen', 'pid');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.woff2':'font/woff2',
  '.map':  'application/json'
};

// 真正起 HTTP 服务的函数（被 detached 子进程以 --serve 调用）
function serve() {
  if (!fs.existsSync(DIST)) {
    console.error('❌ 未找到预构建产物 dist/，请重新发布（npm run build 后再 npm publish）。');
    process.exit(1);
  }
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    let filePath = path.normalize(path.join(DIST, urlPath));
    // 目录穿越防护
    if (!filePath.startsWith(DIST)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        // SPA 兜底（HashRouter 下通常不需要，但保留以防直接刷新非 hash 路径）
        filePath = path.join(DIST, 'index.html');
      }
      fs.readFile(filePath, (readErr, data) => {
        if (readErr) {
          res.writeHead(404);
          return res.end('Not found');
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
  });

  server.on('error', (e) => {
    console.error(`❌ 启动失败（端口 ${PORT} 可能被占用）: ${e.message}`);
    process.exit(1);
  });

  server.listen(PORT);
}

function getPid() {
  try { return parseInt(fs.readFileSync(PID_FILE, 'utf8'), 10); } catch { return null; }
}

function isRunning(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

const cmd = process.argv[2] || 'start';

if (cmd === '--serve') {
  // 内部使用：后台子进程真正运行的服务
  serve();
} else if (cmd === 'start') {
  const pid = getPid();
  if (isRunning(pid)) {
    console.log(`ℹ️  JsonZen 已在运行，访问 http://localhost:${PORT}`);
    process.exit(0);
  }
  fs.mkdirSync(path.dirname(PID_FILE), { recursive: true });
  // 以 detached 方式后台拉起服务进程，父进程退出后服务继续运行
  const child = spawn(process.execPath, [__filename, '--serve'], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
  fs.writeFileSync(PID_FILE, String(child.pid));
  console.log('\n✅ JsonZen 已启动（后台运行）！访问：');
  console.log(`   👉 http://localhost:${PORT}\n`);
  console.log('   停止： jsonzen stop       更新： jsonzen update\n');
} else if (cmd === 'stop') {
  const pid = getPid();
  if (isRunning(pid)) {
    try { process.kill(pid, 'SIGTERM'); } catch { /* ignore */ }
    fs.rmSync(PID_FILE, { force: true });
    console.log('✅ JsonZen 已停止');
  } else {
    console.log('ℹ️  JsonZen 当前未在运行');
  }
} else if (cmd === 'update') {
  const { execSync } = require('child_process');
  try {
    execSync('npm install -g @bigvvg/jsonzen@latest', { stdio: 'inherit' });
    console.log('\n✅ 已更新到最新版，请重新运行 jsonzen\n');
  } catch (e) {
    console.log('⚠️  全局更新失败，请改用： npx @bigvvg/jsonzen@latest\n');
  }
} else {
  console.log('用法: jsonzen [start|stop|update]   （不带参数默认 start）');
}
