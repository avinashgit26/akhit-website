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
    if (!contact.hasAttribute('data-two-step')) contact.addEventListener('submit', event => {
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
      if (!f) { fileName.textContent = 'No file chosen'; return file.checkValidity(); }
      fileName.textContent = f.name;
      if (!okType(f.name)) file.setCustomValidity('Please upload a PDF, DOC or DOCX file.');
      else if (f.size > MAX) file.setCustomValidity('Please upload a file under 5 MB.');
      return file.checkValidity();
    };
    file.addEventListener('change', () => { checkFile(); error.textContent = file.validationMessage; });
    const why = form.querySelector('textarea[name="why"]');
    const mobile = form.querySelector('input[name="mobile"]');
    const checkText = () => {
      if (why) why.setCustomValidity(why.value.trim() && why.value.trim().length < 20 ? 'Please tell us a little more (at least 20 characters).' : '');
      if (mobile) {
        const digits = mobile.value.replace(/\D/g, '');
        mobile.setCustomValidity(mobile.value.trim() && (digits.length < 7 || digits.length > 12 || /^\s*\+/.test(mobile.value)) ? 'Please enter a valid mobile number, without the country code.' : '');
      }
    };
    form.querySelectorAll('input:not([type="file"]), textarea').forEach((input) => {
      input.addEventListener('blur', () => { checkText(); input.classList.toggle('is-invalid', !input.checkValidity()); });
      input.addEventListener('input', () => { checkText(); if (input.checkValidity()) input.classList.remove('is-invalid'); });
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      checkFile();
      checkText();
      const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
      invalid.forEach((el) => el.classList.add('is-invalid'));
      if (invalid.length) {
        const el = invalid[0];
        error.textContent = el.type === 'file' ? (el.files.length ? el.validationMessage : 'Please attach your CV or resume (PDF, DOC or DOCX).')
          : el.type === 'email' && el.value ? 'Please enter a valid email address.'
          : el.name === 'mobile' && el.value ? 'Please enter a valid mobile number, without the country code.'
          : el.name === 'why' && el.value.trim() ? 'Please tell us a little more about why you want to join (at least 20 characters).'
          : el.name === 'why' ? 'Please tell us why you want to join AKH.'
          : el.name === 'mobile' ? 'Please enter your mobile number.'
          : 'Please fill in the required fields marked *.';
        el.focus();
        return;
      }
      error.textContent = '';
      const data = Object.fromEntries([...new FormData(form)].filter(([k]) => k !== 'cv'));
      data.role = form.dataset.roleTitle;
      data.mobile = `${data.country_code || ''} ${data.mobile || ''}`.trim();
      if (typeof window.submitLead === 'function') window.submitLead({ type: 'job_application', ...data });
      if (window.akhTrack) window.akhTrack('careers_apply', { role: data.role });
      const done = form.parentElement.querySelector('.akh-role-done');
      const who = done.querySelector('[data-applicant]');
      if (who) who.textContent = data.first_name ? `, ${String(data.first_name).trim()}` : '';
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

/* Round 19: two-step forms (Contact, AI fit session), same flow as the Services quote form:
   step 1 asks what they need, step 2 asks how to address them and where to reply. */
window.akhTwoStepForm = form => {
  if (!form || form.dataset.qfReady) return;
  form.dataset.qfReady = '1';
  const panes = [...form.querySelectorAll('[data-qf-pane]')];
  const stepLabel = form.querySelector('[data-qf-step-label]');
  const brief = form.querySelector('[data-qf-brief]');
  const status = form.querySelector('[data-qf-status]');
  const showStep = step => {
    form.dataset.step = String(step);
    panes.forEach(pane => { pane.hidden = pane.dataset.qfPane !== String(step); });
    if (stepLabel) stepLabel.textContent = `Step ${step} of 2`;
  };
  form.querySelector('[data-qf-next]')?.addEventListener('click', () => {
    const text = brief.value.trim();
    brief.setCustomValidity(text.length < 10 ? 'Tell us a little about what you need (a sentence is enough).' : '');
    if (!brief.reportValidity()) return;
    const preview = form.querySelector('[data-qf-preview]');
    if (preview) preview.textContent = text.length > 160 ? text.slice(0, 157) + '…' : text;
    showStep(2);
    form.querySelector('.akh-qf-title')?.focus();
    window.akhTrack?.(`${form.dataset.leadType || 'form'}_step2`);
  });
  form.querySelector('[data-qf-back]')?.addEventListener('click', () => { showStep(1); brief.focus(); });
  brief?.addEventListener('input', () => brief.setCustomValidity(''));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (form.dataset.step !== '2') { form.querySelector('[data-qf-next]')?.click(); return; }
    for (const field of form.querySelectorAll('[data-qf-pane="2"] input')) { if (!field.reportValidity()) return; }
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const detail = { type: form.dataset.leadType || 'form', name, email: String(data.get('email') || '').trim(), brief: String(data.get('brief') || '').trim() };
    if (data.has('need')) detail.need = String(data.get('need'));
    if (data.has('budget')) detail.budget = String(data.get('budget'));
    document.dispatchEvent(new CustomEvent('akh:lead', { detail }));
    window.akhTrack?.(`${detail.type}_submit`);
    panes.forEach(pane => { pane.hidden = true; });
    form.querySelector('.akh-qf-step')?.setAttribute('hidden', '');
    if (status) {
      status.textContent = (form.dataset.thanks || 'Thanks{name}. We’ll be in touch within one working day.').replace('{name}', name ? ', ' + name : '');
      status.classList.add('is-visible');
    }
  });
  // Voice input for the brief, where the browser supports it.
  const mic = form.querySelector('[data-qf-mic]');
  const voice = form.querySelector('[data-qf-voice]');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (mic && brief) {
    if (!Recognition) {
      mic.addEventListener('click', () => { if (voice) voice.textContent = 'Voice input is unavailable in this browser. You can type instead.'; });
    } else {
      const rec = new Recognition();
      rec.lang = 'en-GB'; rec.interimResults = true; rec.continuous = false;
      let voiceBase = '';
      rec.onstart = () => { voiceBase = brief.value.trim(); mic.setAttribute('aria-pressed', 'true'); if (voice) voice.textContent = 'Listening. Your browser may send audio to its speech service for transcription.'; };
      rec.onresult = e => {
        let spoken = '';
        for (let i = 0; i < e.results.length; i += 1) spoken += e.results[i][0].transcript;
        brief.value = [voiceBase, spoken.trim()].filter(Boolean).join(' ');
        brief.dispatchEvent(new Event('input', { bubbles: true }));
      };
      rec.onerror = e => { if (voice) voice.textContent = e.error === 'not-allowed' ? 'Microphone access was not allowed. You can type instead.' : 'Voice input stopped. You can type instead.'; };
      rec.onend = () => mic.setAttribute('aria-pressed', 'false');
      mic.addEventListener('click', () => {
        if (mic.getAttribute('aria-pressed') === 'true') { rec.stop(); return; }
        if (voice) voice.textContent = '';
        try { rec.start(); } catch (_) { if (voice) voice.textContent = 'Voice input could not start. You can type instead.'; }
      });
    }
  }
};
document.querySelectorAll('form[data-two-step]').forEach(form => window.akhTwoStepForm(form));

/* Round 20: FAQs open one at a time. Opening a question closes any other open question in the same list.
   Only plain <details> (the FAQ items); menus, role/course sections and service cards are left alone. */
document.addEventListener('toggle', event => {
  const item = event.target;
  if (!(item instanceof HTMLDetailsElement) || !item.open || item.classList.length) return;
  const list = item.parentElement;
  if (!list) return;
  [...list.children].forEach(other => {
    if (other !== item && other instanceof HTMLDetailsElement && other.open && !other.classList.length) other.open = false;
  });
}, true);

/* Round 19: header "Get a fixed quote" stands in whenever "Find out what we could save you" is hidden. */
(() => {
  const alt = document.querySelector('header.header [data-header-quote]');
  if (!alt) return;
  const quoteForm = document.querySelector('form#contact-form[data-lead-type="contact"]');
  if (quoteForm && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => document.body.classList.toggle('quote-form-in-view', entry.isIntersecting), { threshold: 0.2 }).observe(quoteForm);
  }
  const sync = () => {
    const b = document.body.classList;
    const on = (b.contains('scoper-in-view') || b.contains('scoper-cta-in-view')) && !b.contains('scoper-open') && !b.contains('quote-form-in-view');
    if (on) alt.removeAttribute('aria-hidden'); else alt.setAttribute('aria-hidden', 'true');
    if (on) alt.removeAttribute('tabindex'); else alt.setAttribute('tabindex', '-1');
  };
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  sync();
  // Sit exactly where the main header button sits (on phones it runs slightly past the nav edge).
  const main = alt.parentElement?.querySelector('.cta[data-open-scoper]');
  const align = () => {
    if (!main) return;
    const offset = Math.round(alt.parentElement.getBoundingClientRect().right - main.getBoundingClientRect().right);
    alt.style.right = offset + 'px';
  };
  align();
  window.addEventListener('resize', align, { passive: true });
  window.addEventListener('load', align);
})();

/* Round 20: Learn with us pop-ups. Learning is its own revenue stream, so its CTAs open
   learning-specific forms here instead of sending people to the build-services quote form. */
(() => {
  const triggers = document.querySelectorAll('[data-learn-open]');
  const interest = document.getElementById('learn-interest-form');
  const EMAIL_EMPTY = 'Please enter your email address.';
  const EMAIL_BAD = 'Please enter a valid email address, like you@example.com.';
  const emailMessage = input => (!input.value.trim() ? EMAIL_EMPTY : EMAIL_BAD);

  /* Register your interest (bottom of the page): clear messages for an empty or invalid email. */
  if (interest) {
    const email = interest.querySelector('input[type="email"]');
    const status = document.getElementById('learn-interest-status');
    email.addEventListener('input', () => { if (status.classList.contains('is-error')) { status.className = 'akh-learn-status'; status.textContent = ''; email.removeAttribute('aria-invalid'); } });
    interest.addEventListener('submit', event => {
      event.preventDefault();
      if (!email.value.trim() || !email.checkValidity()) {
        status.className = 'akh-learn-status is-error';
        status.textContent = emailMessage(email);
        email.setAttribute('aria-invalid', 'true');
        email.focus();
        return;
      }
      const role = document.getElementById('f1')?.value || '';
      const topic = document.getElementById('f2')?.value || '';
      document.dispatchEvent(new CustomEvent('akh:lead', { detail: { type: 'learn_interest', email: email.value.trim(), role, topic } }));
      window.akhTrack?.('learn_interest_submit', { topic });
      status.className = 'akh-learn-status is-success';
      status.textContent = `Thanks, you’re on the list for ${topic}. We’ll email you first when it opens, with early-access pricing.`;
      email.value = '';
    });
  }

  if (!triggers.length) return;
  const PATHS = ['AI and automation', 'Websites and apps', 'Data and analytics', 'Marketing and transformation'];
  const F = {
    name: { label: 'Your name', name: 'name', autocomplete: 'name', required: true },
    email: { label: 'Email address', name: 'email', type: 'email', autocomplete: 'email', required: true },
    workEmail: { label: 'Work email', name: 'email', type: 'email', autocomplete: 'email', required: true },
    path: { label: 'What do you want to learn?', name: 'path', options: PATHS },
  };
  const VARIANTS = {
    start: {
      eyebrow: 'Self-paced learning', title: 'Start learning at your own pace.',
      intro: 'Pick a path and we’ll send you how to start, what you’ll build and the early-access price.',
      fields: [F.name, F.email, F.path], submit: 'Start learning',
      thanks: 'You’re in, {name}. We’ll email your path details and how to start within one working day.',
    },
    cohort: {
      eyebrow: 'Guided cohort', title: 'Save your seat in the next cohort.',
      intro: 'Learn with a small group, a coach and weekly live sessions. Tell us your path and when you’d like to start.',
      fields: [F.name, F.email, F.path, { label: 'When would you like to start?', name: 'start', options: ['As soon as possible', 'In the next 1–2 months', 'Later this year', 'Not sure yet'] }],
      submit: 'Request my seat',
      thanks: 'Seat request received, {name}. We’ll email the next cohort dates and your early-access price.',
    },
    team: {
      eyebrow: 'Teams & schools', title: 'Train your team on the skills you need.',
      intro: 'Tell us who’s learning and what they need to be able to do. We’ll suggest a programme built around your people and tools.',
      fields: [F.name, F.workEmail, { label: 'Organisation', name: 'organisation', autocomplete: 'organization', required: true },
        { label: 'How many learners?', name: 'learners', options: ['1–10', '11–25', '26–50', '50+'] },
        { label: 'What should they be able to do afterwards?', name: 'goals', textarea: true, placeholder: 'For example: use AI tools safely in daily work' }],
      submit: 'Talk about team training',
      thanks: 'Thanks, {name}. We’ll reply within one working day to plan your team’s programme.',
    },
    educator: {
      eyebrow: 'Educator workshops', title: 'Hands-on workshops for educators.',
      intro: 'Practical sessions that help teachers and lecturers use AI and digital tools in class, with ready-to-use material.',
      fields: [F.name, F.workEmail, { label: 'School, college or university', name: 'institution', autocomplete: 'organization', required: true },
        { label: 'How many educators?', name: 'educators', options: ['1–10', '11–25', '26–50', '50+'] },
        { label: 'Topic', name: 'topic', options: ['AI in teaching and assessment', 'Digital skills for the classroom', 'Data and analytics basics', 'Something else'] }],
      submit: 'Ask about a workshop',
      thanks: 'Thanks, {name}. We’ll be in touch within one working day with workshop options and dates.',
    },
    partner: {
      eyebrow: 'For course providers', title: 'Partner with AKH to deliver your courses.',
      intro: 'We add coaching, cohorts and support to your courses so more learners finish and apply what they learn. Tell us about your catalogue.',
      fields: [F.name, F.workEmail, { label: 'Organisation', name: 'organisation', autocomplete: 'organization', required: true },
        { label: 'Course catalogue or website', name: 'website', type: 'url', placeholder: 'https://', optional: true },
        { label: 'Which courses would you like to offer with AKH?', name: 'message', textarea: true }],
      submit: 'Start a partner conversation',
      thanks: 'Thanks, {name}. Our learning partnerships team will reply within one working day to arrange a first call.',
    },
  };

  const dialog = document.createElement('dialog');
  dialog.className = 'modal launch-dialog akh-learn-dialog';
  dialog.setAttribute('aria-labelledby', 'learn-dialog-title');
  dialog.innerHTML = '<div class="modal-inner"><div class="modal-top"><div><p class="eyebrow" data-l-eyebrow></p><h2 id="learn-dialog-title" data-l-title></h2></div><button class="modal-close" type="button" aria-label="Close">×</button></div><p class="launch-intro" data-l-intro></p><form class="akh-learn-form" novalidate></form><div class="akh-learn-done" tabindex="-1" role="status" aria-live="polite" hidden></div></div>';
  document.body.append(dialog);
  const form = dialog.querySelector('form');
  const done = dialog.querySelector('.akh-learn-done');
  dialog.querySelector('.modal-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  let variant = 'start';

  const fieldHtml = (f, i) => {
    const id = `learn-f-${i}`;
    const req = f.required ? ' required' : '';
    const label = `<span class="field-label">${f.label}${f.required ? ' *' : ''}${f.optional ? ' <span class="akh-qf-optional">(optional)</span>' : ''}</span>`;
    let control;
    if (f.options) control = `<select id="${id}" name="${f.name}">${f.options.map(o => `<option>${o}</option>`).join('')}</select>`;
    else if (f.textarea) control = `<textarea id="${id}" name="${f.name}" rows="3" maxlength="1500"${f.placeholder ? ` placeholder="${f.placeholder}"` : ''}${req}></textarea>`;
    else control = `<input id="${id}" name="${f.name}" data-what="${f.label.replace(/^Your /i, '').toLowerCase()}" type="${f.type || 'text'}"${f.autocomplete ? ` autocomplete="${f.autocomplete}"` : ''}${f.placeholder ? ` placeholder="${f.placeholder}"` : ''}${req}>`;
    return `<label class="field" for="${id}">${label}${control}<span class="akh-field-error" aria-live="polite"></span></label>`;
  };

  const openVariant = (key, preset) => {
    const v = VARIANTS[key];
    if (!v) return;
    variant = key;
    dialog.querySelector('[data-l-eyebrow]').textContent = v.eyebrow;
    dialog.querySelector('[data-l-title]').textContent = v.title;
    dialog.querySelector('[data-l-intro]').textContent = v.intro;
    form.innerHTML = v.fields.map(fieldHtml).join('') + `<button class="cta" type="submit">${v.submit} <span aria-hidden="true">→</span></button><p class="akh-learn-small">We’ll only use your details to reply about learning with AKH.</p>`;
    if (preset) { const sel = form.querySelector('select[name="path"]'); if (sel) sel.value = preset; }
    form.hidden = false;
    done.hidden = true;
    done.textContent = '';
    if (!dialog.open) dialog.showModal();
    form.querySelector('input')?.focus();
    window.akhTrack?.('learn_popup_open', { variant: key });
  };

  const fieldError = el => {
    if (el.validity.valueMissing) return el.type === 'email' ? EMAIL_EMPTY : `Please enter your ${(el.dataset.what || 'details')}.`;
    if (el.type === 'email' && !el.validity.valid) return EMAIL_BAD;
    if (el.type === 'url' && !el.validity.valid) return 'Please enter a full web address, starting with https://';
    return '';
  };
  const showError = el => {
    const msg = fieldError(el);
    const slot = el.parentElement.querySelector('.akh-field-error');
    if (slot) slot.textContent = msg;
    el.toggleAttribute('aria-invalid', Boolean(msg));
    el.classList.toggle('is-invalid', Boolean(msg));
    return !msg;
  };
  form.addEventListener('input', event => { if (event.target.classList?.contains('is-invalid')) showError(event.target); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const controls = [...form.querySelectorAll('input, textarea')];
    const bad = controls.filter(el => !showError(el));
    if (bad.length) { bad[0].focus(); return; }
    const data = Object.fromEntries(new FormData(form));
    document.dispatchEvent(new CustomEvent('akh:lead', { detail: { type: `learn_${variant}`, ...data } }));
    window.akhTrack?.(`learn_${variant}_submit`);
    const first = String(data.name || '').trim().split(/\s+/)[0] || 'there';
    done.innerHTML = '<span class="akh-learn-done-mark" aria-hidden="true">✓</span><p></p><button class="akh-btn akh-btn--secondary" type="button">Close</button>';
    done.querySelector('p').textContent = VARIANTS[variant].thanks.replace('{name}', first);
    done.querySelector('button').addEventListener('click', () => dialog.close());
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });

  document.addEventListener('click', event => {
    const btn = event.target instanceof Element ? event.target.closest('[data-learn-open]') : null;
    if (!btn) return;
    event.preventDefault();
    openVariant(btn.dataset.learnOpen, btn.dataset.selectValue);
  });
})();

/* Round 20: footer newsletter shows a clear message for an empty/invalid email and a thank-you once subscribed. */
(() => {
  const form = document.getElementById('preview-newsletter');
  if (!form) return;
  const email = form.querySelector('input[type="email"]');
  const status = form.parentElement.querySelector('.site-newsletter-status');
  if (!email || !status) return;
  const handle = event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const value = email.value.trim();
    if (!value || !email.checkValidity()) {
      status.className = 'site-newsletter-status is-error';
      status.textContent = value ? 'Please enter a valid email address, like you@company.com.' : 'Please enter your email address.';
      email.setAttribute('aria-invalid', 'true');
      email.focus();
      return;
    }
    email.removeAttribute('aria-invalid');
    document.dispatchEvent(new CustomEvent('akh:lead', { detail: { type: 'newsletter', email: value } }));
    window.akhTrack?.('newsletter_subscribe');
    status.className = 'site-newsletter-status is-success';
    status.textContent = 'Thanks, you’re subscribed. Your first tech idea arrives next month.';
    email.value = '';
  };
  form.addEventListener('submit', handle, true);
  email.addEventListener('input', () => { if (status.classList.contains('is-error')) { status.className = 'site-newsletter-status'; status.textContent = ''; email.removeAttribute('aria-invalid'); } });
})();

/* Round 20: on-screen keyboard. Phones keep fixed panels sized to the full screen when the keyboard opens,
   which pushed the chat send button out of view. Track the visible area and let CSS fit the panels to it. */
(() => {
  const vv = window.visualViewport;
  if (!vv) return;
  const root = document.documentElement;
  const sync = () => {
    const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    const open = covered > 120 && document.activeElement?.matches?.('input, textarea, select');
    root.classList.toggle('akh-kb-open', Boolean(open));
    root.style.setProperty('--akh-vv-h', `${Math.round(vv.height)}px`);
    root.style.setProperty('--akh-vv-top', `${Math.round(vv.offsetTop)}px`);
    root.style.setProperty('--akh-kb', `${Math.round(open ? covered : 0)}px`);
    if (open) {
      const field = document.activeElement;
      const box = field.closest('.assistant-panel, .lc-assistant-panel, .ai-assistant-panel, .scoper-drawer-panel, .launch-dialog');
      if (box) requestAnimationFrame(() => field.scrollIntoView({ block: 'nearest' }));
    }
  };
  vv.addEventListener('resize', sync);
  vv.addEventListener('scroll', sync);
  document.addEventListener('focusin', () => setTimeout(sync, 60));
  document.addEventListener('focusout', () => setTimeout(sync, 120));
})();
