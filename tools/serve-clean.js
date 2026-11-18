// Local preview server for site/ that behaves like the live Apache setup (site/.htaccess):
// clean URLs (/about-us serves about-us.html), .html -> clean 301s, the old-site redirect map and the 404 page.
// Usage: node tools/serve-clean.js [port]   (default 8090). No dependencies.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'site');
const PORT = Number(process.argv[2]) || 8090;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain', '.gif': 'image/gif', '.woff2': 'font/woff2' };
// Keep in step with section 2 of site/.htaccess.
const REDIRECTS = [
  [/^\/blog\/?$/, '/news-events'], [/^\/portfolio\/?$/, '/#selected-work'], [/^\/(about|about-akh)\/?$/, '/about-us'],
  [/^\/contact\/?$/, '/contact-us'], [/^\/service\/?$/, '/services'], [/^\/terms(-and-conditions)?\/?$/, '/terms-and-condition'],
  [/^\/privacy\/?$/, '/privacy-policy'], [/^\/(news|events)\/?$/, '/news-events'], [/^\/portfolio\.html$/, '/#selected-work'],
];
const isFile = p => { try { return fs.statSync(p).isFile(); } catch { return false; } };
const send = (res, code, file) => { res.writeHead(code, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res); };
const redirect = (res, to) => { res.writeHead(301, { Location: to }); res.end(); };

http.createServer((req, res) => {
  const [rawPath, query = ''] = req.url.split('?');
  const p = decodeURIComponent(rawPath);
  const qs = query ? `?${query}` : '';
  for (const [re, to] of REDIRECTS) if (re.test(p)) return redirect(res, to);
  if (/(^|\/)index\.html$/.test(p)) return redirect(res, p.replace(/index\.html$/, '') + qs);
  if (p.endsWith('.html')) return redirect(res, p.slice(0, -5) + qs);
  if (p.length > 1 && p.endsWith('/') && !fs.existsSync(path.join(ROOT, p))) return redirect(res, p.slice(0, -1) + qs);
  const local = path.join(ROOT, p);
  if (!local.startsWith(ROOT)) { res.writeHead(400); return res.end(); }
  if (p === '/' || p.endsWith('/')) { const i = path.join(local, 'index.html'); if (isFile(i)) return send(res, 200, i); }
  if (isFile(local)) return send(res, 200, local);
  if (isFile(local + '.html')) return send(res, 200, local + '.html');
  send(res, 404, path.join(ROOT, '404.html'));
}).listen(PORT, () => console.log(`AKH site (clean URLs) on http://localhost:${PORT}`));
