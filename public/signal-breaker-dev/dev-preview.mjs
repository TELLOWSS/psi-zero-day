/**
 * SIGNAL BREAKER local web preview (zero Vercel deployments).
 * Run: node public/signal-breaker-dev/dev-preview.mjs
 * Uses only Node.js built-ins; binds to loopback, never to public interfaces.
 */
import { createServer } from 'node:http';
import { readFile, stat, watch } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveAssetPath } from './shared-paths.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SHARED_ASSETS = resolve(ROOT, '../assets');
const HOST = '127.0.0.1';
const PORT = Number(process.env.SIGNAL_BREAKER_PORT ?? '5199');
if (!Number.isInteger(PORT) || PORT < 0 || PORT > 65535) {
  throw new Error('SIGNAL_BREAKER_PORT must be an integer from 0 to 65535');
}
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
};
const clients = new Set();
const liveReload = `<script>\nif (typeof EventSource !== 'undefined') {\n  const stream = new EventSource('/__dev/events');\n  stream.addEventListener('refresh', () => location.reload());\n}\n</script>`;
let debounce;
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, `http://${HOST}/`).pathname); }
  catch { response.writeHead(400); response.end('Bad URL'); return; }
  if (pathname === '/__dev/events') {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    response.write(': connected\n\n');
    clients.add(response);
    request.on('close', () => clients.delete(response));
    return;
  }
  if (pathname.includes('\\') || pathname.includes('\0')) {
    response.writeHead(400); response.end('Invalid path'); return;
  }
  const shared=pathname.startsWith('/assets/');
  const absPath = shared?resolveAssetPath(SHARED_ASSETS,pathname):resolve(ROOT, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '.');
  if(!absPath){response.writeHead(403);response.end('Forbidden');return;}
  const rel = relative(shared?SHARED_ASSETS:ROOT, absPath);
  if (rel === '..' || rel.startsWith('..' + sep) || resolve(absPath) === ROOT && pathname !== '/') {
    response.writeHead(403); response.end('Forbidden'); return;
  }
  try {
    const fileStat = await new Promise((ok, no) => stat(absPath, (err, s) => err ? no(err) : ok(s)));
    if (!fileStat.isFile()) throw new Error('Not a file');
    let bytes = await new Promise((ok, no) => readFile(absPath, (err, b) => err ? no(err) : ok(b)));
    if (extname(absPath) === '.html') bytes = Buffer.from(bytes.toString('utf8').replace('</body>', `${liveReload}\n</body>`));
    response.writeHead(200, {
      'Content-Type': MIME[extname(absPath)] ?? 'application/octet-stream',
      'Content-Length': bytes.length, 'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('File not found');
  }
});
try {
  watch(ROOT, { recursive: true }, (_event, filename) => {
    if (!filename || filename.startsWith('tests' + sep)) return;
    clearTimeout(debounce);
    debounce = setTimeout(() => { for (const client of clients) client.write('event: refresh\ndata: updated\n\n'); }, 140);
  });
} catch (err) {
  console.warn('[SIGNAL BREAKER] Automatic reload unavailable; refresh browser after changes.', String(err));
}
server.on('error', err => {
  console.error(`[SIGNAL BREAKER] Cannot start local server: ${err.message}`);
  process.exitCode = 1;
});
server.listen(PORT, HOST, () => {
  const actualPort = server.address().port;
  console.info(`\nSIGNAL BREAKER LOCAL WEB PREVIEW\nhttp://${HOST}:${actualPort}/\nNo Git push or Vercel deployment required.\nPress Ctrl+C to stop.\n`);
});
