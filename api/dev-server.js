import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from './chat.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('ok');
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    req.body = body || null;
    handler(req, res);
  });
});

const port = parseInt(process.argv.find(a => a.startsWith('--port='))?.split('=')[1] || process.env.PORT || '3001', 10);
server.listen(port, () => {
  console.log(`API server on http://localhost:${port}`);
});
