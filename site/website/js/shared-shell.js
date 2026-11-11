(() => {
  const ribbon = document.querySelector('.launch-bar');
  const header = document.querySelector('header.header');
  if (ribbon && header) {
    const syncHeader = visible => header.classList.toggle('is-ribbon-gone', !visible);
    syncHeader(ribbon.getBoundingClientRect().bottom > 0);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => syncHeader(entry.isIntersecting), { threshold: 0 });
      observer.observe(ribbon);
    } else {
      window.addEventListener('scroll', () => syncHeader(ribbon.getBoundingClientRect().bottom > 0), { passive: true });
    }
  } else if (header) {
    // No ribbon: the header turns charcoal once the page is scrolled, as it did when the ribbon left the screen.
    const syncScroll = () => header.classList.toggle('is-ribbon-gone', window.scrollY > 8);
    syncScroll();
    window.addEventListener('scroll', syncScroll, { passive: true });
  }

  const dialog = document.getElementById('waitlist-dialog');
  if (!dialog) return;
  const open = document.getElementById('open-waitlist');
  const close = document.getElementById('close-waitlist');
  const form = document.getElementById('waitlist-form');
  const email = document.getElementById('waitlist-email');
  const status = document.getElementById('waitlist-status');
  open?.addEventListener('click', () => dialog.showModal());
  close?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  /* After a successful sign-up the dialog shows a confirmation; reopening it starts fresh. */
  const resetWaitlist = () => {
    if (!form || !status) return;
    form.hidden = false;
    status.classList.remove('is-success', 'is-error');
    status.textContent = '';
  };
  // Reset each time the dialog opens (an attribute change, so it works however the dialog was opened).
  new MutationObserver(() => { if (dialog.open) resetWaitlist(); }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  email?.addEventListener('input', () => { if (status?.classList.contains('is-error')) { status.classList.remove('is-error'); status.textContent = ''; } });
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const value = email?.value.trim() || '';
    if (!value || !email.validity.valid) {
      if (status) { status.classList.add('is-error'); status.textContent = value ? 'Please enter a valid email address, like you@company.com.' : 'Please enter your email address.'; }
      email?.focus();
      return;
    }
    document.dispatchEvent(new CustomEvent('akh:lead', { detail: { type: 'waitlist', email: value } }));
    window.akhTrack?.('waitlist_join');
    if (status) {
      status.classList.remove('is-error');
      status.classList.add('is-success');
      status.innerHTML = '<strong>You’re on the list.</strong> We’ll email <b></b> as soon as RetailWeave early access opens.';
      status.querySelector('b').textContent = value;
    }
    form.hidden = true;
    email.value = '';
  });
})();
