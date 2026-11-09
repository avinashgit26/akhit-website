/* AKH scoper chat: "Find out what we could save you".
   Click-through script from the 6 Nov 2026 audit. Lives in the home hero and opens in a
   side drawer on every other page. Typing and voice input are still available.
   Nothing is sent anywhere yet: submitLead() is the one place to connect a CRM. */
(() => {
  const ROOT = (() => {
    const s = document.currentScript || document.querySelector('script[src*="homepage-intake.js"]');
    const src = s ? s.getAttribute('src') : '';
    return src.startsWith('../') ? '../' : '';
  })();
  const url = path => ROOT + path;

  /* ---------- The script (copy from the audit document) ---------- */
  const OPENER = [
    'Most businesses we meet are losing time or money to something that tech could fix. Let’s find yours.',
    'What’s holding you back most right now?'
  ];
  const PATHS = [
    { id: 'A', label: 'Too much manual work' },
    { id: 'B', label: 'Website isn’t bringing customers' },
    { id: 'C', label: 'We need an app' },
    { id: 'D', label: 'Want to use AI' },
    { id: 'E', label: 'I’ve got a new idea' },
    { id: 'F', label: 'Just looking around' }
  ];
  const STEP2 = {
    A: { ask: 'Where does most of it happen?', options: ['Orders and stock', 'Invoices and finance', 'Customer enquiries', 'Reports and spreadsheets'] },
    B: { ask: 'What’s the main problem?', options: ['Few enquiries or sales', 'Looks out of date', 'Slow on mobile', 'Nobody finds us on Google'] },
    C: { ask: 'Who’s it for?', options: ['Our customers', 'Our team', 'Both'] },
    D: { ask: 'Which would help most?', options: ['Answer customers 24/7', 'Write product content', 'Make sense of our data', 'Handle emails and documents'] },
    E: { ask: 'How far along are you?', options: ['Just an idea', 'Got designs or a plan', 'Have a version to rebuild'] }
  };
  const HOURS_Q = { ask: 'Roughly how many hours a week does your team spend on this?', options: ['Under 5', '5–15', '15–40', 'More than 40'] };
  const STEP3 = {
    A: HOURS_Q,
    D: HOURS_Q,
    B: { ask: 'How many enquiries or orders does the site bring in a month?', options: ['Hardly any', 'A few a week', 'Plenty, but we want more', 'Not sure'] },
    C: { ask: 'When would you like it live?', options: ['As soon as possible', 'In 1–3 months', 'Later this year', 'Just exploring'] },
    E: { ask: 'When would you like it live?', options: ['As soon as possible', 'In 1–3 months', 'Later this year', 'Just exploring'] }
  };
  /* hours × 52 weeks × £15/hour at the midpoint of each band */
  const SAVINGS = {
    'Under 5': { hours: 'around 150 hours', money: 'about £2,300 a year', moneyShort: 'about £2,300' },
    '5–15': { hours: 'around 520 hours', money: 'about £7,800 a year', moneyShort: 'about £7,800' },
    '15–40': { hours: 'around 1,300 hours', money: 'about £19,500 a year', moneyShort: 'about £19,500' },
    'More than 40': { hours: 'more than 2,300 hours', money: 'more than £35,000 a year', moneyShort: 'more than £35,000' }
  };
  const HONEST = 'If an off-the-shelf tool does the job, we’ll tell you and save you the build.';
  const HOW_WORKED = 'Hours a week (the middle of the band you chose) × 52 weeks × £15 an hour. A rough guide to the cost of the time, not a promise of savings.';
  const PROOF = {
    garment: { text: 'We built this for a UK fashion manufacturer: order allocation went from days to minutes.', href: 'portfolio/garment-manufacture-portal.html', label: 'See the project' },
    goddiva: { text: 'We built a GPT-powered shopping assistant for UK fashion brand Goddiva that answers product, size and order questions.', href: 'portfolio/goddiva-ai.html', label: 'See the project' },
    marketplace: { text: 'We built a multi-brand marketplace for a UK fashion group, with one back office for every seller.', href: 'portfolio/market-place.html', label: 'See the project' },
    invoice: { text: 'See how we size an invoice workflow so AI only does the steps it’s good at.', href: 'service/artificial-intelligence.html#ai-fit-session', label: 'See the example' },
    work: { text: 'See what we’ve built for retail, fashion and e-commerce businesses.', href: 'index.html#selected-work', label: 'See our work' }
  };
  const A_CARDS = {
    'Orders and stock': { area: 'order and stock', fix: 'We’d replace it with one system that syncs orders, stock and dispatch automatically.', proof: 'garment' },
    'Invoices and finance': { area: 'invoice and finance', fix: 'We’d have invoices read, matched and entered automatically, with a person approving every payment.', proof: 'invoice' },
    'Customer enquiries': { area: 'customer enquiry', fix: 'We’d set up an assistant that answers routine questions 24/7 and passes the rest to your team with the details filled in.', proof: 'goddiva' },
    'Reports and spreadsheets': { area: 'reporting and spreadsheet', fix: 'We’d build live dashboards that update themselves from the systems you already use.', proof: 'work' }
  };
  const D_CARDS = {
    'Answer customers 24/7': { fix: 'An assistant that answers customers day and night and hands tricky cases to a person.', proof: 'goddiva' },
    'Write product content': { fix: 'Product descriptions written in your brand voice: hundreds of listings in hours, not weeks.', proof: 'work' },
    'Make sense of our data': { fix: 'Plain-English answers and weekly summaries from the data you already have.', proof: 'work' },
    'Handle emails and documents': { fix: 'Emails sorted and documents read automatically, with your team approving anything important.', proof: 'invoice' }
  };
  const B_CARDS = {
    'Few enquiries or sales': { title: 'Your website should be your best salesperson. Right now it isn’t.', fix: 'A faster site built around one clear next step, set up to be found on Google.' },
    'Looks out of date': { title: 'First impressions are costing you customers before they read a word.', fix: 'A modern, mobile-first rebuild that loads in under 2 seconds.' },
    'Slow on mobile': { title: 'First impressions are costing you customers before they read a word.', fix: 'A modern, mobile-first rebuild that loads in under 2 seconds.' },
    'Nobody finds us on Google': { title: 'If buyers can’t find you, they’re buying from someone else.', fix: 'We fix what’s holding your site back and target the searches your buyers actually make, with a monthly report you can read in five minutes.' }
  };
  const C_CARDS = {
    'Our customers': { title: 'An app keeps you on their home screen, not your competitor’s.', fix: 'An iOS and Android app with ordering, offers and notifications.' },
    'Our team': { title: 'Give your team everything they need in their pocket.', fix: 'A staff app that replaces paper, calls and chasing.' },
    'Both': { title: 'An app keeps you on their home screen, not your competitor’s.', fix: 'One iOS and Android app for customers, with a staff view that replaces paper, calls and chasing.' }
  };
  const E_CARD = { title: 'Let’s get your idea in front of real users, fast, without overbuilding.', fix: 'A lean first version, built to test, then grow.' };

  /* Typed input is matched to the nearest path, whole words only (so "hair" never reads as "ai"). */
  const KEYWORDS = {
    A: ['manual', 'spreadsheet', 'spreadsheets', 'excel', 'admin', 'paperwork', 'orders', 'order', 'stock', 'inventory', 'invoice', 'invoices', 'finance', 'report', 'reports', 'reporting', 'process', 'processes', 'system', 'systems', 'slow', 'slowing', 'workflow', 'erp', 'crm'],
    B: ['website', 'websites', 'site', 'web', 'seo', 'google', 'enquiries', 'enquiry', 'leads', 'traffic', 'online', 'ecommerce', 'e-commerce', 'shop', 'store', 'shopify', 'landing'],
    C: ['app', 'apps', 'mobile', 'ios', 'android', 'iphone', 'phone'],
    D: ['ai', 'chatbot', 'bot', 'gpt', 'chatgpt', 'llm', 'automation', 'automate', 'assistant', 'machine learning'],
    E: ['idea', 'startup', 'start-up', 'mvp', 'prototype', 'launch', 'founder', 'new product']
  };
  const matchPath = text => {
    const t = ` ${text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ')} `;
    let best = null; let bestScore = 0;
    for (const id of ['D', 'C', 'B', 'A', 'E']) {
      const score = KEYWORDS[id].reduce((n, w) => n + (new RegExp(`\\b${w.replace(/[-]/g, '\\-')}\\b`).test(t) ? 1 : 0), 0);
      if (score > bestScore) { best = id; bestScore = score; }
    }
    return best;
  };

  /* ---------- Hooks for developers ---------- */
  const track = (name, data) => { try { window.akhTrack?.(name, data); } catch (_) {} };
  const submitLead = payload => {
    /* TODO (developers): send `payload` to the CRM here, e.g. fetch(window.AKH_LEAD_ENDPOINT, { method: 'POST', body: JSON.stringify(payload) }). */
    document.dispatchEvent(new CustomEvent('akh:lead', { detail: payload }));
    track('scoper_plan_sent', { path: payload.path });
  };

  /* ---------- One scoper instance ---------- */
  const createScoper = root => {
    const thread = root.querySelector('.intake-thread');
    const form = root.querySelector('.intake-composer');
    const briefInput = root.querySelector('.intake-composer textarea');
    const emailInput = root.querySelector('.intake-composer input[type="email"]');
    const voiceButton = root.querySelector('.intake-voice');
    const status = root.querySelector('.intake-status');
    const resetButton = root.querySelector('.intake-reset');
    const backButton = root.querySelector('[data-scoper-back]');
    const typeLink = root.querySelector('[data-scoper-type]');
    const dots = [...root.querySelectorAll('.scoper-progress i')];
    if (!thread || !form || !briefInput) return null;
    const mark = url('website/images/home/akh-logo-mark-green.png');

    let state = { path: null, a2: null, a3: null, name: '' };
    let history = [];
    let started = false;
    let recognition = null;
    let voiceAvailable = false;

    const setStatus = text => { if (status) status.textContent = text; };
    const scrollEnd = () => { thread.scrollTop = thread.scrollHeight; };
    const setDots = n => dots.forEach((d, i) => d.classList.toggle('is-done', i < n));
    /* The text box, voice and send buttons are always visible; typing just moves focus there. */
    const setTyping = on => { if (on) briefInput.focus(); };

    const bubble = (message, kind = 'guide', link = null) => {
      const p = document.createElement('p');
      p.className = `intake-message intake-message--${kind}`;
      if (kind === 'guide') {
        const img = document.createElement('img');
        img.className = 'intake-guide-mark';
        img.src = mark; img.alt = ''; img.width = 28; img.height = 30; img.draggable = false;
        img.setAttribute('aria-hidden', 'true');
        p.append(img);
      }
      const copy = document.createElement('span');
      copy.className = 'intake-message-copy';
      copy.textContent = message;
      if (link) {
        copy.append(' ');
        const a = document.createElement('a');
        a.href = url(link.href); a.textContent = `${link.label} →`;
        copy.append(a);
      }
      p.append(copy);
      thread.append(p);
      scrollEnd();
      return p;
    };

    const choices = (options, onPick, primaryFirst = false) => {
      const wrap = document.createElement('div');
      wrap.className = 'scoper-choices';
      wrap.setAttribute('role', 'group');
      options.forEach((opt, i) => {
        const o = typeof opt === 'string' ? { label: opt } : opt;
        const el = o.href ? document.createElement('a') : document.createElement('button');
        el.className = 'scoper-choice' + (primaryFirst && i === 0 ? ' scoper-choice--primary' : '');
        el.textContent = o.label;
        el.style.animationDelay = `${i * 45}ms`;
        if (o.href) { el.href = url(o.href); } else { el.type = 'button'; }
        el.addEventListener('click', event => {
          if (o.href && !o.action) return;
          if (o.href) event.preventDefault();
          wrap.querySelectorAll('.scoper-choice').forEach(b => { b.disabled = true; });
          onPick(o, el);
        });
        wrap.append(el);
      });
      thread.append(wrap);
      scrollEnd();
      return wrap;
    };

    /* Each step records where the thread was before it rendered, so Back can rewind. */
    const step = render => {
      history.push({ count: thread.children.length, state: { ...state }, render });
      if (backButton) backButton.hidden = history.length < 2;
      render();
    };
    const goBack = () => {
      if (history.length < 2) return;
      history.pop();
      const prev = history[history.length - 1];
      while (thread.children.length > prev.count) thread.lastElementChild.remove();
      state = { ...prev.state };
      if (backButton) backButton.hidden = history.length < 2;
      prev.render();
      setStatus('Went back one step.');
    };

    const answer = text => bubble(text, 'visitor');

    const renderStep1 = (intro = true) => {
      setDots(0);
      if (intro) { bubble(OPENER[0]); }
      bubble(OPENER[1]);
      choices(PATHS.map(p => ({ label: p.label, id: p.id })), o => { answer(o.label); choosePath(o.id); });
    };
    const choosePath = id => {
      state.path = id; state.a2 = null; state.a3 = null;
      setDots(1);
      if (resetButton) resetButton.hidden = false;
      track('scoper_path', { path: id });
      step(() => renderStep2());
    };
    const renderStep2 = () => {
      const id = state.path;
      if (id === 'F') {
        bubble('Here’s what we’ve built for businesses like yours.');
        choices([
          { label: 'See our work', href: 'index.html#selected-work' },
          { label: 'Get the free scoping checklist', href: 'index.html#checklist' },
          { label: 'Start again', action: 'reset' }
        ], o => { if (o.action === 'reset') reset(); });
        return;
      }
      const q = STEP2[id];
      bubble(q.ask);
      choices(q.options, o => { answer(o.label); state.a2 = o.label; setDots(2); step(() => renderStep3()); });
    };
    const renderStep3 = () => {
      const q = STEP3[state.path];
      bubble(q.ask);
      choices(q.options, o => { answer(o.label); state.a3 = o.label; setDots(3); step(() => renderResult()); });
    };

    const resultCard = ({ title, saving, math, fix, proof }) => {
      const card = document.createElement('section');
      card.className = 'scoper-result';
      card.setAttribute('aria-label', 'Your result');
      const h = document.createElement('h3'); h.textContent = title; card.append(h);
      if (saving) {
        const p = document.createElement('p'); p.className = 'scoper-saving';
        p.innerHTML = saving;
        card.append(p);
      }
      if (math) {
        const d = document.createElement('details');
        const sm = document.createElement('summary'); sm.textContent = 'How we worked this out';
        const dp = document.createElement('p'); dp.textContent = HOW_WORKED;
        d.append(sm, dp); card.append(d);
      }
      const f = document.createElement('p'); f.textContent = fix; card.append(f);
      if (proof) {
        const pr = document.createElement('p');
        pr.append(document.createTextNode(`${proof.text} `));
        const a = document.createElement('a'); a.href = url(proof.href); a.textContent = `${proof.label} →`;
        pr.append(a); card.append(pr);
      }
      const hon = document.createElement('p'); hon.className = 'scoper-honest'; hon.textContent = HONEST; card.append(hon);
      thread.append(card);
      scrollEnd();
    };

    const renderResult = () => {
      const { path, a2, a3 } = state;
      let card;
      if (path === 'A') {
        const c = A_CARDS[a2]; const s = SAVINGS[a3];
        card = { title: `That’s ${s.hours} (${s.money}) spent on manual ${c.area} work.`, math: true, fix: c.fix, proof: PROOF[c.proof] };
      } else if (path === 'D') {
        const c = D_CARDS[a2]; const s = SAVINGS[a3];
        card = { title: `That’s ${s.moneyShort} a year AI could take off your team’s plate.`, saving: `You told us ${a3.toLowerCase()} hours a week: <strong>${s.hours}</strong> a year.`, math: true, fix: `${c.fix} One focused AI tool, working prototype in 2 weeks.`, proof: PROOF[c.proof] };
      } else if (path === 'B') {
        const c = B_CARDS[a2];
        card = { title: c.title, fix: c.fix, proof: PROOF.marketplace };
      } else if (path === 'C') {
        const c = C_CARDS[a2];
        card = { title: c.title, fix: c.fix, proof: PROOF.work };
      } else {
        card = { title: E_CARD.title, fix: E_CARD.fix, proof: PROOF.work };
      }
      resultCard(card);
      track('scoper_result', { path, a2, a3 });
      choices([
        { label: 'Send me the plan', action: 'plan' },
        { label: 'Book a 15-min call', href: 'contact-us.html#book' },
        { label: 'Talk to a person', href: 'contact-us.html' }
      ], o => { if (o.action === 'plan') step(() => renderCapture()); }, true);
      setStatus('Your result is ready.');
    };

    const renderCapture = () => {
      bubble('Where should we send your plan? It’s one page: what we’d build, how long it takes and a ballpark cost.');
      const f = document.createElement('form');
      f.className = 'scoper-capture';
      f.noValidate = true;
      f.innerHTML = '<label class="sr-only">First name</label><input name="name" type="text" autocomplete="given-name" placeholder="First name" required>' +
        '<label class="sr-only">Work email</label><input name="email" type="email" autocomplete="email" placeholder="Work email" required>' +
        '<button class="scoper-choice scoper-choice--primary" type="submit">Send my plan</button>' +
        '<small>No spam. One email with your plan, then a single follow-up.</small>';
      const labels = f.querySelectorAll('label');
      const inputs = f.querySelectorAll('input');
      const uid = Math.random().toString(36).slice(2, 7);
      inputs.forEach((inp, i) => { inp.id = `scoper-${inp.name}-${uid}`; labels[i].htmlFor = inp.id; });
      f.addEventListener('submit', event => {
        event.preventDefault();
        const name = f.elements.name.value.trim();
        const email = f.elements.email;
        if (!name) { f.elements.name.reportValidity(); return; }
        if (!email.value.trim() || !email.checkValidity()) { email.reportValidity(); return; }
        state.name = name;
        submitLead({ ...state, email: email.value.trim(), page: location.pathname });
        f.remove();
        answer(`${name} · ${email.value.trim()}`);
        step(() => renderDone());
      });
      thread.append(f);
      scrollEnd();
      inputs[0].focus();
    };

    const renderDone = () => {
      bubble(`Done, ${state.name}. Your plan is on its way. Someone from our team will reply within one working day.`);
      choices([
        { label: 'See similar work', href: 'index.html#selected-work' },
        { label: 'Start a new idea', action: 'reset' }
      ], o => { if (o.action === 'reset') reset(); });
      if (backButton) backButton.hidden = true;
      setStatus('Plan requested.');
      if (resetButton) resetButton.hidden = false;
    };

    const start = (path = null, label = null) => {
      thread.replaceChildren();
      history = [];
      state = { path: null, a2: null, a3: null, name: '' };
      started = true;
      track('scoper_start', { path });
      setTyping(false);
      if (path) {
        bubble(OPENER[0]);
        history.push({ count: thread.children.length, state: { ...state }, render: () => renderStep1(false) });
        answer(label || PATHS.find(p => p.id === path)?.label || '');
        choosePath(path);
      } else {
        step(() => renderStep1(true));
        thread.scrollTop = 0;
      }
      if (resetButton) resetButton.hidden = !path;
    };
    const reset = () => { start(); setStatus('Started again.'); };

    /* Typed answers: map to a path and continue with the same buttons. */
    const handleTyped = value => {
      const text = value.trim();
      if (!text) { setStatus('Add a few words about what you need, or tap one of the options.'); briefInput.focus(); return; }
      if (!started) start();
      thread.querySelectorAll('.scoper-choice').forEach(b => { b.disabled = true; });
      answer(text);
      briefInput.value = '';
      const path = matchPath(text);
      setTyping(false);
      if (path) {
        bubble('Thanks, that sounds like this. Let’s size it up.');
        choosePath(path);
      } else {
        bubble('Thanks. Which of these is closest?');
        choices(PATHS.map(p => ({ label: p.label, id: p.id })), o => { answer(o.label); choosePath(o.id); });
      }
    };

    form.addEventListener('submit', event => { event.preventDefault(); handleTyped(briefInput.value); });
    briefInput.addEventListener('keydown', event => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); form.requestSubmit(); }
    });
    briefInput.addEventListener('input', () => {
      briefInput.style.height = 'auto';
      briefInput.style.height = `${Math.min(briefInput.scrollHeight, 132)}px`;
      briefInput.style.overflowY = briefInput.scrollHeight > 132 ? 'auto' : 'hidden';
    });
    if (emailInput) emailInput.hidden = true;
    typeLink?.addEventListener('click', () => setTyping(root.classList.contains('is-buttons-mode')));
    backButton?.addEventListener('click', goBack);
    resetButton?.addEventListener('click', reset);

    /* Voice input (unchanged behaviour). */
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (voiceButton) {
      if (!SpeechRecognition) {
        voiceButton.disabled = true;
        voiceButton.title = 'Voice input is unavailable here; you can type instead.';
      } else {
        voiceAvailable = true;
        recognition = new SpeechRecognition();
        recognition.lang = 'en-GB';
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.onstart = () => { voiceButton.setAttribute('aria-pressed', 'true'); voiceButton.setAttribute('aria-label', 'Stop voice input'); setStatus('Listening. Select the microphone again to stop.'); };
        recognition.onresult = event => {
          const transcript = event.results?.[0]?.[0]?.transcript?.trim();
          if (transcript) {
            briefInput.value = [briefInput.value.trim(), transcript].filter(Boolean).join(' ');
            briefInput.dispatchEvent(new Event('input', { bubbles: true }));
            briefInput.focus();
            setStatus('Voice input added. Review or edit it before sending.');
          }
        };
        recognition.onerror = event => setStatus(event.error === 'not-allowed' ? 'Microphone access was not allowed. You can type instead.' : 'Voice input stopped. You can type instead.');
        recognition.onend = () => { voiceButton.setAttribute('aria-pressed', 'false'); voiceButton.setAttribute('aria-label', 'Use voice input'); };
        voiceButton.addEventListener('click', () => {
          if (voiceButton.getAttribute('aria-pressed') === 'true') { recognition.stop(); return; }
          setTyping(true);
          setStatus('Starting voice input. Your browser may ask for microphone access.');
          try { recognition.start(); } catch (_) { setStatus('Voice input could not start. You can type instead.'); }
        });
      }
    }
    setStatus(voiceAvailable ? 'Tap an option, or type or speak your answer. Ctrl+Enter sends.' : 'Tap an option, or type your answer. Ctrl+Enter sends.');

    return {
      root,
      start,
      ensureStarted: () => { if (!started) start(); },
      focusFirst: () => { root.querySelector('.scoper-choice:not([disabled])')?.focus({ preventScroll: true }); }
    };
  };

  /* ---------- Drawer markup for pages without the hero scoper ---------- */
  const buildDrawer = () => {
    const drawer = document.createElement('div');
    drawer.className = 'scoper-drawer';
    drawer.hidden = true;
    drawer.innerHTML = `
      <div class="scoper-drawer-backdrop" data-scoper-close></div>
      <div class="scoper-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="scoper-drawer-title">
        <button class="scoper-drawer-close" type="button" data-scoper-close aria-label="Close">×</button>
        <aside class="hero-intake" data-scoper>
          <div class="hero-intake-heading scoper-frame-head">
            <h2 id="scoper-drawer-title">Find out what we could save you</h2>
            <p class="scoper-subtitle">3 taps. Under a minute. No sales pitch.</p>
            <div class="scoper-meta"><span class="scoper-bot-label">AKH · online now</span><span class="scoper-progress" aria-hidden="true"><i></i><i></i><i></i></span></div>
          </div>
          <div class="intake-thread" role="log" aria-live="polite" aria-relevant="additions"></div>
          <form class="intake-composer" novalidate>
            <label class="sr-only" for="scoper-drawer-input">Describe what you need</label>
            <div class="intake-composer-field">
              <textarea id="scoper-drawer-input" rows="1" maxlength="1200" placeholder="Describe what you need, or tap an option above…"></textarea>
              <button class="intake-voice" type="button" aria-label="Use voice input" title="Use voice input" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3m-4 0h8"/></svg></button>
              <button class="intake-send" type="submit" aria-label="Send answer"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>
            </div>
          </form>
          <p class="intake-status" role="status" aria-live="polite"></p>
          <div class="scoper-tools"><button class="scoper-back" type="button" data-scoper-back hidden>← Back</button><button class="intake-reset" type="button" hidden>Start a new idea</button></div>
        </aside>
      </div>`;
    document.body.append(drawer);
    return drawer;
  };

  const heroRoot = document.querySelector('.hero-chat-stage [data-scoper]');
  let hero = heroRoot ? createScoper(heroRoot) : null;
  let drawer = null; let drawerScoper = null; let lastFocus = null;

  const openDrawer = (path = null, label = null, opener = null) => {
    if (!drawer) { drawer = buildDrawer(); drawerScoper = createScoper(drawer.querySelector('[data-scoper]')); drawer.querySelectorAll('[data-scoper-close]').forEach(b => b.addEventListener('click', closeDrawer)); }
    lastFocus = opener || document.activeElement;
    drawer.hidden = false;
    document.body.classList.add('scoper-open');
    if (path) drawerScoper.start(path, label); else drawerScoper.ensureStarted();
    setTimeout(() => drawerScoper.focusFirst(), 60);
  };
  const closeDrawer = () => {
    if (!drawer) return;
    drawer.hidden = true;
    document.body.classList.remove('scoper-open');
    lastFocus?.focus?.({ preventScroll: true });
  };
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && drawer && !drawer.hidden) closeDrawer(); });

  // Home: the hero chat answers only while it is on screen. Anywhere lower down, the same side panel
  // as every other page opens, so the click never just scrolls back to the top.
  const heroInView = () => {
    if (!heroRoot) return false;
    const r = heroRoot.getBoundingClientRect();
    const visible = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    return visible >= Math.min(r.height, window.innerHeight) * 0.5;
  };
  const openScoper = (path = null, label = null, opener = null) => {
    if (hero && heroInView()) {
      if (path) hero.start(path, label); else hero.ensureStarted();
      document.getElementById('scoper')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      setTimeout(() => hero.focusFirst(), 450);
    } else {
      openDrawer(path, label, opener);
    }
  };
  window.akhOpenScoper = openScoper;

  document.addEventListener('click', event => {
    const opener = event.target instanceof Element ? event.target.closest('[data-open-scoper]') : null;
    if (opener) { event.preventDefault(); openScoper(null, null, opener); return; }
    const chip = event.target instanceof Element ? event.target.closest('[data-scoper-path]') : null;
    if (chip) { event.preventDefault(); openScoper(chip.dataset.scoperPath, chip.textContent.trim(), chip); }
  });

  // Every page: the header button hides while the same button is on screen in the body or footer,
  // so two identical buttons never show at once.
  if ('IntersectionObserver' in window) {
    const ctas = [...document.querySelectorAll('[data-open-scoper]')].filter(el => !el.closest('header.header, .assistant-prompts, .lc-assistant-prompts, .scoper-drawer'));
    if (ctas.length) {
      const visible = new Set();
      const ctaObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target); });
        document.body.classList.toggle('scoper-cta-in-view', visible.size > 0);
      }, { threshold: 0.6 });
      ctas.forEach(el => ctaObserver.observe(el));
    }
  }

  if (hero) {
    hero.start();
    if (location.hash === '#scoper') setTimeout(() => {
      document.getElementById('scoper')?.scrollIntoView({ block: 'center' });
      setTimeout(() => hero.focusFirst(), 300);
    }, 300);
    // Header button hides while the hero chat is on screen (it would point at what is already there).
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        entries.forEach(entry => document.body.classList.toggle('scoper-in-view', entry.isIntersecting));
      }, { threshold: 0.25 }).observe(heroRoot);
    }
  }
})();
