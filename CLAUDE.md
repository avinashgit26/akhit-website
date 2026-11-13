# AKH IT Solutions website

## Goal

Redesign the AKH IT Solutions website so a visitor quickly understands:

1. what result they'll get;
2. why AKH over the next agency;
3. how pricing works.

AKH IT Solutions is a UK-based software studio: web apps, websites, mobile apps, AI, SEO, graphic design and staffing.

- **Main conversion:** the hero "scoper" chat, "Find out what we could save you".
- **Secondary conversions:** a fixed-quote request on Contact, the Learn sign-ups and Careers applications.
- **RetailWeave** (the in-house retail platform) is promoted as "launching soon".
- **Live site:** https://avinashgit26.github.io/akhit-website/
- **Repo:** `avinashgit26/akhit-website`, git remote `akhit`. GitHub Pages deploys `site/` through `.github/workflows/pages.yml`. A deploy takes under a minute.
- **Local branch:** `redesign/grey-green-outcome-copy`.
- **Final hosting:** developers will move the site to akhitsolutions.com later.
- **Developer handover guide:** a Claude Doc at https://claude.ai/artifact/PamVNBxPowYNTEu3Ursdki. It covers the design system, components, animations, features, page intentions, site map, redirects and the launch checklist. Update it when something major changes.

## Publishing rules (must follow)

- **Never push to `origin` (`avinashgit26/revamped-akhit`).** That is the old version and stays untouched.
- **Make changes locally and leave them uncommitted** until the user says "approved" or "publish". Show screenshots and checks first.
- **To publish:**
  1. Commit locally.
  2. Push one new commit to `akhit main`, built with `git commit-tree HEAD^{tree} -p akhit/main -m "…"`.
  3. Wait for the Pages run (`gh run list -R avinashgit26/akhit-website`).
  4. Check the live URL.
- **Work stays local only.** `site/portfolio.html` (Work) is gitignored. Don't link or publish it unless the user asks; it still uses the old product screenshots. About has been live since Round 22.
- **Leave alone:** the user's untracked `site/website/images/home/services/services-hero-abstract.svg`. Never commit it.

## Design direction

### Colours

Tokens are defined at the top of `site/website/css/site-system.css`:

| Role | Token / value |
|---|---|
| Charcoal (dark sections, footer) | `--akh-charcoal` `#26292C`, deep `#1E2124` |
| Ink (text on light) | `--akh-ink` `#1A1D1F` |
| Muted text | `--akh-muted` `#5F6469` |
| Light surfaces | `--akh-paper` `#F4F5F6`, `--akh-band` `#E6E8EA` |
| Warm stone (alternate sections) | `--akh-stone` `#FAF8F5` |
| Lines | `--akh-line` `#D9DCDF` |
| Primary on dark | green `#3DBE5A` (hover `#52CC6D`), text `#0E1A10` |
| Primary on light | deep green `#237A38` (hover `#1B6330`), white text |
| Highlight on dark | lime `#B8F27A` |
| Tint (soft green fills, success) | `#EAF6EC` |
| Errors | `#B3261E` on light, `#FFB4A9` on dark |

- No navy, cobalt blue or old lime anywhere. The only exception is the RetailWeave logo, which keeps its own colours.
- Dark surfaces always get white or light-grey text (one global rule).
- Images are warm cream and green renders, 16:9. Older blue images were recoloured (`-green` files sit next to the originals).

### Type

- DM Sans for headings and body.
- Headings are bold (750+) with tight letter spacing (about −0.04em) and `text-wrap: balance`.
- Section titles use `.akh-h2` at `clamp(30px, 3.6vw, 46px)`.
- Eyebrows are small uppercase labels with wide letter spacing.

### Layout

- One container on every page: max 1280px, gutter `clamp(20px, 5vw, 72px)`. The header, sections and footer share one left edge.
- Hero spacing: eyebrow, headline, text and buttons sit 20 / 28 / 36px apart; headline line-height 1.08.
- The Home hero headline sets in two wide lines, with the chat 540px wide beside it.
- Sections alternate white and warm stone (`akh-band-alt` on every second section).
- Case study and About pages use a tighter rhythm (`main.akh-case-page`: 64px on desktop, 40px on phones).
- Generous breathing space, but no huge empty gaps.
- Breakpoints:
  - 1180px: header links collapse into the menu.
  - 1100px, 860px, 760px and 640px: layout steps.
  - 400px: compact header, so small phones never scroll sideways.

### Components (use them everywhere, no one-offs)

- **Buttons:** primary (green on dark, deep green on light), secondary (outline) and text link. 48px tall, 8px radius.
- **One × close control** for every overlay: a round button that turns green and rotates on hover; a "× Close" label on slide-in panels. Every overlay closes with Esc and on a backdrop click.
- **Pop-up shell:** `.modal.launch-dialog`, with eyebrow, title, intro, form, then a confirmation state.
- **Slide-in panels:** set up with `akhSetupPanel()`.
- **Forms:**
  - 48px fields with the label above;
  - validation on submit, with a plain message under the field;
  - a tinted success box.
  - Never use the browser's default bubbles.
- **Coverflow carousel** (`[data-cf]`, shared code): used in the Learn hero and the About team section.

### Rules

- No long dashes (—) anywhere. Use commas, full stops, colons or brackets. Short dashes in ranges ("8–12 weeks") are fine.
- UK spelling.
- Keep every existing animation and feature:
  - count-up stats, scroll reveals, logo ticker, client-story carousel;
  - the Learn and About coverflows;
  - the hero river waves, WebGL nebula, wave and crowd canvases;
  - tabs, accordions, voice input and the AI orb.

### Copy rules

- Every line states a result, a reason to choose AKH, or how pricing works ("free 30-minute call, fixed quote within 48 hours").
- No exaggeration.
- Prices are hidden.
- Not UK-only and not retail-only: AKH serves businesses in every industry, globally.
- Never put words in a real person's mouth. Quotes and team messages stay as placeholders until supplied.
- All copy is tracked in `docs/copy-changes.md`; items to confirm are marked ⚑.

## Key files

```
site/
  index.html                 Home: hero (headline "Apps and AI that pay for themselves.") + scoper chat,
                             stats band, services, Systems we've built, How we work, Trusted by,
                             client stories + awards ribbon, "Recently on stage" teaser (hidden until real
                             events), checklist lead magnet, FAQ
  services.html              Services: offer tabs A–Z, delivery and process tabs, stats band, FAQ, two-step quote form
  service/artificial-intelligence.html   AI Hub: AI Sprint, RetailWeave, fit session, WebGL nebula
  service/ai-fit-session.html  Free AI fit session (two-step form)
  service/*.html             Five service landing pages (old-site URLs kept for SEO)
  portfolio/*.html           Case studies: market-place, garment-manufacture-portal, goddiva-ai
  learn-with-us.html         Learn: coverflow hero, provider panels, learning pop-ups, interest form
  careers.html               Careers: roles in slide-in panels with apply form
  contact-us.html            Two-step fixed-quote form (preselects need from ?subject=)
  about-us.html              About: story, promises, numbers, team coverflow + messages, offices
  news-events.html           News & events: CEO talks and awards, rendered from events.json
  news/*.html                Full news articles (stories), e.g. boutique-star-awards-2026.html
  privacy-policy.html
  portfolio.html             LOCAL ONLY (gitignored)
  website/css/site-system.css    Tokens and shared components, loaded LAST on every page;
                                 overrides older layered CSS with !important / :not(#akh-x)
  website/js/site-system.js      Cookie banner, akhTrack(), waitlist, FAQ one-at-a-time, Learn pop-ups,
                                 Careers validation, coverflow, team messages, keyboard fix, events renderer,
                                 newsletter, reveals
  website/js/homepage-intake.js  Scoper chat (click-through script, savings maths, drawer, submitLead() stub)
  website/js/homepage-assistant.js  Floating "AKH AI assistant" (whole-word keyword answers, page contexts)
  website/js/shared-shell.js     Header behaviour, RetailWeave waitlist dialog
  website/js/ai-hub.js           AI Hub assistant + WebGL nebula
  website/data/events.json       All News & events entries (single source)
  website/images/portfolio/case-*.jpg   Case study covers and challenge, solution and impact images
  website/images/events/         Event photos + news-hero-stage.jpg
  website/images/team/           Team photos (to add)
docs/copy-changes.md             Every copy change, with items to confirm (⚑)
```

- **Shared shell:** the header, footer, AI assistant, waitlist dialog and cookie banner are duplicated in every page. Change them the same way across all HTML files (scripts are best, as the earlier rounds did).
- **Cache-busting:** bump the `?v=` tag on changed CSS/JS links, and add `?v=` to an image URL in CSS when a file is replaced under the same name.
- **Adding an event:** add one entry to `website/data/events.json`:
  - `type`: talk | award-received | award-presented;
  - `date`: YYYY-MM-DD;
  - an image in `website/images/events/`;
  - `placeholder: false`.

  It appears on News & events, and the latest 3 real events show on About and Home.

  For a night with several awards, write an article in `site/news/` (copy `boutique-star-awards-2026.html`), add it to `stories` in events.json, and give that night's events `story: "<id>"`. The newest story is featured on News & events and in the Home and About teasers; its events appear only in the News grid.
- **Adding a team member:** edit one card in the About team section: photo, name, role, and their message in `data-quote`. Remove `data-quote-placeholder`.

## Decisions and why

- **Boss's audit:** the site sells outcomes, not a menu of services. The hero is "Apps and AI that pay for themselves." and the main CTA is the scoper.
- **The scoper and the AI assistant have different jobs:**
  - The scoper is labelled "Savings estimator · tap, type or talk". It captures the lead.
  - The "AKH AI assistant" gives instant answers on services, pricing and process, and hands savings questions to the scoper.
  - The user wanted both kept, and typing and voice stay available in both.
- **Header CTA swap:** while the scoper is on screen, the header button becomes "Get a fixed quote", so the same button never shows twice.
- **Voice input** shows a live transcript as the person speaks (interim results), everywhere it's used.
- **FAQs open one at a time.**
- **Learn is a separate revenue stream.** Its CTAs open learning pop-ups (start, cohort, team training, educator workshops, partner), never the build-services quote form.
- **Careers apply:** mobile number with country code, "Why join" and CV required. The confirmation lists the next steps, with no timings promised.
- **Case studies follow one story that echoes How we work:**
  1. Where they started.
  2. How we worked it out (the four steps).
  3. What we built.
  4. Beyond the brief (only facts already on the site).
  5. An offer band with "Get a fixed quote", which opens Contact with the need preselected.

  Goddiva shows its awards right under the cover. "Ops Platform" was dropped because no such offer exists. Results use stated facts, not "[X%]".
- **Goddiva awards** are verified facts: winner and highly commended at the Boutique Star Awards 2025; shortlisted ×5 at the Drapers Awards 2025 (not won). Sources are City Goddess's blog.
- **Boutique Star Awards 2026** (10 Nov 2026, London, from the user): Kuganeswaran presented Independent Department Store of the Year (Dixons Department Store) and Outstanding Business (Carol C Collections); Goddiva won Tech Innovation of the Year and was highly commended for British Brand of the Year. The user approved describing Goddiva as "the fashion brand he founded". Don't claim AKH built the winning tech until confirmed.
- **Stats:**
  - Home: 99% on-time delivery · 4 markets reached (UK, EU incl. Ireland, US, India) · **3x–5x estimated ROI** · 4.9/5 client rating · 30+ projects completed.
  - Services: 30+ projects delivered · 99% client satisfaction · 48h fixed quote turnaround · 100% upfront fixed pricing · 100% IP and code ownership.
  - Numbers in each band sit on one line, with content top-aligned.
  - The 3x–5x ROI is the user's decision. Research found no published Goddiva figure (no public accounts, no measured results), so it's labelled "estimated" and flagged ⚑.
  - The old "£1.8m revenue raised" stat was dropped.
- **About** is a story, not a menu card. It uses only approved facts:
  - "over a decade of experience";
  - the founder's name and title (Kuganeswaran Thangarajah, Founder and Managing Director);
  - the offices in Romford (head office), Dehiwala and Tiruttani.

  Not stated (not approved): the founder's manufacturing background, the Director joining in 2020, "runs its own retail brands".
- **News & events** replaces the old Blog (the director's SEO point). One JSON file feeds the page. The About and Home teasers stay hidden until a real event exists. "Invite us to speak" opens Contact with "Speaking or event invitation" preselected.
- **Footer (every page):**
  - CTA row with "Fixed quote in 48h · Zero pressure · 1 working day reply";
  - columns: Solutions (incl. About us, News & events), Direct contact, and a newsletter card;
  - bottom bar: "© 2026 AKH IT Solutions Ltd. Registered in England & Wales."

  "Terms of Business" and the "IP Handover Guarantee" were left out (no page, unconfirmed). The discovery-call link goes to Contact until the calendar URL exists.
- **Menu:** Home · AI Hub · Services · Learn with us · Careers · About, plus "Find out what we could save you". News & events is in the footer only, to keep six header links. Work stays off the menu.
- **Forms are all front-end only.** Each fires an `akh:lead` event and `akhTrack()`. Developers will wire up `submitLead()` and a CRM.
- **The UK-focused positioning** was retained per the director, while the copy stays open to every industry and market.

## User preferences

- A plan first, then changes made locally, then screenshots and checks, then publishing only after "approved" / "publish".
- Copy: punchy and outcome-led, no exaggeration, no long dashes, global rather than UK-only, UK spelling.
- Consistent UI components across all pages (the same buttons, × close, pop-ups, cards). Generous breathing space without big empty gaps.
- Never remove animations or features without asking.
- Only approved facts about people, clients and numbers; placeholders otherwise.
- Check desktop, tablet and phone (down to 320px) before showing; no sideways scroll.

## Done

- **Rounds 1–9 (to 2026-11-09):**
  - grey-green palette site-wide (incl. WebGL heroes and recoloured images);
  - outcome-led copy;
  - hero scoper chat;
  - Contact, Privacy, AI fit session, five service pages and three case studies;
  - RetailWeave "launching soon";
  - client stories with an awards ribbon;
  - Learn coverflow and provider panels;
  - Careers role panels;
  - the shared "× Close" panel pattern;
  - white and stone section bands.
- **Rounds 10–19 (2026-11-09 to 11-10):**
  - new Home headline;
  - header "Get a fixed quote" swap;
  - two-step Contact and AI fit forms;
  - Tradegala and StudyNest removed;
  - neutral RetailWeave wording.
- **Round 20 (2026-11-11), director's testing fixes and the user's 13 changes:**
  - waitlist and newsletter confirmations;
  - FAQ one-at-a-time;
  - live voice transcript;
  - Learn pop-ups and registration validation;
  - Careers form rules and next steps;
  - scoper and assistant relabelled;
  - new footer;
  - Home hero gap closed;
  - mobile menu no longer clipped;
  - no sideways scroll under 400px;
  - chat panels stay above the phone keyboard;
  - assistant launcher shows earlier, with "Ask our AI assistant" buttons in the FAQs;
  - new Home and Services stats, then numbers aligned on one line.
- **Developer handover guide** written as a Claude Doc.
- **Round 21: case studies redesigned:**
  - new images;
  - How-we-work story;
  - awards first on Goddiva;
  - "Get a fixed quote" offer bands;
  - tighter spacing;
  - Home cards use the new covers.
- **Round 22: About live:**
  - story, promises, numbers, case study cards;
  - team coverflow with an "In their words" message panel;
  - offices and careers;
  - About in the header, mobile menu and footer.
- **Round 23: News & events page** (events.json, filters, featured event, "Invite us to speak"), About and Home teasers, Speaking option on Contact.
- **Round 24: News & events hero photo** (stage, podium, trophy and audience), framed separately for phones.
- **Round 25: Boutique Star Awards 2026 story**, the first real news: article page, featured on News & events, four award cards, Home and About teasers live, 2026 awards on the Home ribbon and Goddiva case study.

## Left to do / confirm

- Confirm promises and claims with management (the director's list):
  - 48-hour quote and who owns it;
  - project timelines;
  - staffing from 1 week;
  - 30 days of free fixes;
  - "zero drift" pricing and 100% IP ownership;
  - 99% figures and the 3x–5x ROI;
  - the £15/hour savings rate;
  - replies "within one working day";
  - the per-client "How we worked it out" lines.
- **Content to add:**
  - more real events and photos in `events.json`;
  - spellings of Dixons Department Store and Carol C Collections, the venue, and a source link for the 2026 awards;
  - team names, photos and messages on About;
  - client result figures for the case studies;
  - the calendar booking URL and WhatsApp number;
  - Learn prices, dates and partners.
- Confirm "Goddiva's AI shopping assistant and e-commerce systems were built by AKH" and "order allocation went from days to minutes".
- Get the privacy policy legally reviewed. It's a 2022 template mentioning "www.website.com" and DoubleClick.
- Decide where the old About and Blog content and URLs go; set up 301 redirects before the domain move.
- **Developers:**
  - connect `submitLead()` and every `akh:lead` event to a CRM, with notification emails;
  - server-side CV upload;
  - add a GA4 ID;
  - move to akhitsolutions.com with HTTPS.
- Full QA with Ajay and Misha on real phones (keyboard behaviour and voice input), then sign-off.
- A Staffing image in the 3D style; re-enable the Work page when the user asks.
