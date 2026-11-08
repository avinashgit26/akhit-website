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

/* Round 5b: careers role panel (details + apply form, front-end only). */
(function () {
  const drawer = document.getElementById('role-drawer');
  if (!drawer) return;
  const panel = drawer.querySelector('.akh-role-panel');
  const roles = [...drawer.querySelectorAll('.akh-role')];
  let lastFocus = null;

  const open = (slug, fromHash) => {
    const role = roles.find((r) => r.dataset.role === slug);
    if (!role) return;
    lastFocus = document.activeElement;
    roles.forEach((r) => { r.hidden = r !== role; });
    drawer.hidden = false;
    document.documentElement.classList.add('akh-role-open');
    panel.setAttribute('aria-labelledby', `${slug}-title`);
    panel.scrollTop = 0;
    if (!fromHash && location.hash !== `#${slug}`) history.pushState(null, '', `#${slug}`);
    requestAnimationFrame(() => role.querySelector('h2').setAttribute('tabindex', '-1') || role.querySelector('h2').focus());
    if (window.akhTrack) window.akhTrack('careers_role_open', { role: slug });
  };
  const close = (fromHash) => {
    if (drawer.hidden) return;
    drawer.hidden = true;
    document.documentElement.classList.remove('akh-role-open');
    if (!fromHash && roles.some((r) => location.hash === `#${r.dataset.role}`)) history.pushState(null, '', location.pathname + location.search);
    if (lastFocus) lastFocus.focus();
  };
  const fromHash = () => {
    const slug = location.hash.slice(1);
    if (roles.some((r) => r.dataset.role === slug)) open(slug, true); else close(true);
  };

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-role-open]');
    if (opener) { event.preventDefault(); open(opener.dataset.roleOpen); return; }
    if (event.target.closest('[data-role-close]')) { event.preventDefault(); close(); return; }
    const jump = event.target.closest('.akh-role-jump');
    if (jump) {
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
