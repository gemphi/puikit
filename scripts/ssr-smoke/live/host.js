// Writes the two host pages and serves ./live over http so the apps run for real.
const fs = require('fs');
const path = require('path');
const http = require('http');

const DIR = __dirname;
// Read the stylesheet per request, not once at startup: the bundle is rebuilt
// between runs, and a cached copy here silently serves stale CSS — which looks
// exactly like a fix that did not work.
const css = () => fs.readFileSync(path.join(DIR, '..', 'bundle.css'), 'utf8');

const html = (title, script) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>${css()}</style>
<style>
  /* Google Fonts are unreachable offline; fall back to local families. */
  :root { --chanel-serif: Georgia, 'Times New Roman', serif; }
  html, body { margin: 0; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
</style>
</head><body><div id="root"></div>
<script>window.__errors = []; window.addEventListener('error', e => window.__errors.push(String(e.message)));</script>
<script src="./${script}"></script>
</body></html>`;

const PAGES = {
  '/chanel.html': () => html('Chanel', 'chanel.js'),
  '/book.html': () => html('PUI Book', 'book.js'),
  '/phlick.html': () => html('phlick', 'phlick.js'),
};

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((rq, rs) => {
  const route = decodeURIComponent(rq.url.split('?')[0]) || '/chanel.html';
  const page = PAGES[route === '/' ? '/chanel.html' : route];
  if (page) {
    rs.writeHead(200, { 'content-type': 'text/html' });
    return rs.end(page());
  }
  const p = path.join(DIR, route.replace(/^\/+/, ''));
  if (!p.startsWith(DIR) || !fs.existsSync(p)) { rs.writeHead(404); return rs.end('nope'); }
  rs.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(rs);
});
server.listen(8788, () => console.log('serving http://127.0.0.1:8788/'));
