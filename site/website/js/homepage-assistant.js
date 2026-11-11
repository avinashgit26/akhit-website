(() => {
  const orbLauncher = document.getElementById('assistant-launcher');
  if (orbLauncher) {
    orbLauncher.setAttribute('aria-label', 'Ask our AI');
    const firstTouchReveal = new WeakSet();
    orbLauncher.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch' || orbLauncher.classList.contains('is-label-visible')) return;
      firstTouchReveal.add(orbLauncher);
      orbLauncher.classList.add('is-label-visible');
    }, { passive: true });
    orbLauncher.addEventListener('pointercancel', () => firstTouchReveal.delete(orbLauncher), { passive: true });
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target.closest('#assistant-launcher') : null;
      if (target !== orbLauncher || !firstTouchReveal.has(orbLauncher)) return;
      firstTouchReveal.delete(orbLauncher);
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

  const proofValues = [...document.querySelectorAll('.proof-value[data-count], .services-proof-value[data-count]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const setProofValue = (element, value) => {
    const decimals = Number(element.dataset.decimals || 0);
    element.textContent = `${element.dataset.prefix || ''}${value.toFixed(decimals)}${element.dataset.suffix || ''}`;
  };
  const animateProofValue = element => {
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;
    /* The count-up is short and has no movement, so it runs even with reduced motion on. */
    const start = performance.now();
    const duration = 1800;
    const tick = now => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setProofValue(element, target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const proofObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        proofObserver.unobserve(entry.target);
        animateProofValue(entry.target);
      });
    }, { threshold: .35 });
    proofValues.forEach(value => { setProofValue(value, 0); proofObserver.observe(value); });
  } else {
    proofValues.forEach(animateProofValue);
  }

  const launcher = document.getElementById('assistant-launcher');
  const panel = document.getElementById('assistant-panel');
  const closeButton = document.getElementById('assistant-close');
  const input = document.getElementById('assistant-input');
  const form = document.getElementById('assistant-form');
  const messages = document.getElementById('assistant-messages');
  const prompts = document.getElementById('assistant-prompts');
  const status = document.getElementById('assistant-status');
  const voiceButton = document.getElementById('assistant-voice');
  const privacy = document.getElementById('privacy-policy-panel');
  if (!launcher || !panel || !form || !messages) return;

  const welcomedKey = 'akhAssistantWelcomed';
  let autoShown = false;
  const hasWelcomed = () => {
    try { return sessionStorage.getItem(welcomedKey) === '1'; } catch (_) { return autoShown; }
  };
  const markWelcomed = () => {
    autoShown = true;
    try { sessionStorage.setItem(welcomedKey, '1'); } catch (_) {}
  };
  const openAssistant = (automatic = false) => {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    if (automatic) markWelcomed();
    if (!automatic) {
      markWelcomed();
      input?.focus();
    }
  };
  const closeAssistant = () => {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    const focusTarget = launcher.hidden
      ? document.querySelector('.homepage-page [data-ask-akh]')
      : launcher;
    focusTarget?.focus();
  };
  launcher.addEventListener('click', () => openAssistant(false));
  /* In-page "Ask our AI assistant" links open the same assistant, even when the corner launcher is off screen. */
  document.addEventListener('click', event => {
    const ask = event.target instanceof Element ? event.target.closest('[data-ask-akh]') : null;
    if (!ask) return;
    event.preventDefault();
    openAssistant(false);
  });
  closeButton?.addEventListener('click', closeAssistant);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) closeAssistant();
  });

  const canGreet = () => {
    if (hasWelcomed() || !panel.hidden || !privacy?.hidden) return false;
    if (document.body.classList.contains('homepage-page') && launcher.hidden) return false;
    if (document.querySelector('dialog[open]')) return false;
    return true;
  };
  const showWelcome = () => {
    if (!canGreet()) return;
    openAssistant(true);
  };
  const greetingTimer = window.setTimeout(showWelcome, 8500);
  const greetAfterScroll = () => {
    if (window.scrollY > 180 && canGreet()) {
      window.clearTimeout(greetingTimer);
      window.removeEventListener('scroll', greetAfterScroll);
      window.setTimeout(showWelcome, 1100);
    }
  };
  window.addEventListener('scroll', greetAfterScroll, { passive: true });
  ['policy-accept-btn', 'policy-reject-btn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => window.setTimeout(showWelcome, 900));
  });

  /* Answer links are written from the site root; pages in subfolders load this script as ../website/js/… */
  const SITE_ROOT = (() => {
    const s = document.currentScript || document.querySelector('script[src*="homepage-assistant.js"]');
    return (s?.getAttribute('src') || '').startsWith('../') ? '../' : '';
  })();
  const addMessage = (text, who = 'assistant', linkLabel = '', href = '') => {
    const bubble = document.createElement('p');
    bubble.className = `assistant-message${who === 'user' ? ' user' : ''}`;
    bubble.textContent = text;
    if (linkLabel && href) {
      const link = document.createElement('a');
      link.className = 'assistant-link';
      link.href = /^(?:[a-z]+:|#|\/)/i.test(href) ? href : SITE_ROOT + href;
      link.textContent = linkLabel;
      bubble.append(document.createElement('br'), link);
    }
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  };

  /* Whole-word matching, so "hair" is never read as "ai" and "maintain" never as "ai". */
  const has = (q, words) => words.some(w => new RegExp(`(^|[^a-z0-9])${w}([^a-z0-9]|$)`).test(q));
  const respond = question => {
    const q = ` ${question.toLowerCase()} `;
    const context = document.body.dataset.assistantContext || 'home';
    if (context === 'learn') {
      if (has(q, ['certificate', 'certificates', 'certification', 'certified', 'partner', 'partners', 'accredited', 'accreditation', 'microsoft', 'google', 'ibm', 'openai', 'provider', 'providers'])) return ['Certificates come from the course provider where they offer one. Provider partnerships aren’t confirmed yet. Register your interest and you’ll hear first when they are.', 'Register your interest', 'learn-with-us.html#interest'];
      if (has(q, ['career', 'careers', 'intern', 'internship', 'internships', 'job', 'jobs', 'role', 'roles', 'placement', 'opportunity', 'opportunities'])) return ['Learners who show strong skills may be considered for internships or roles with AKH, our sister companies or clients. It isn’t guaranteed, but your portfolio project gives you something real to show.', 'See open roles', 'careers.html#open-roles'];
      if (has(q, ['register', 'interest', 'contact', 'email', 'sign up', 'join'])) return ['Register your interest and you’ll be first to know when the paths open, with early-access pricing.', 'Register your interest', 'learn-with-us.html#interest'];
      if (has(q, ['course', 'courses', 'learn', 'learning', 'programme', 'program', 'skill', 'skills', 'training', 'topic', 'topics', 'path', 'paths'])) return ['Four paths: AI and automation, websites and apps, data and analytics, and digital marketing. Each one ends with a portfolio project you can show employers.', 'See the learning paths', 'learn-with-us.html#paths'];
    }
    if (context === 'careers') {
      if (has(q, ['role', 'roles', 'job', 'jobs', 'open', 'vacancy', 'vacancies', 'hiring'])) return ['Two roles are open now: Customer Service Assistant and Software Engineer (React and Laravel).', 'See open roles', '#open-roles'];
    }
    if (has(q, ['estimate', 'estimator', 'save', 'saving', 'savings', 'roi', 'pay for itself'])) return ['That’s a job for our savings estimator: tap, type or talk through three quick questions and you’ll see roughly what the problem costs you and what we’d build.', 'Open the savings estimator', 'index.html#scoper'];
    if (has(q, ['price', 'prices', 'pricing', 'cost', 'costs', 'budget', 'quote', 'how much', 'expensive', 'cheap'])) {
      return ['You get a fixed quote within 48 hours of a free 30-minute call: one price, agreed before any work starts. If an off-the-shelf tool would do the job, we’ll tell you.', 'Get my fixed quote', 'contact-us.html'];
    }
    if (has(q, ['how long', 'timeline', 'timeframe', 'weeks', 'deadline', 'fast', 'quickly'])) {
      return ['Most websites launch in 3–4 weeks, web applications in 8–12 weeks and mobile apps in 10–14 weeks. An AI prototype can be working in 2 weeks.', 'See all services', 'services.html#what-we-build'];
    }
    if (has(q, ['book', 'call', 'meeting', 'consultation', 'consult', 'talk', 'contact', 'demo', 'person', 'human', 'phone'])) {
      return ['Tell us a little about the work on the contact page and someone will reply within one working day. Or call +44 20 4529 0790.', 'Go to the contact page', 'contact-us.html'];
    }
    if (has(q, ['work', 'portfolio', 'examples', 'case study', 'case studies', 'clients', 'projects'])) {
      return ['We’ve built a multi-brand fashion marketplace, a garment manufacturing portal and a GPT-powered shopping assistant for Goddiva.', 'See our work', 'index.html#selected-work'];
    }
    if (has(q, ['event', 'events', 'talk', 'talks', 'speaker', 'speaking', 'keynote', 'conference', 'award', 'awards', 'news', 'press'])) {
      return ['Our founder, Kuganeswaran Thangarajah, speaks at industry events and presents and receives awards. See the latest talks and awards, or invite us to speak at your event.', 'See news and events', 'news-events.html'];
    }
    if (has(q, ['about', 'who are you', 'who is akh', 'company', 'founder', 'team', 'office', 'offices', 'based', 'located', 'location', 'history', 'mission', 'experience'])) {
      return ['AKH IT Solutions has over a decade of experience helping businesses in every industry with software, apps and AI that pay for themselves. Our head office is in Romford, UK, with teams in Sri Lanka and India.', 'About AKH', 'about-us.html'];
    }
    if (has(q, ['retailweave'])) {
      return ['RetailWeave is the retail operations platform built by AKH: orders, stock, returns, sellers and finance in one place. Join the waitlist to try it first.', 'Join the waitlist', 'service/artificial-intelligence.html#retailweave'];
    }
    if (has(q, ['staff', 'staffing', 'developer', 'developers', 'frontend', 'front-end', 'backend', 'back-end', 'specialist', 'specialists', 'talent', 'hire', 'hiring', 'contractor', 'contractors'])) {
      return ['We can add vetted developers and specialists to your team in days, not months, from 1 week, without the cost of a long hire.', 'See staffing', 'services.html#tech-staffing'];
    }
    if (has(q, ['seo', 'google', 'search', 'traffic', 'keyword', 'keywords', 'ranking', 'rank', 'organic'])) {
      return ['Growth SEO gets you found for the searches your buyers actually make, with a monthly report you can read in five minutes and no lock-in.', 'See SEO', 'service/seo-service.html'];
    }
    if (has(q, ['online store', 'store', 'shop', 'ecommerce', 'e-commerce', 'shopify', 'checkout', 'sell online'])) {
      return ['An online store built to sell: fast on mobile, easy to update and set up to be found on Google, typically 3–4 weeks, with a fixed quote first.', 'See websites', 'service/web-site-development.html'];
    }
    if (has(q, ['logo', 'branding', 'brand kit', 'brand identity', 'rebrand', 'graphic', 'graphics', 'print', 'social media', 'flyer', 'flyers'])) {
      return ['A Brand Kit gives you a logo, colours and templates that make you look established everywhere, typically in 2 weeks.', 'See graphic design', 'service/graphic-designing.html'];
    }
    if (has(q, ['web app', 'web application', 'system', 'systems', 'erp', 'crm', 'portal', 'dashboard', 'spreadsheet', 'spreadsheets', 'inventory', 'stock', 'orders', 'booking', 'bookings'])) {
      return ['We replace spreadsheets and manual work with one system your team actually uses, typically 8–12 weeks, with a fixed quote first.', 'See web applications', 'service/web-app-development.html'];
    }
    if (has(q, ['app', 'apps', 'mobile', 'ios', 'android', 'iphone'])) {
      return ['We build iOS and Android apps your customers keep on their home screen, or staff apps that replace paper and chasing, typically 10–14 weeks.', 'See mobile apps', 'service/mobile-app-development.html'];
    }
    if (has(q, ['ai', 'artificial intelligence', 'chatbot', 'chatgpt', 'gpt', 'automation', 'automate', 'assistant', 'machine learning'])) {
      return ['One AI tool that takes repeat work off your team, with a working prototype in 2 weeks on the systems you already use.', 'See the AI Hub', 'service/artificial-intelligence.html'];
    }
    if (has(q, ['website', 'websites', 'site', 'web', 'online store', 'store', 'shop', 'ecommerce', 'e-commerce', 'shopify', 'maintain', 'maintenance', 'update', 'redesign'])) {
      return ['A fast, search-ready website that turns visitors into enquiries, typically 3–4 weeks. We also look after and improve sites you already have.', 'See websites', 'service/web-site-development.html'];
    }
    if (has(q, ['service', 'services', 'build', 'develop', 'help', 'what can you', 'start'])) {
      return ['Tell us the result you need (more customers, less manual work, an app or AI) and we’ll recommend the most affordable thing that works.', 'Find out what we could save you', 'index.html#scoper'];
    }
    return ['I can tell you what we’d build, what it costs and how long it takes. Try asking about websites, apps, AI, SEO or pricing, or answer three quick questions to see what we could save you.', 'Find out what we could save you', 'index.html#scoper'];
  };

  const send = text => {
    const question = String(text || '').trim();
    if (!question) return;
    addMessage(question, 'user');
    input.value = '';
    const [answer, linkLabel, href] = respond(question);
    window.setTimeout(() => addMessage(answer, 'assistant', linkLabel, href), 180);
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    send(input.value);
  });
  prompts?.addEventListener('click', event => {
    const button = event.target.closest('button[data-prompt]');
    if (!button) return;
    if (button.hasAttribute('data-open-scoper')) { event.stopPropagation(); closeAssistant(); window.akhOpenScoper?.(); return; }
    send(button.dataset.prompt);
  });
  /* Links to the scoper inside answers open it in place. */
  messages.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest('a[href$="#scoper"]') : null;
    if (!link || !window.akhOpenScoper) return;
    event.preventDefault();
    closeAssistant();
    window.akhOpenScoper();
  });

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  if (!Recognition) {
    voiceButton.disabled = true;
    voiceButton.title = 'Voice input is unavailable here. You can type instead.';
  } else if (voiceButton) {
    recognition = new Recognition();
    recognition.lang = 'en-GB';
    recognition.interimResults = true;
    recognition.continuous = false;
    /* Words appear in the box as they are spoken (interim results), then settle when final. */
    let voiceBase = '';
    recognition.onstart = () => { voiceBase = input.value.trim(); voiceButton.setAttribute('aria-pressed', 'true'); status.textContent = 'Listening. Your browser may send audio to its speech service for transcription.'; };
    recognition.onresult = event => {
      let spoken = '', done = false;
      for (let i = 0; i < event.results.length; i += 1) { spoken += event.results[i][0].transcript; if (event.results[i].isFinal) done = true; }
      input.value = [voiceBase, spoken.trim()].filter(Boolean).join(' ');
      if (done) { input.focus(); status.textContent = 'Voice input added. Review it, then select Send.'; }
    };
    recognition.onerror = event => { status.textContent = event.error === 'not-allowed' ? 'Microphone access was not allowed. You can type instead.' : 'Voice input stopped. You can type instead.'; };
    recognition.onend = () => voiceButton.setAttribute('aria-pressed', 'false');
    voiceButton.addEventListener('click', () => {
      if (voiceButton.getAttribute('aria-pressed') === 'true') { recognition.stop(); return; }
      status.textContent = 'Starting voice input. Your browser may ask for microphone access.';
      try { recognition.start(); } catch (_) { status.textContent = 'Voice input could not start. You can type instead.'; }
    });
  }

  const newsletter = document.getElementById('preview-newsletter');
  newsletter?.addEventListener('submit', event => event.preventDefault());
  /* Newsletter messages are handled in site-system.js (Round 20). */
})();
