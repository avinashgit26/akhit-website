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

  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("ai-js-enabled");
  const script = document.currentScript;
  const siteRoot = new URL(script?.dataset.siteRoot || "../../", script?.src || window.location.href);
  const toSite = path => new URL(path, siteRoot).href;

  // Progressive WebGL nebula background. The CSS background remains visible
  // if WebGL2 is unavailable or shader setup fails.
  const canvas = document.querySelector(".ai-nebula-canvas");
  if (canvas) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, powerPreference: "low-power" });
    if (gl) {
      const vertexSource = `#version 300 es
        void main() {
          vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
          gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
        }`;
      const fragmentSource = `#version 300 es
        precision highp float;
        uniform vec2 uResolution;
        uniform float uTime;
        uniform float uCell;
        uniform vec2 uPointer;
        uniform float uPointerOn;
        out vec4 outColor;

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        float noise2(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
                     mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        float fbm(vec2 p) {
          float value = 0.0, weight = 0.5;
          for (int i = 0; i < 4; i++) {
            value += noise2(p) * weight;
            p = mat2(1.62, 1.18, -1.18, 1.62) * p + 7.1;
            weight *= 0.5;
          }
          return value;
        }
        void main() {
          vec2 pixel = floor(gl_FragCoord.xy / uCell);
          vec2 center = (pixel + 0.5) * uCell;
          vec2 uv = center / uResolution;
          float aspect = uResolution.x / max(uResolution.y, 1.0);
          vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
          float t = uTime * 0.035;
          vec2 warped = p * vec2(2.8, 2.0);
          warped += 0.42 * vec2(fbm(warped + vec2(t, -t * 0.7)), fbm(warped + vec2(4.3 - t, t)));
          float cloud = fbm(warped + vec2(1.8, -2.6));
          float band = exp(-pow((p.y + p.x * 0.43 + 0.04) * 2.9, 2.0));
          float edge = 1.0 - smoothstep(0.08, 0.78, length(p * vec2(0.75, 1.5)));
          float gas = smoothstep(0.28, 0.79, cloud) * band * edge;

          float pointerGlow = exp(-distance(uv, uPointer) * 12.0) * uPointerOn * 0.22;
          gas = clamp(gas + pointerGlow, 0.0, 1.0);
          vec2 local = fract(gl_FragCoord.xy / uCell) - 0.5;
          float dotRadius = mix(0.12, 0.56, smoothstep(0.06, 0.8, gas));
          float dotShape = 1.0 - smoothstep(dotRadius - 0.035, dotRadius + 0.04, length(local));

          vec3 voidTone = vec3(0.055, 0.059, 0.059);
          vec3 dimTone = vec3(0.161, 0.169, 0.18);
          vec3 violet = vec3(0.176, 0.365, 0.224);
          vec3 cyan = vec3(0.184, 0.51, 0.267);
          vec3 ink = mix(voidTone, dimTone, smoothstep(0.05, 0.75, gas) * 0.8);
          vec3 glow = mix(violet, cyan, smoothstep(0.34, 0.9, uv.x + gas * 0.2));
          vec3 color = mix(ink, glow, dotShape * smoothstep(0.08, 0.72, gas) * 0.9);

          vec2 starCell = floor(gl_FragCoord.xy / (uCell * 3.0));
          float starSeed = hash21(starCell);
          vec2 starLocal = fract(gl_FragCoord.xy / (uCell * 3.0)) - 0.5;
          float star = step(0.991, starSeed) * (1.0 - smoothstep(0.045, 0.11, length(starLocal)));
          float sparkle = step(0.998, starSeed) * (1.0 - smoothstep(0.015, 0.035, min(abs(starLocal.x), abs(starLocal.y))));
          color += vec3(0.537, 0.867, 0.62) * (star + sparkle * 0.42) * (0.65 + 0.35 * sin(uTime * 1.2 + starSeed * 30.0));
          color += vec3(0.125, 0.357, 0.184) * pointerGlow * dotShape;
          outColor = vec4(color, clamp(max(gas * 0.78, star * 0.75 + sparkle * 0.45), 0.0, 0.85));
        }`;

      const compile = (kind, source) => {
        const shader = gl.createShader(kind);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };
      const vertex = compile(gl.VERTEX_SHADER, vertexSource);
      const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
      const program = vertex && fragment ? gl.createProgram() : null;
      if (program) {
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
      }
      if (program && gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const uniforms = Object.fromEntries(["uResolution", "uTime", "uCell", "uPointer", "uPointerOn"].map(name => [name, gl.getUniformLocation(program, name)]));
        const hero = canvas.closest(".ai-hero");
        let pointer = [0.72, 0.48], pointerOn = 0, frame = 0, inView = true, startTime = performance.now(), lastFrame = 0;
        const resize = () => {
          const box = canvas.getBoundingClientRect();
          // The halftone pattern is intentionally low-resolution; capping its
          // render scale keeps the animated shader light on mobile GPUs.
          const dpr = Math.min(window.devicePixelRatio || 1, 1.25) * 0.76;
          const width = Math.max(1, Math.floor(box.width * dpr));
          const height = Math.max(1, Math.floor(box.height * dpr));
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);
          }
          gl.useProgram(program);
          gl.uniform2f(uniforms.uResolution, width, height);
          gl.uniform1f(uniforms.uCell, 7.0 * dpr);
          draw();
        };
        const draw = (now = performance.now()) => {
          if (!reducedMotion.matches && now - lastFrame < 32) {
            frame = requestAnimationFrame(draw);
            return;
          }
          lastFrame = now;
          gl.useProgram(program);
          gl.uniform1f(uniforms.uTime, reducedMotion.matches ? 0 : (now - startTime) / 1000);
          gl.uniform2f(uniforms.uPointer, pointer[0], pointer[1]);
          gl.uniform1f(uniforms.uPointerOn, pointerOn);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          if (inView && !reducedMotion.matches) frame = requestAnimationFrame(draw);
        };
        const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; };
        const start = () => { if (!frame) draw(); };
        hero?.addEventListener("pointermove", event => {
          const rect = canvas.getBoundingClientRect();
          pointer = [(event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height];
          pointerOn = 1;
        }, { passive: true });
        hero?.addEventListener("pointerleave", () => { pointerOn = 0; }, { passive: true });
        if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
        else window.addEventListener("resize", resize, { passive: true });
        if ("IntersectionObserver" in window) {
          new IntersectionObserver(entries => {
            inView = entries[0]?.isIntersecting ?? true;
            inView ? start() : stop();
          }, { threshold: 0.01 }).observe(canvas);
        }
        reducedMotion.addEventListener?.("change", () => { stop(); start(); });
        resize();
      } else {
        canvas.hidden = true;
      }
    } else {
      canvas.hidden = true;
    }
  }

  // The assistant is local and informational; it does
  // not contact a model or send visitor details to a service.
  const launcher = document.getElementById("assistant-launcher");
  const panel = document.getElementById("assistant-panel");
  const closeButton = document.getElementById("assistant-close");
  const input = document.getElementById("assistant-input");
  const form = document.getElementById("assistant-form");
  const messages = document.getElementById("assistant-messages");
  const prompts = document.getElementById("assistant-prompts");
  const status = document.getElementById("assistant-status");
  const voiceButton = document.getElementById("assistant-voice");
  const privacy = document.getElementById("privacy-policy-panel");

  if (launcher && panel && form && messages) {
    const openAssistant = () => {
      panel.hidden = false;
      launcher.setAttribute("aria-expanded", "true");
      input?.focus();
    };
    const closeAssistant = () => {
      panel.hidden = true;
      launcher.setAttribute("aria-expanded", "false");
      launcher.focus();
    };
    launcher.addEventListener("click", openAssistant);
    closeButton?.addEventListener("click", closeAssistant);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) closeAssistant();
    });
    const addMessage = (text, who = "assistant", linkLabel = "", href = "") => {
      const bubble = document.createElement("p");
      bubble.className = `ai-assistant-message${who === "user" ? " user" : ""}`;
      bubble.textContent = text;
      if (linkLabel && href) {
        const link = document.createElement("a");
        link.className = "ai-assistant-link";
        link.href = toSite(href);
        link.textContent = linkLabel;
        bubble.append(document.createElement("br"), link);
      }
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
    };
    const has = (q, words) => words.some(w => new RegExp(`(^|[^a-z0-9])${w}([^a-z0-9]|$)`).test(q));
    const respond = question => {
      const q = ` ${String(question || "").toLowerCase()} `;
      if (has(q, ["price", "prices", "pricing", "cost", "costs", "budget", "quote", "how much"])) return ["An AI Sprint gets you a working prototype in 2 weeks, with a fixed quote agreed first. The free AI fit session tells you whether AI is worth it before you spend anything.", "Book a free AI fit session", "service/ai-fit-session.html"];
      if (has(q, ["book", "call", "meeting", "consult", "consultation", "talk", "contact", "session", "fit session"])) return ["In a free AI fit session we look at one workflow and tell you clearly whether AI belongs there, what it would save and what a first step costs.", "See the AI fit session", "service/ai-fit-session.html"];
      if (has(q, ["safe", "safely", "security", "secure", "privacy", "risk", "risks", "governance", "control"])) return ["Your team keeps the final say. We agree what the AI can access and do, add human review where decisions matter and test it on real examples before it goes live."];
      if (has(q, ["rebuild", "replace", "replacing", "systems", "system", "integrate", "integration", "existing"])) return ["No rebuild needed. We connect AI to the tools you already use and start with one step, so you see the saving before anything bigger changes.", "See how it works", "service/artificial-intelligence.html#ai-opportunities"];
      if (has(q, ["start", "where", "first", "begin"])) return ["Start with the task that eats the most hours. We size the saving, pick the smallest AI step that helps and build a working prototype in 2 weeks.", "Find out what we could save you", "index.html#scoper"];
      if (has(q, ["support", "customers", "customer", "chatbot", "assistant", "assistants"])) return ["An AI assistant can answer routine customer questions 24/7 and pass the rest to your team, like the shopping assistant we built for Goddiva.", "See the Goddiva AI project", "portfolio/goddiva-ai.html"];
      if (has(q, ["invoice", "invoices", "documents", "document", "emails", "email", "forms"])) return ["AI can read invoices and documents and enter the data for you, with a person approving anything important. See the invoice example further down this page.", "See the example", "service/artificial-intelligence.html#ai-fit-session"];
      if (has(q, ["ai", "automation", "automate", "workflow", "capabilities", "hub"])) return ["One AI tool that takes repeat work off your team: customer support, product content, returns analysis or document processing. Working prototype in 2 weeks.", "Find out what we could save you", "index.html#scoper"];
      return ["I can tell you where AI could save your team time, what a first step costs and how we keep it safe. Or answer three quick questions to see the saving.", "Find out what we could save you", "index.html#scoper"];
    };
    const send = text => {
      const question = String(text || "").trim();
      if (!question) return;
      addMessage(question, "user");
      input.value = "";
      const [answer, label, href] = respond(question);
      window.setTimeout(() => addMessage(answer, "assistant", label, href), 160);
    };
    form.addEventListener("submit", event => { event.preventDefault(); send(input?.value); });
    prompts?.addEventListener("click", event => {
      const button = event.target.closest("button[data-prompt]");
      if (button) send(button.dataset.prompt);
    });
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition && voiceButton) {
      voiceButton.disabled = true;
      voiceButton.title = "Voice input is unavailable here. You can type instead.";
    } else if (Recognition && voiceButton) {
      const recognition = new Recognition();
      recognition.lang = "en-GB";
      recognition.interimResults = true;
      recognition.continuous = false;
      let voiceBase = "";
      recognition.onstart = () => { voiceBase = input.value.trim(); voiceButton.setAttribute("aria-pressed", "true"); status.textContent = "Listening. Your browser may send audio to its speech service for transcription."; };
      recognition.onresult = event => {
        let spoken = '', done = false; for (let i = 0; i < event.results.length; i += 1) { spoken += event.results[i][0].transcript; if (event.results[i].isFinal) done = true; }
        input.value = [voiceBase, spoken.trim()].filter(Boolean).join(" ");
        if (done) { input.focus(); status.textContent = "Voice input added. Review it, then select Send."; }
      };
      recognition.onerror = event => { status.textContent = event.error === "not-allowed" ? "Microphone access was not allowed. You can type instead." : "Voice input stopped. You can type instead."; };
      recognition.onend = () => voiceButton.setAttribute("aria-pressed", "false");
      voiceButton.addEventListener("click", () => {
        if (voiceButton.getAttribute("aria-pressed") === "true") { recognition.stop(); return; }
        status.textContent = "Starting voice input. Your browser may ask for microphone access.";
        try { recognition.start(); } catch (_) { status.textContent = "Voice input could not start. You can type instead."; }
      });
    }
  }

  const capabilitySection = document.getElementById("ai-capabilities");
  document.querySelectorAll(
    '.ai-capability-group:not([aria-hidden="true"]) .ai-capability-card, .ai-mobile-group:not([aria-hidden="true"]) .ai-capability-card'
  ).forEach(card => card.tabIndex = 0);
  const capabilitySurfaces = document.querySelectorAll(".ai-capability-streams, .ai-mobile-marquee");
  capabilitySurfaces.forEach(surface => {
    surface.title = "Hover to pause. Click to pause or resume.";
    surface.addEventListener("click", event => {
      if (event.detail === 0 || !capabilitySection) return;
      capabilitySection.classList.toggle("is-click-paused");
    });
  });

  const safeguardItems = document.querySelectorAll(".ai-control-item");
  if ("IntersectionObserver" in window) {
    const safeguardObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in-view");
          safeguardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    safeguardItems.forEach(item => safeguardObserver.observe(item));
  } else {
    safeguardItems.forEach(item => item.classList.add("is-in-view"));
  }

  const newsletter = document.getElementById("preview-newsletter");
  newsletter?.addEventListener("submit", event => event.preventDefault());
  /* Newsletter messages are handled in site-system.js (Round 20). */

  const sessionForm = document.getElementById("ai-fit-preview");
  sessionForm?.addEventListener("submit", event => {
    event.preventDefault();
    if (!sessionForm.reportValidity()) return;
  });
})();
