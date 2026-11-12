// テスト対象のデモアプリ用サーバー（外部ライブラリなし）
// - app/ 配下の静的ファイルを配信
// - /api/* にインメモリの簡易APIを用意（書類受付API を想定）
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT ?? 3000);
const APP_DIR = path.join(__dirname, 'app');
const USERS = { demo: 'demo-pass' }; // デモ用のダミーアカウント
const ALLOWED_EXT = /\.(pdf|png|jpe?g|tiff?)$/i;

const sessions = new Set();
const documents = [];
let nextId = 1;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function problem(res, status, title, detail, extra = {}) {
  res.writeHead(status, { 'Content-Type': 'application/problem+json; charset=utf-8' });
  res.end(JSON.stringify({ status, title, detail, ...extra }));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return null;
  }
}

function authorized(req) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
  return sessions.has(token);
}

function validateDocument(body) {
  const errors = {};
  const fileName = typeof body.fileName === 'string' ? body.fileName.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!fileName) errors.fileName = 'ファイル名を入力してください';
  else if (!ALLOWED_EXT.test(fileName)) errors.fileName = '対応している拡張子は pdf / png / jpg / jpeg / tif / tiff です';
  if (!content) errors.content = '本文を入力してください';
  return { errors, fileName, content };
}

async function handleApi(req, res, url) {
  if (req.method === 'POST' && url.pathname === '/api/login') {
    const body = await readJson(req);
    if (body && USERS[body.username] && USERS[body.username] === body.password) {
      const token = crypto.randomUUID();
      sessions.add(token);
      return sendJson(res, 200, { token, username: body.username });
    }
    return problem(res, 401, 'Unauthorized', 'ユーザー名またはパスワードが違います');
  }

  if (!authorized(req)) return problem(res, 401, 'Unauthorized', 'ログインしてください');

  if (req.method === 'GET' && url.pathname === '/api/documents') {
    return sendJson(res, 200, [...documents].reverse());
  }

  if (req.method === 'POST' && url.pathname === '/api/documents') {
    const body = await readJson(req);
    if (!body) return problem(res, 400, 'Bad Request', 'JSON の形式が正しくありません');
    const { errors, fileName, content } = validateDocument(body);
    if (Object.keys(errors).length > 0) {
      return problem(res, 400, 'Validation Error', '入力内容に誤りがあります', { errors });
    }
    const doc = { id: nextId++, fileName, content, status: 'RECEIVED', createdAt: new Date().toISOString() };
    documents.push(doc);
    res.setHeader('Location', `/api/documents/${doc.id}`);
    return sendJson(res, 201, doc);
  }

  return problem(res, 404, 'Not Found', `${req.method} ${url.pathname}`);
}

function serveStatic(res, pathname) {
  const file = path.normalize(path.join(APP_DIR, pathname === '/' ? 'index.html' : pathname));
  if (!file.startsWith(APP_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end('Not Found');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    try {
      if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
      return serveStatic(res, url.pathname);
    } catch (e) {
      console.error(e);
      return problem(res, 500, 'Internal Server Error', 'サーバーエラーが発生しました');
    }
  })
  .listen(PORT, () => console.log(`demo app: http://localhost:${PORT}`));
