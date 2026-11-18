"""Pre-launch SEO checks against a running copy of the site (default: tools/serve-clean.js on :8090).
  python tools/check-seo.py [base_url]
1) every old-site URL resolves (200, or 301 to a page that returns 200)
2) every sitemap URL returns 200
3) every internal link and image on every page resolves
4) every indexable page has one canonical, one H1, a title <= 60 and a description <= 155 characters
At launch, run it against https://akhitsolutions.com to test the real Apache rules."""
import html, re, sys, urllib.request, urllib.error
from urllib.parse import urljoin, urlsplit

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8090').rstrip('/')
OLD = ['/', '/service/web-app-development', '/service/web-site-development', '/service/mobile-app-development',
       '/service/artificial-intelligence', '/service/seo-service', '/service/graphic-designing', '/contact-us', '/about-us',
       '/portfolio', '/blog', '/careers', '/privacy-policy', '/terms-and-condition',
       '/blog/how-ai-is-impacting-businesses-and-the-world', '/blog/the-established-new-normal-work-from-home',
       '/blog/year-end-party-at-hotel-riu-sri-lanka',
       '/blog/a-k-h-it-solutions-marks-a-milestone-with-the-successful-launch-of-goddiva-ai',
       '/portfolio/market-place', '/portfolio/garment-manufacture-portal', '/portfolio/goddiva-ai',
       '/about-us.html', '/index.html', '/services.html', '/services', '/service', '/blog/', '/portfolio/', '/about-us/']


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None


opener = urllib.request.build_opener(NoRedirect)


def get(url):
    try:
        r = opener.open(url, timeout=20)
        return r.status, r.headers.get('Location'), r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get('Location'), e.read()


def resolve(url, hops=5):
    chain = []
    for _ in range(hops):
        code, loc, body = get(url)
        chain.append(code)
        if code in (301, 302, 307, 308) and loc:
            url = urljoin(url, loc)
            continue
        return code, url, chain, body
    return 0, url, chain, b''


fail = 0
print('1) Old URLs')
for p in OLD:
    code, final, chain, _ = resolve(BASE + p)
    ok = code == 200 and all(c == 301 for c in chain[:-1])
    fail += not ok
    print(f"  {'OK ' if ok else 'BAD'} {p:<90} {' > '.join(map(str, chain))}  {final.replace(BASE, '')}")

print('2) Sitemap')
_, _, _, sm = resolve(BASE + '/sitemap.xml')
locs = re.findall(r'<loc>https://akhitsolutions\.com(/[^<]*)</loc>', sm.decode())
for p in locs:
    code, final, chain, _ = resolve(BASE + p)
    if chain != [200]:
        fail += 1
        print(f'  BAD {p} {chain}')
print(f'  {len(locs)} URLs checked')

print('3) Internal links and images, 4) head checks')
seen, broken = {}, set()
for p in locs:
    code, final, chain, body = resolve(BASE + p)
    t = body.decode('utf-8', 'replace')
    title = html.unescape((re.search(r'<title>([^<]*)', t) or [0, ''])[1])
    desc = html.unescape((re.search(r'<meta name="description" content="([^"]*)', t) or [0, ''])[1])
    canon = re.findall(r'<link rel="canonical" href="([^"]+)"', t)
    h1 = len(re.findall(r'<h1[\s>]', t))
    probs = []
    if len(canon) != 1 or canon[0] != 'https://akhitsolutions.com' + p: probs.append(f'canonical {canon}')
    if h1 != 1: probs.append(f'{h1} h1')
    if len(title) > 60: probs.append(f'title {len(title)}')
    if not desc or len(desc) > 155: probs.append(f'description {len(desc)}')
    if 'noindex' in t: probs.append('noindex')
    if '—' in re.sub(r'<script.*?</script>', '', t, flags=re.S): probs.append('long dash')
    if probs:
        fail += 1
        print(f'  BAD {p}: {", ".join(probs)}')
    for ref in re.findall(r'(?:href|src)="([^"]+)"', re.sub(r'<!--.*?-->', '', t, flags=re.S)):
        if ref.startswith(('http', 'mailto:', 'tel:', '#', 'data:', 'javascript:')): continue
        u = urljoin(BASE + p, html.unescape(ref)).split('#')[0]
        if urlsplit(u).netloc != urlsplit(BASE).netloc: continue
        if u not in seen:
            seen[u] = resolve(u)[2]
        if seen[u] != [200]:
            broken.add((p, ref, tuple(seen[u])))
for b in sorted(broken):
    print(f'  BAD link on {b[0]}: {b[1]} {list(b[2])}')
fail += len(broken)
print(f'  {len(seen)} unique links and images checked')
print('PASS' if not fail else f'{fail} problem(s)')
sys.exit(1 if fail else 0)
