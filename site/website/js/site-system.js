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
    out.innerHTML = `Thanks — it’s yours. <a href="${ROOT}website/downloads/digital-project-scoping-checklist.pdf" download>Download the checklist (PDF) ↓</a>`;
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
