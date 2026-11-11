(() => {
  const stage = document.querySelector('[data-services-drop]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (stage) {
    if (reduceMotion.matches) {
      stage.classList.add('is-settled');
    } else {
      window.requestAnimationFrame(() => stage.classList.add('is-animated'));
    }
  }

  const bindTabset = (tabSelector, tablistSelector, { vertical = false, onActivate } = {}) => {
    const tabs = Array.from(document.querySelectorAll(tabSelector));
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    const tablist = document.querySelector(tablistSelector);
    if (!tabs.length || !tablist) return { tabs, activate: () => {} };

    const activate = (selected, moveFocus = false) => {
      tabs.forEach((tab, index) => {
        const active = tab === selected;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (panels[index]) panels[index].hidden = !active;
      });
      onActivate?.(selected);
      if (moveFocus) selected.focus();
    };

    tabs.forEach(tab => tab.addEventListener('click', () => activate(tab)));
    tablist.addEventListener('keydown', event => {
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      const forward = vertical ? 'ArrowDown' : 'ArrowRight';
      const backward = vertical ? 'ArrowUp' : 'ArrowLeft';
      let next = null;
      if (event.key === forward) next = (current + 1) % tabs.length;
      if (event.key === backward) next = (current - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== null) {
        event.preventDefault();
        activate(tabs[next], true);
      }
    });
    return { tabs, activate };
  };

  const offerings = bindTabset('.services-offering-tab', '[role="tablist"][aria-label="Choose a service"]', { vertical: true });
  const activateOfferingFromHash = () => {
    let targetId = window.location.hash.slice(1);
    try { targetId = decodeURIComponent(targetId); } catch (_) {}
    const selected = offerings.tabs.find(tab => tab.getAttribute('aria-controls') === targetId);
    if (!selected) return;
    offerings.activate(selected);
    window.requestAnimationFrame(() => document.getElementById('what-we-build')?.scrollIntoView({ block: 'start' }));
  };
  activateOfferingFromHash();
  window.addEventListener('hashchange', activateOfferingFromHash);

  const engineering = bindTabset('.services-engineering-tab', '[role="tablist"][aria-label="Engineering approaches"]');
  const process = bindTabset('.services-process-tab', '[role="tablist"][aria-label="How AKH works"]', {
    onActivate(selected) {
      document.querySelector('.services-process')?.setAttribute('data-process-stage', selected.id.replace('process-tab-', ''));
    }
  });

  const form = document.getElementById('services-scoping-form');
  const formStatus = document.getElementById('scoping-submit-status');
  // Two steps: what they need first, then how to address them and where to send the quote.
  const panes = form ? [...form.querySelectorAll('[data-qf-pane]')] : [];
  const stepLabel = form?.querySelector('[data-qf-step-label]');
  const showStep = step => {
    form.dataset.step = String(step);
    panes.forEach(pane => { pane.hidden = pane.dataset.qfPane !== String(step); });
    if (stepLabel) stepLabel.textContent = `Step ${step} of 2`;
  };
  form?.querySelector('[data-qf-next]')?.addEventListener('click', () => {
    const briefField = document.getElementById('scoping-brief');
    const text = briefField.value.trim();
    briefField.setCustomValidity(text.length < 10 ? 'Tell us a little about what you need (a sentence is enough).' : '');
    if (!briefField.reportValidity()) return;
    const preview = form.querySelector('[data-qf-preview]');
    preview.textContent = text.length > 160 ? text.slice(0, 157) + '…' : text;
    showStep(2);
    form.querySelector('.akh-qf-title')?.focus();
    window.akhTrack?.('services_quote_step2');
  });
  form?.querySelector('[data-qf-back]')?.addEventListener('click', () => {
    showStep(1);
    document.getElementById('scoping-brief')?.focus();
  });
  document.getElementById('scoping-brief')?.addEventListener('input', event => event.target.setCustomValidity(''));
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (form.dataset.step !== '2') { form.querySelector('[data-qf-next]')?.click(); return; }
    const fields = [...form.querySelectorAll('[data-qf-pane="2"] input')];
    for (const field of fields) { if (!field.reportValidity()) return; }
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    document.dispatchEvent(new CustomEvent('akh:lead', { detail: { type: 'services_quote', name, email: String(data.get('email') || '').trim(), brief: String(data.get('brief') || '').trim() } }));
    window.akhTrack?.('services_quote_submit');
    form.querySelector('[data-qf-pane="2"]').hidden = true;
    form.querySelector('.akh-qf-step').hidden = true;
    formStatus.textContent = 'Thanks' + (name ? ', ' + name : '') + '. We’ll reply within one working day with an honest view, a price and a timeline.';
    formStatus.classList.add('is-visible');
  });

  const mic = document.getElementById('scoping-mic');
  const brief = document.getElementById('scoping-brief');
  const voiceStatus = document.getElementById('scoping-voice-status');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  if (mic && brief && voiceStatus) {
    if (!Recognition) {
      mic.addEventListener('click', () => {
        voiceStatus.textContent = 'Voice input is unavailable in this browser. You can type your brief instead.';
      });
    } else {
      recognition = new Recognition();
      recognition.lang = 'en-GB';
      recognition.interimResults = true;
      recognition.continuous = false;
      let voiceBase = '';
      recognition.onstart = () => {
        voiceBase = brief.value.trim();
        mic.setAttribute('aria-pressed', 'true');
        mic.setAttribute('aria-label', 'Stop voice input');
        voiceStatus.textContent = 'Listening. Your browser may send audio to its speech service for transcription.';
      };
      recognition.onresult = event => {
        let spoken = '';
        for (let i = 0; i < event.results.length; i += 1) spoken += event.results[i][0].transcript;
        brief.value = [voiceBase, spoken.trim()].filter(Boolean).join(' ');
        brief.dispatchEvent(new Event('input', { bubbles: true }));
      };
      recognition.onerror = event => {
        voiceStatus.textContent = event.error === 'not-allowed'
          ? 'Microphone access was not allowed. You can type your brief instead.'
          : 'Voice input stopped. You can type your brief instead.';
      };
      recognition.onend = () => {
        mic.setAttribute('aria-pressed', 'false');
        mic.setAttribute('aria-label', 'Use voice input for your project brief');
      };
      mic.addEventListener('click', () => {
        if (mic.getAttribute('aria-pressed') === 'true') {
          recognition.stop();
          return;
        }
        voiceStatus.textContent = '';
        try {
          recognition.start();
        } catch (_) {
          voiceStatus.textContent = 'Voice input could not start. You can type your brief instead.';
        }
      });
    }
  }
})();
