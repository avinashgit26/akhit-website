# Revamped AKHIT

The redesigned AKH IT Solutions website, built as a static site in `site/`. It uses a charcoal-and-green palette, shared UI styles (`site/website/css/site-system.css`) and outcome-led copy (see `docs/copy-changes.md`).

## Pages

- Home, Services, AI Hub, Learn with us and Careers.
- Work (`portfolio.html`) plus three case studies in `portfolio/`.
- About, Contact, Privacy policy and the free AI fit session.
- Five service pages in `service/`. They keep the old site's URLs, so existing links keep working after the move to akhitsolutions.com.

No page links to the old redesign site.

## Forms and leads

Every form is front-end only for now:

- the hero scoper chat;
- the contact and AI fit-session forms;
- the Services quote form;
- the checklist download;
- the newsletter and the RetailWeave waitlist.

To connect a CRM, edit `submitLead()` in `site/website/js/homepage-intake.js` (the scoper chat). Every lead form also fires an `akh:lead` event on `document`. Analytics events go through `window.akhTrack()` in `site/website/js/site-system.js` and only run after the visitor accepts cookies.

## Preview

Run `python -m http.server 8080 --directory site`, then open http://localhost:8080.

GitHub Pages: https://avinashgit26.github.io/revamped-akhit/

## Publish

The `Deploy GitHub Pages` workflow publishes the `site/` directory whenever changes reach `main`.
