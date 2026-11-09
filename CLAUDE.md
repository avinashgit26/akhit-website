# AKH IT Solutions website

## Goal

Redesign the AKH IT Solutions website (UK-based software studio: web apps, websites, mobile apps, AI, SEO, graphic design, staffing) so visitors quickly understand:

1. what result they'll get;
2. why AKH over the next agency;
3. how pricing works.

The main conversion is the hero "scoper" chat ("Find out what we could save you"). RetailWeave (the in-house retail platform) is promoted as "launching soon".

- **Live site:** https://avinashgit26.github.io/akhit-website/
- **Repo:** `avinashgit26/akhit-website`, git remote `akhit`. GitHub Pages deploys `site/` through `.github/workflows/pages.yml` (a deploy takes about 4–7 minutes).
- **Local branch:** `redesign/grey-green-outcome-copy`.
- **Final hosting:** developers will move the site to akhitsolutions.com later.

## Publishing rules (must follow)

- **Never push to `origin` (`avinashgit26/revamped-akhit`).** That is the old version and stays untouched.
- **Make changes locally and leave them uncommitted** until the user says "approved" or "publish". Show screenshots or checks first.
- **To publish:**
  1. Commit locally.
  2. Push one new commit to `akhit main`, built with `git commit-tree HEAD^{tree} -p akhit/main -m "…"`.
  3. Wait for the Pages run (`gh run list -R avinashgit26/akhit-website`).
  4. Check the live URL.
- **About and Work stay local only.** `site/about-us.html` (About) and `site/portfolio.html` (Work) are gitignored. Don't link them or publish them unless the user asks.
- **Leave alone:** the user's untracked `site/website/images/home/services/services-hero-abstract.svg`.

## Design direction

- **Palette (charcoal and green), defined as tokens in `site/website/css/site-system.css`:**

  | Role | Value |
  |---|---|
  | Charcoal | `#26292C` (deep `#1E2124`) |
  | Ink | `#1A1D1F` |
  | Muted text | `#5F6469` |
  | Light surfaces | `#F4F5F6` / `#E6E8EA` |
  | Lines | `#D9DCDF` |
  | Primary on dark | green `#3DBE5A`, dark text `#0E1A10` |
  | Primary on light | deep green `#237A38`, white text |
  | Highlight on dark | lime `#B8F27A` |
  | Tint | `#EAF6EC` |

  No navy, cobalt blue or old lime anywhere. The only exception is the RetailWeave logo, which keeps its original colours.
- **Fonts:** DM Sans for headings and body. Headings are bold (750+) with tight letter spacing (about −0.04em).
- **Layout:**
  - One container on every page: max 1280px, gutter `clamp(20px, 5vw, 72px)`. Header, sections and footer share one left edge.
  - Hero spacing: eyebrow, headline, text and buttons are 20 / 28 / 36px apart. Headline line-height is 1.08.
- **Buttons:** primary (green on dark, deep green on light), secondary (outline) and text link. 8px radius, 48px tall.
- **Rules:**
  - Dark surfaces always get white or light-grey text (one global rule).
  - No long dashes (—) anywhere; use commas, full stops, colons or brackets. Short dashes in number ranges ("8–12 weeks") are fine.
  - UK spelling.
  - Keep every existing animation and feature: counters, reveals, logo ticker, carousel, crowd and wave canvases, tabs, expanders, voice input.
- **Copy rules:**
  - Every line states a result, a reason to choose AKH, or how pricing works ("free 30-minute call, fixed quote within 48 hours").
  - Prices are hidden for now.
  - Not UK-only and not retail-only: AKH serves brands in every industry, globally.
  - The current copy is tracked in `docs/copy-changes.md`.

## Key files

```
site/
  index.html                 Home: hero + scoper chat, stats, Trusted by, services, results, how we work,
                             client stories + awards ribbon, checklist lead magnet, FAQ
  services.html              Services (offer tabs A–Z, delivery tabs, process tabs, FAQ, quote form)
  service/artificial-intelligence.html   AI Hub (AI Sprint, RetailWeave section, fit session)
  service/*.html             Service landing pages + AI fit session (old site URLs kept)
  portfolio/*.html           Case studies: market-place, garment-manufacture-portal, goddiva-ai
  careers.html, learn-with-us.html, contact-us.html, privacy-policy.html
  about-us.html, portfolio.html   LOCAL ONLY (gitignored)
  website/css/site-system.css    Shared tokens and components, loaded LAST on every page;
                                 overrides older layered CSS with !important / :not(#akh-x)
  website/js/homepage-intake.js  Scoper chat (boss's click-through script, savings maths,
                                 drawer on non-home pages, submitLead() stub for a CRM)
  website/js/homepage-assistant.js  Floating "Ask AKH" assistant (whole-word keyword matching)
  website/js/ai-hub.js           AI Hub assistant + WebGL nebula
  website/js/site-system.js      Cookie banner, akhTrack() analytics hook, waitlist buttons,
                                 checklist reveal, contact form
  website/images/home/retailweave-logo.png  RetailWeave logo (original colours)
docs/copy-changes.md             Every copy change, with items to confirm (⚑)
```

- **Shared shell:** the header, footer and RetailWeave band are duplicated in every page. Change them the same way across all HTML files.
- **Cache-busting:** bump the `?v=` tag on changed CSS/JS links.

## Decisions and why

- **Boss's audit:** we used Hero Option A, "Software that pays for itself", and the scoper chat as the main CTA "Find out what we could save you". It sells outcomes, not a menu of services.
- **Floating assistant on every page:** the user wanted it kept. Its matching is whole-word, so "hair" no longer reads as "ai".
- **Testimonials:** quotes are unchanged. Goddiva's awards are shown as verified facts: winner and highly commended at the Boutique Star Awards 2025; shortlisted ×5 at the Drapers Awards 2025, not won. Sources are City Goddess's blog.
- **Forms:** all front-end only. No backend yet; developers will wire up `submitLead()`.
- **Stats:** the numbers (98%, 500+, £1.8m and the Services figures) are kept as they are until the user verifies them.
- **Learn page:** price, date and partner placeholders stay until confirmed.
- **Images:** recoloured from blue to green, with `-green` files next to the originals. The Goddiva screenshot is cropped to hide a customer email.
- **Menu:** Services · AI · Learn with us · Careers + "Find out what we could save you". About and Work were removed from the menu at the user's request.

## User preferences

- Wants a plan first, then changes made locally, then screenshots and checks, then publishing only after approval.
- Copy should be punchy and outcome-led: no exaggeration, no long dashes, global rather than UK-only.
- Consistent UI components across all pages, with generous breathing space.
- Never remove animations or features without asking.

## Done

- Grey-green palette applied across the whole site, including WebGL heroes and recoloured images.
- Outcome-led copy rewritten on all pages.
- Hero scoper chat, with the always-visible input, voice and send.
- New pages: Contact, the three case studies, Privacy, AI fit session and five service pages. No links point to the old site.
- RetailWeave band: "Launching soon", "RetailWeave is coming.", "Get early access".
- Client stories with an awards ribbon.
- Footer: "Bring us the problem. We'll build what solves it."
- Count-up stats fixed.
- Contrast, link and mobile checks all pass.
- Published to akhit-website.
- Round 5 (2026-11-08):
  - Thin 38px RetailWeave strip.
  - Header: Home · AI Hub · Services · Learn with us · Careers, at 16px.
  - Home hero: narrower chat, CTA as wide as the paragraph, 2×2 quick-start buttons.
  - Trusted by moved after How we work.
  - White sections after the hero and stats, with hairline dividers.
  - Awards show only for the City Goddess quote.
  - Matching 16:9 Results renders (`results-*.jpg`; the 2 MB originals are gitignored).
  - "AI" inside the orb, with the hover line "Got a question? Ask our AI."
  - Learn prices and provider logos (`website/images/learn/partners/`).
  - Careers rewritten, with in-page role panels (`#software-engineer`, `#customer-service-assistant`) and a front-end apply form.
- Rounds 6–9 (2026-11-09):
  - "Coming soon" pills on RetailWeave (Home Results card, AI Hub section).
  - Home hero copy centred against the chat; chat is 560px wide on wide screens.
  - Quick-start buttons go on one line via a container query.
  - Dark "AI" on the orb.
  - Header links hidden below 1180px.
  - Sections alternate white and warm stone (`--akh-stone: #FAF8F5`, class `akh-band-alt` on every second section).
  - New footer pitch.
  - Learn:
    - colour provider logos, three per row, opening course panels (`#courses-<provider>`, two coached courses each);
    - a 5-card coverflow hero carousel.
  - Careers perk cards.
  - A prominent "× Close" on the slide-in panels (shared `akhSetupPanel()` in `site-system.js`).

## Left to do / confirm

- Confirm promises with the boss: 48-hour quote, Friday demos, 30 days of free fixes, "you own the code", £15/hour savings rate, FAQ answers.
- Fill in the case-study `[metric]` placeholders, team names and photos (About), calendar booking URL and WhatsApp number.
- Confirm "Goddiva's AI shopping assistant and e-commerce systems were built by AKH", and the scoper line "order allocation went from days to minutes".
- Get the privacy policy legally reviewed. It's a 2022 template mentioning "www.website.com" and DoubleClick ads.
- Verify the stats numbers, then confirm the Learn page prices, dates and partners.
- A Staffing image in the 3D style (the current photo doesn't match) and higher-resolution product screenshots.
- Developers: connect the forms and `submitLead()` to a CRM, add a GA4 ID, and move the site to akhitsolutions.com.
- Re-enable the About and Work pages when the user asks.
