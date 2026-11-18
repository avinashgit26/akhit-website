# SEO and migration plan: akhitsolutions.com

Round 28 (2026-11-18). This covers moving from the old akhitsolutions.com (Apache, Laravel) to the new static site without losing search visibility.

## What changed in the new site

| Area | Before | Now |
|---|---|---|
| URLs | `.html` links (`about-us.html`) | Clean URLs that match the old site (`/about-us`, `/service/seo-service`) |
| Canonicals | none | One `<link rel="canonical">` per page, pointing at `https://akhitsolutions.com/<path>` |
| Sitemap / robots | none | `site/sitemap.xml` (25 URLs) and `site/robots.txt` |
| 404 | none | `site/404.html`, with links to the main pages and `noindex` |
| Titles | 5 over 60 characters | All 60 or fewer |
| Descriptions | 6 over 160 characters | All 155 or fewer |
| Social sharing | og:image on 3 pages | og:image (JPG), og:url and twitter:card on every page; a general share image at `website/images/share/akh-share.jpg` |
| Structured data | Home (organisation and FAQ), 2 news articles | Also BreadcrumbList on inner pages, Service on 6 service pages, FAQPage on Services, BlogPosting on 4 blog posts |
| Headings | 5 pages skipped a level | Award cards and Privacy fixed; every page has one H1 |
| Images | about 16 MB used, mostly 1.5–2.5 MB PNGs | WebP, about 2 MB in total (originals kept on disk); width and height on images, lazy loading below the first section, priority hints on hero images |
| Fonts | loaded through chained CSS `@import`s | preconnect plus a direct stylesheet link in every page |
| Old blog | 4 posts | Migrated to the same URLs under `/blog/`, and listed under "From our blog" on News & events |
| Terms | `/terms-and-condition` | Migrated to the same URL (⚑ legal review, like Privacy) |

## URL map (old site to new site)

Most old URLs have a page with exactly the same path, so they keep their rankings with no redirect.

| Old URL | New site | Result |
|---|---|---|
| `/` | Home | 200 |
| `/service/web-app-development` | same | 200 |
| `/service/web-site-development` | same | 200 |
| `/service/mobile-app-development` | same | 200 |
| `/service/artificial-intelligence` | same (AI Hub) | 200 |
| `/service/seo-service` | same | 200 |
| `/service/graphic-designing` | same | 200 |
| `/about-us` | same | 200 |
| `/contact-us` | same | 200 |
| `/careers` | same | 200 |
| `/privacy-policy` | same | 200 |
| `/terms-and-condition` | same (migrated) | 200 |
| `/portfolio/market-place` | same case study | 200 |
| `/portfolio/garment-manufacture-portal` | same case study | 200 |
| `/blog/how-ai-is-impacting-businesses-and-the-world` | same (migrated) | 200 |
| `/blog/the-established-new-normal-work-from-home` | same (migrated) | 200 |
| `/blog/year-end-party-at-hotel-riu-sri-lanka` | same (migrated) | 200 |
| `/blog/a-k-h-it-solutions-marks-a-milestone-with-the-successful-launch-of-goddiva-ai` | same (migrated) | 200 |
| `/blog` | `/news-events` | 301 |
| `/portfolio` | `/#selected-work` (the Work page stays off the live site) | 301 |
| any `*.html` URL | the clean URL (`/about-us.html` to `/about-us`, `/index.html` to `/`) | 301 |
| `http://…` and `www.…` | `https://akhitsolutions.com/…` | 301 |
| `/about`, `/contact`, `/service`, `/terms`, `/privacy`, `/news`, `/events` | the matching page | 301 (common guesses) |
| anything else | `404.html` | 404 |

Old images under `/uploads/blog/...` are not redirected: they were copied into `website/images/blog/` and are now served as WebP.

## Files for the developers

- `site/.htaccess`: every rule above, plus gzip and cache headers. It needs `mod_rewrite`, and ideally `mod_headers`, `mod_deflate` and `mod_expires`. Upload it with the site to the web root of akhitsolutions.com.
- `tools/serve-clean.js`: a local server that behaves like the `.htaccess` (run `node tools/serve-clean.js`, then open http://localhost:8090). Its redirect list must stay in step with section 2 of the `.htaccess`.
- `tools/check-seo.py`: the pre-launch test. It checks every old URL, every sitemap URL, every internal link and image, and the head of every page.
  - Local run: `python tools/check-seo.py`.
  - After launch: `python tools/check-seo.py https://akhitsolutions.com`.

If the site is hosted somewhere without `.htaccess` (Nginx, Netlify, Cloudflare Pages), copy the table above into that host's redirect rules. Clean URLs need an equivalent of "try `$uri`, then `$uri.html`".

## Pre-launch checklist

1. ☐ `python tools/check-seo.py` passes locally.
2. ☐ Upload `site/` (including `.htaccess`) to a staging folder or subdomain on the real server and run `python tools/check-seo.py https://<staging-host>`. This tests the real Apache rules; GitHub Pages ignores `.htaccess`.
3. ☐ Mobile Lighthouse (Chrome DevTools) on Home, Services, AI Hub, About and one case study. Aim for 90+ on SEO and Best practices, and for LCP under 2.5s.
4. ☐ Paste Home, Services, one service page, one case study and one blog post into Google's Rich Results Test. Breadcrumbs, FAQ and Article should be detected with no errors.
5. ☐ Make sure nothing on the live domain says `noindex` (only `404.html` should).
6. ☐ Make sure the old site's Search Console property is verified and its data kept: it is the baseline for the comparison after launch.
7. ☐ Export the old site's top pages and queries from Search Console (last 3 months) and keep them with this document.

## Launch day

1. Point akhitsolutions.com at the new site, with HTTPS on.
2. Run `python tools/check-seo.py https://akhitsolutions.com`. Every line should say OK.
3. In Google Search Console (owner: AKH's Google account):
   1. Add or confirm a Domain property for `akhitsolutions.com`, verified by DNS TXT record. A Domain property covers http, https, www and non-www together. If DNS isn't available, use the HTML tag: the placeholder comment is in the `<head>` of `site/index.html`.
   2. Sitemaps: submit `https://akhitsolutions.com/sitemap.xml`.
   3. URL Inspection: request indexing for Home, Services, AI Hub, About, Contact, News & events and the three case studies.
4. Add GA4 (the developers' task: the `akhTrack()` calls are ready for it).
5. Bing Webmaster Tools: import the site from Search Console (one click), so Bing gets the sitemap too.

## After launch: monitoring

Check these in Search Console at weeks 1, 2, 4 and 8, and note anything unusual here.

| Check | Where | What good looks like |
|---|---|---|
| Pages indexed | Indexing > Pages | All 25 sitemap URLs indexed within 2–4 weeks; no "Redirect error" or "Not found (404)" for URLs in the map above |
| 404s | Indexing > Pages > Not found | Only junk URLs; any real old URL here gets a redirect added to `.htaccess` |
| Canonicals | Indexing > Pages > "Duplicate, Google chose different canonical" | Empty, or only `.html` variants |
| Core Web Vitals | Experience > Core Web Vitals | Mobile URLs "Good" |
| Traffic | Performance, compare to the previous period | Clicks and impressions back to the old level within 4–8 weeks; a short dip in weeks 1–2 is normal |
| Key queries | Performance > Queries | The old top queries (exported before launch) still show the same landing pages |

If traffic to a page drops and does not recover by week 4, check that its URL is in the map above, returns 200 or a single 301, and has its canonical pointing at itself.

## Still to confirm ⚑

- ⚑ Terms and conditions: migrated word for word from the old site (a template mentioning "prevailing law of Sri Lanka"). It needs a legal review alongside the Privacy policy.
- ⚑ Hosting: this plan assumes Apache, as today. Tell the developers if that changes.
- ⚑ The GitHub Pages copy (avinashgit26.github.io/akhit-website) already has canonicals pointing at akhitsolutions.com. Once the domain move is done, turn off or redirect the GitHub Pages copy so there's only one public version.
