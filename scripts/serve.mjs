// Tiny static server for local play-testing: npm start → http://localhost:8080
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.md':'text/markdown; charset=utf-8' };
const port = Number(process.env.PORT) || 8080;
createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const rel = normalize(urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath).replace(/^[\\/]+/, '');
  const file = join(root, rel);
  if(!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try { const body = await readFile(file); res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end('Not found'); }
}).listen(port, () => console.log(`Adventure Bay running at http://localhost:${port}  (add ?debug_analytics=1 to see analytics events in the console)`));
