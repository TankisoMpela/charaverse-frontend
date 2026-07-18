import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import handler from './api/chat.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    handler(req, res);
    return;
  }

  let path = req.url === '/' ? '/index.html' : req.url;
  // SPA: serve index.html for non-file routes
  if (!extname(path)) path = '/index.html';
  const file = join(dist, path);

  if (!existsSync(file)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const content = readFileSync(file);
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(content);
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
