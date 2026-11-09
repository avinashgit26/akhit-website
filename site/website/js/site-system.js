/* Small shared behaviours for every page: cookie choice, analytics hook, waitlist buttons,
   checklist download, contact form preselect. Forms stay front-end only. */
(() => {
  const ROOT = (() => {
    const s = document.currentScript || document.querySelector('script[src*="site-system.js"]');
    return (s?.getAttribute('src') || '').startsWith('../') ? '../' : '';
  })();
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  };

  /* One cookie choice for the whole site (older pages stored it as 'privacy-policy' = T/F). */
  const legacy = store.get('privacy-policy');
  const choice = () => store.get('akhCookieChoice') || (legacy === 'T' ? 'accepted' : legacy === 'F' ? 'declined' : null);
  const saveChoice = value => { store.set('akhCookieChoice', value); store.set('privacy-policy', value === 'accepted' ? 'T' : 'F'); };

  /* Analytics hook. Developers add GA4 later; events only queue after consent. */
  window.dataLayer = window.dataLayer || [];
  window.akhTrack = (name, data = {}) => {
    if (choice() !== 'accepted') return;
    window.dataLayer.push({ event: name, ...data });
  };

  /* Cookie banner: one bottom banner. Pages that already have a privacy panel keep its wiring, restyled to match. */
  const panel = document.getElementById('privacy-policy-panel');
  if (panel) {
    panel.classList.add('akh-cookie');
    document.getElementById('policy-accept-btn')?.addEventListener('click', () => saveChoice('accepted'));
    document.getElementById('policy-reject-btn')?.addEventListener('click', () => saveChoice('declined'));
    if (choice()) panel.hidden = true;
  } else if (!choice()) {
    const banner = document.createElement('aside');
    banner.className = 'akh-cookie';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie choice');
    banner.innerHTML = `<p>We use essential cookies to run this site, and optional analytics only if you agree. <a href="${ROOT}privacy-policy.html">Privacy policy</a></p>
      <div class="akh-cookie-actions"><button class="akh-cookie-decline" type="button">Decline</button><button class="akh-cookie-accept" type="button">Accept</button></div>`;
    const choose = value => { saveChoice(value); banner.remove(); document.dispatchEvent(new CustomEvent('akh:consent', { detail: value })); };
    banner.querySelector('.akh-cookie-accept').addEventListener('click', () => choose('accepted'));
    banner.querySelector('.akh-cookie-decline').addEventListener('click', () => choose('declined'));
    document.body.append(banner);
  }

  /* Any [data-open-waitlist] button opens the RetailWeave dialog. */
  const dialog = document.getElementById('waitlist-dialog');
  document.addEventListener('click', event => {
    const btn = event.target instanceof Element ? event.target.closest('[data-open-waitlist]') : null;
    if (!btn || !dialog) return;
    event.preventDefault();
    if (!dialog.open) dialog.showModal();
  });
  if (dialog && location.hash === '#retailweave') setTimeout(() => { if (!dialog.open) dialog.showModal(); }, 400);

  /* Checklist lead magnet: email first, then the download appears (front-end only). */
  const checklist = document.getElementById('checklist-form');
  checklist?.addEventListener('submit', event => {
    event.preventDefault();
    const email = checklist.querySelector('input[type="email"]');
    const out = document.getElementById('checklist-status');
    if (!email.value.trim() || !email.checkValidity()) { email.reportValidity(); return; }
    window.akhTrack('checklist_request');
    document.dispatchEvent(new CustomEvent('akh:lead', { detail: { type: 'checklist', email: email.value.trim() } }));
    out.innerHTML = `Thanks, it’s yours. <a href="${ROOT}website/downloads/digital-project-scoping-checklist.pdf" download>Download the checklist (PDF) ↓</a>`;
    out.querySelector('a')?.focus();
  });

  /* Contact form: preselect what the visitor needs from ?subject= and confirm on submit. */
  const contact = document.getElementById('contact-form');
  if (contact) {
    const subject = new URLSearchParams(location.search).get('subject');
    const need = contact.querySelector('select[name="need"]');
    if (subject && need) {
      const match = [...need.options].find(o => o.value.toLowerCase() === subject.toLowerCase() || o.textContent.toLowerCase().includes(subject.toLowerCase()));
      if (match) need.value = match.value;
    }
    contact.addEventListener('submit', event => {
      event.preventDefault();
      if (!contact.reportValidity()) return;
      const name = contact.querySelector('[name="name"]').value.trim();
      document.dispatchEvent(new CustomEvent('akh:lead', { detail: { type: 'contact', name } }));
      window.akhTrack('contact_submit');
      const status = document.getElementById('contact-status');
      if (status) status.textContent = `Thanks, ${name}. We’ll reply within one working day with next steps.`;
    });
  }
})();

/* Round 5: client awards follow the testimonial on screen. */
(function () {
  const track = document.querySelector('.testimonials .quote-track');
  const groups = [...document.querySelectorAll('[data-awards-for]')];
  if (!track || !groups.length) return;
  const sync = () => {
    const current = track.querySelector('.quote-card.is-current');
    const client = current ? current.dataset.client : '';
    groups.forEach((group) => {
      const show = group.dataset.awardsFor === client;
      group.classList.toggle('is-awards-hidden', !show);
      group.setAttribute('aria-hidden', String(!show));
    });
  };
  new MutationObserver(sync).observe(track, { subtree: true, attributes: true, attributeFilter: ['class'] });
  sync();
})();

/* Round 5b/8: slide-in panels (Careers roles, Learn course providers). */
const akhSetupPanel = (drawer, cfg) => {
  const panel = drawer.querySelector('.akh-role-panel');
  const items = [...drawer.querySelectorAll('.akh-role')];
  let lastFocus = null;
  const key = (el) => el.dataset[cfg.dataKey];

  const open = (slug, fromHash) => {
    const item = items.find((r) => key(r) === slug);
    if (!item) return;
    lastFocus = document.activeElement;
    items.forEach((r) => { r.hidden = r !== item; });
    drawer.hidden = false;
    document.documentElement.classList.add('akh-role-open');
    panel.setAttribute('aria-labelledby', `${slug}-title`);
    panel.scrollTop = 0;
    if (!fromHash && location.hash !== `#${slug}`) history.pushState(null, '', `#${slug}`);
    requestAnimationFrame(() => { const h = item.querySelector('h2'); h.setAttribute('tabindex', '-1'); h.focus(); });
    if (window.akhTrack) window.akhTrack(cfg.event, { item: slug });
  };
  const close = (fromHash, keepFocus) => {
    if (drawer.hidden) return;
    drawer.hidden = true;
    document.documentElement.classList.remove('akh-role-open');
    if (!fromHash && items.some((r) => location.hash === `#${key(r)}`)) history.pushState(null, '', location.pathname + location.search);
    if (lastFocus && !keepFocus) lastFocus.focus();
  };
  const fromHash = () => {
    const slug = location.hash.slice(1);
    if (items.some((r) => key(r) === slug)) open(slug, true); else close(true);
  };

  document.addEventListener('click', (event) => {
    const opener = event.target.closest(`[${cfg.openAttr}]`);
    if (opener) { event.preventDefault(); open(opener.getAttribute(cfg.openAttr)); return; }
    if (drawer.hidden) return;
    if (event.target.closest('[data-role-close]') && drawer.contains(event.target)) { event.preventDefault(); close(); return; }
    const leave = event.target.closest('[data-panel-leave]');
    if (leave && drawer.contains(leave)) {
      event.preventDefault();
      close(false, true);
      const target = document.querySelector(leave.getAttribute('href'));
      const select = leave.dataset.selectId && document.getElementById(leave.dataset.selectId);
      if (select && leave.dataset.selectValue) select.value = leave.dataset.selectValue;
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const first = target && target.querySelector('input, select, textarea, button');
      if (first) first.focus({ preventScroll: true });
      return;
    }
    const jump = event.target.closest('.akh-role-jump');
    if (jump && drawer.contains(jump)) {
      event.preventDefault();
      const form = document.querySelector(jump.getAttribute('href'));
      if (form) { form.scrollIntoView({ behavior: 'smooth', block: 'start' }); const first = form.querySelector('input'); if (first) first.focus({ preventScroll: true }); }
    }
  });
  document.addEventListener('keydown', (event) => {
    if (drawer.hidden) return;
    if (event.key === 'Escape') { close(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll('a[href], button, input, textarea, summary, [tabindex="-1"]')].filter((el) => el.offsetParent !== null && !el.closest('[hidden]'));
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('popstate', fromHash);
  fromHash();
};

(function () {
  const courses = document.getElementById('course-drawer');
  if (courses) akhSetupPanel(courses, { dataKey: 'course', openAttr: 'data-course-open', event: 'learn_provider_open' });
})();

(function () {
  const drawer = document.getElementById('role-drawer');
  if (!drawer) return;
  akhSetupPanel(drawer, { dataKey: 'role', openAttr: 'data-role-open', event: 'careers_role_open' });

  const MAX = 5 * 1024 * 1024;
  const okType = (name) => /\.(pdf|docx?|DOCX?|PDF)$/.test(name);
  drawer.querySelectorAll('.akh-role-form').forEach((form) => {
    const error = form.querySelector('.akh-role-error');
    const file = form.querySelector('input[type="file"]');
    const fileName = form.querySelector('.akh-role-file-name');
    const checkFile = () => {
      const f = file.files[0];
      file.setCustomValidity('');
      if (!f) { fileName.textContent = 'No file chosen'; return true; }
      fileName.textContent = f.name;
      if (!okType(f.name)) file.setCustomValidity('Please upload a PDF, DOC or DOCX file.');
      else if (f.size > MAX) file.setCustomValidity('Please upload a file under 5 MB.');
      return file.checkValidity();
    };
    file.addEventListener('change', () => { checkFile(); error.textContent = file.validationMessage; });
    form.querySelectorAll('input:not([type="file"]), textarea').forEach((input) => {
      input.addEventListener('blur', () => input.classList.toggle('is-invalid', !input.checkValidity()));
      input.addEventListener('input', () => { if (input.checkValidity()) input.classList.remove('is-invalid'); });
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      checkFile();
      const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
      invalid.forEach((el) => el.classList.add('is-invalid'));
      if (invalid.length) {
        const el = invalid[0];
        error.textContent = el.type === 'file' ? el.validationMessage
          : el.type === 'email' && el.value ? 'Please enter a valid email address.'
          : el.name === 'mobile' && el.value ? 'Please enter a valid mobile number.'
          : 'Please fill in the required fields marked *.';
        el.focus();
        return;
      }
      error.textContent = '';
      const data = Object.fromEntries([...new FormData(form)].filter(([k]) => k !== 'cv'));
      data.role = form.dataset.roleTitle;
      if (typeof window.submitLead === 'function') window.submitLead({ type: 'job_application', ...data });
      if (window.akhTrack) window.akhTrack('careers_apply', { role: data.role });
      const done = form.parentElement.querySelector('.akh-role-done');
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });
  });
})();

/* Round 9: Learn hero coverflow carousel of sample learning paths. */
(function () {
  const root = document.querySelector('[data-cf]');
  if (!root) return;
  const cards = [...root.querySelectorAll('.akh-cf-stage > .pc')];
  const dotsWrap = root.querySelector('.akh-cf-dots');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const total = cards.length;
  let current = 0;
  let timer = 0;

  const dots = cards.map((card, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'akh-cf-dot';
    dot.setAttribute('aria-label', `Show ${card.querySelector('h3').textContent}`);
    dot.addEventListener('click', () => { go(i); restart(); });
    dotsWrap.appendChild(dot);
    return dot;
  });

  function go(index) {
    current = (index + total) % total;
    cards.forEach((card, i) => {
      let pos = (i - current + total) % total;
      if (pos > Math.floor(total / 2)) pos -= total;
      const center = pos === 0;
      const adjacent = Math.abs(pos) === 1;
      card.style.transform = `translateX(${pos * 45}%) scale(${center ? 1 : adjacent ? 0.85 : 0.7}) rotateY(${pos * -10}deg)`;
      card.style.zIndex = center ? 10 : adjacent ? 5 : 1;
      card.style.opacity = center ? 1 : adjacent ? 0.4 : 0;
      card.style.filter = center ? 'none' : 'blur(3px)';
      card.style.visibility = Math.abs(pos) > 1 ? 'hidden' : 'visible';
      card.setAttribute('aria-hidden', String(!center));
      card.inert = !center;
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
  }
  const stop = () => { clearInterval(timer); timer = 0; };
  const start = () => { stop(); if (!reduce) timer = setInterval(() => go(current + 1), 4000); };
  const restart = () => { if (timer) start(); };

  root.querySelector('[data-cf-prev]').addEventListener('click', () => { go(current - 1); restart(); });
  root.querySelector('[data-cf-next]').addEventListener('click', () => { go(current + 1); restart(); });
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) start(); });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  // Hero audience tabs jump to their card.
  ['a1', 'a2', 'a3'].forEach((id, i) => {
    const radio = document.getElementById(id);
    if (radio) radio.addEventListener('change', () => { if (radio.checked) { go(i); restart(); } });
  });
  const checked = ['a1', 'a2', 'a3'].findIndex((id) => document.getElementById(id) && document.getElementById(id).checked);
  go(checked > 0 ? checked : 0);
  start();
})();
