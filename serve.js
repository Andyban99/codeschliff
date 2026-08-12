/* Minimaler statischer Server für die lokale Vorschau (keine Abhängigkeiten).
   Range-Requests sind für die MP4-Wiedergabe nötig. */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  // Nur lokal, nur zur Asset-Erzeugung: PNG aus dem Browser speichern
  if (req.method === 'POST' && urlPath === '/save') {
    const name = new URL(req.url, 'http://x').searchParams.get('name') || '';
    if (!/^[\w.-]+\.png$/.test(name)) { res.writeHead(400); res.end('bad name'); return; }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const b64 = Buffer.concat(chunks).toString().replace(/^data:image\/png;base64,/, '');
      fs.writeFile(path.join(ROOT, 'assets', 'img', name), Buffer.from(b64, 'base64'), (e) => {
        res.writeHead(e ? 500 : 200); res.end(e ? 'fail' : 'ok');
      });
    });
    return;
  }

  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); res.end('Nicht gefunden'); return; }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;

    if (range && /^bytes=/.test(range)) {
      const [startStr, endStr] = range.replace('bytes=', '').split('-');
      const start = parseInt(startStr, 10) || 0;
      const end = endStr ? Math.min(parseInt(endStr, 10), stat.size - 1) : stat.size - 1;
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Type': type,
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
}).listen(PORT, () => console.log(`codeschliff läuft auf http://localhost:${PORT}`));
