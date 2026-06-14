/**
 * WebFast Dev Server - 轻量开发服务器
 *
 * 功能：
 * - 静态文件服务
 * - SPA 路由回退（所有路径返回 index.html）
 * - 自动扫描 pages/ 目录生成路由表（可选增强）
 *
 * 用法：
 *   node server.js [port]
 *   默认端口 8080
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.argv[2], 10) || 5200;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

/**
 * 安全解析路径，防止目录遍历
 */
function safePath(reqPath) {
  const decoded = decodeURIComponent(reqPath);
  const resolved = path.resolve(path.join(ROOT, decoded));
  // 确保解析后的路径在 ROOT 目录内
  if (!resolved.startsWith(ROOT)) {
    return null;
  }
  return resolved;
}

/**
 * 发送文件响应
 */
function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

/**
 * 发送 index.html（SPA 回退）
 */
function sendIndex(res) {
  const indexPath = path.join(ROOT, 'index.html');
  sendFile(res, indexPath);
}

const server = http.createServer((req, res) => {
  // 设置 CORS 头，允许本地开发
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = url.parse(req.url);
  const reqPath = parsed.pathname;

  // 安全路径检查
  const filePath = safePath(reqPath);
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      // 文件不存在 → SPA 回退到 index.html
      sendIndex(res);
      return;
    }

    if (stats.isDirectory()) {
      // 目录 → 尝试查找 index.html
      const indexFile = path.join(filePath, 'index.html');
      fs.access(indexFile, fs.constants.F_OK, (err) => {
        if (err) {
          sendIndex(res);
        } else {
          sendFile(res, indexFile);
        }
      });
      return;
    }

    // 文件存在，直接发送
    sendFile(res, filePath);
  });
});

server.listen(PORT, () => {
  console.log(`\n  WebFast Dev Server running at http://localhost:${PORT}`);
  console.log(`  Press Ctrl+C to stop\n`);
});
