// Meridian chat widget, hosted build. Install with one tag:
//   <script src="https://meridianaiservices.vercel.app/embed/chat.js" data-client="ivy-lane" defer></script>
// The tag loads clients/<slug>.js (which sets window.Meridian.config), then mounts the widget.
// A config already on the page (window.Meridian.config) is used as is.

(function () {
  'use strict';

  const SELF = document.currentScript;
  const BASE = SELF ? SELF.src.replace(/[^/]*$/, '') : '';

  // A broken widget must never break the host page, so problems are a console warning only.
  function fail(why) {
    console.warn('meridian-chat not starting: ' + why);
  }

  function startWidget() {

    const NS = (window.Meridian = window.Meridian || {});
    const RAW = NS.config || {};

    const CFG = {
      business: Object.assign(
        { name: 'our team', phone: '', bookingLink: '', address: '' },
        RAW.business
      ),
      greeting: RAW.greeting || 'Hi! Ask me anything.',
      quickReplies: Array.isArray(RAW.quickReplies) ? RAW.quickReplies : [],
      faqs: Array.isArray(RAW.faqs) ? RAW.faqs : [],
      fallback: RAW.fallback || 'Not sure on that one. Call us at {phone} or book at {booking_link}.',
      ai: Object.assign(
        { enabled: false, proxyUrl: '', businessId: '', timeoutMs: 8000 },
        RAW.ai
      ),
      brand: Object.assign(
        { gold: '#B88C29', goldDark: '#96701E', goldLight: '', navy: '#1B2233', logoBg: '#FFFFFF',
          position: 'right', teaser: 'Questions? Ask away', logo: '', poweredBy: true },
        RAW.brand
      ),
    };

    function esc(v) {
      return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    const LINK_RE = /(https?:\/\/[^\s<>"']+)|(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g;

    // Builds text nodes and anchors directly so model output never hits innerHTML.
    function appendLinked(el, text) {
      let last = 0;
      let m;
      LINK_RE.lastIndex = 0;
      while ((m = LINK_RE.exec(text))) {
        el.appendChild(document.createTextNode(text.slice(last, m.index)));
        const a = document.createElement('a');
        a.textContent = m[0];
        if (m[1]) {
          a.href = m[1];
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        } else {
          a.href = 'tel:' + m[0].replace(/\D/g, '');
        }
        el.appendChild(a);
        last = m.index + m[0].length;
      }
      el.appendChild(document.createTextNode(text.slice(last)));
    }

    function fill(text) {
      return String(text || '')
        .replace(/\{phone\}/g, CFG.business.phone)
        .replace(/\{booking_link\}/g, CFG.business.bookingLink)
        .replace(/\{business_name\}/g, CFG.business.name)
        .replace(/\{address\}/g, CFG.business.address)
        .trim();
    }

    function normalize(text) {
      return String(text || '')
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Crude stemmer so "prices" matches "price".
    function stem(word) {
      return word
        .replace(/(ing|edly|ed|ies|es|s)$/, '')
        .replace(/i$/, 'y');
    }

    const STOP = new Set(
      ('a an the is are am do does did can could would should i you we they my your ' +
       'me it to for of on at in and or if but so what whats how when where which ' +
       'there here have has get got please hi hello hey thanks thank ok okay just ' +
       'about any some be been was were will')
        .split(' ')
    );

    function tokens(text) {
      return normalize(text)
        .split(' ')
        .filter(function (w) { return w && !STOP.has(w); })
        .map(stem);
    }

    // Phrase hit +6, word hit +3, prefix hit +2, answer-word overlap +1.
    function scoreFaq(faq, question) {
      const qNorm = normalize(question);
      const qWords = tokens(question);

      if (!qNorm) return 0;

      let score = 0;
      const keywords = Array.isArray(faq.keywords) ? faq.keywords : [];

      for (const raw of keywords) {
        const kw = normalize(raw);
        if (!kw) continue;

        if (kw.indexOf(' ') !== -1) {
          // Multi-word phrase: a literal substring hit is a strong signal.
          if (qNorm.indexOf(kw) !== -1) score += 6;
        } else {
          const kwStem = stem(kw);
          for (const w of qWords) {
            if (w === kwStem) { score += 3; break; }
            // Prefix match catches "cancellation" vs "cancel".
            if (w.length > 3 && kwStem.length > 3 &&
                (w.indexOf(kwStem) === 0 || kwStem.indexOf(w) === 0)) {
              score += 2; break;
            }
          }
        }
      }

      // Weak tie-breaker from the answer body.
      const aWords = new Set(tokens(faq.answer));
      for (const w of qWords) if (aWords.has(w)) score += 1;

      return score;
    }

    function matchFaq(question) {
      let best = null;
      let bestScore = 0;

      for (const faq of CFG.faqs) {
        const s = scoreFaq(faq, question);
        if (s > bestScore) { bestScore = s; best = faq; }
      }

      // 3 means at least one whole-keyword hit; below that, admit not knowing.
      return bestScore >= 3 ? best : null;
    }

    function knowledgeBase() {
      const b = CFG.business;
      const lines = [
        'BUSINESS: ' + b.name,
        b.address ? 'ADDRESS: ' + b.address : '',
        b.phone ? 'PHONE: ' + b.phone : '',
        b.bookingLink ? 'BOOKING LINK: ' + b.bookingLink : '',
        '',
        'KNOWN ANSWERS:',
      ].filter(Boolean);

      CFG.faqs.forEach(function (f) {
        lines.push('- ' + (f.id || '') + ': ' + fill(f.answer));
      });
      return lines.join('\n');
    }

    function systemPrompt() {
      return (
        'You are the front desk assistant for ' + CFG.business.name + ', ' +
        'answering questions from customers on their website.\n\n' +
        knowledgeBase() + '\n\n' +
        'RULES:\n' +
        '1. Answer ONLY from the information above. Never invent prices, hours, ' +
        'policies or services.\n' +
        '2. If the information above does not cover the question, say you are ' +
        'not sure and point them to the phone number or booking link. Do not guess.\n' +
        '3. Be warm, brief and human. Two sentences maximum. No bullet points, ' +
        'no corporate tone, no emoji.\n' +
        '4. Speak as "we", as a member of staff would.'
      );
    }

    // Resolves to null on any failure so the caller falls back to keywords.
    async function askAI(question) {
      const ai = CFG.ai;
      if (!ai.enabled || !ai.proxyUrl) return null;

      const controller = new AbortController();
      const timer = setTimeout(function () { controller.abort(); }, ai.timeoutMs);
      const body = { question: question };
      if (ai.businessId) body.business = ai.businessId;

      try {
        const res = await fetch(ai.proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.reply ? String(data.reply).trim() : null;
      } catch (err) {
        return null;
      } finally {
        clearTimeout(timer);
      }
    }

    async function answer(question) {
      const aiText = await askAI(question);
      if (aiText) return { text: aiText, source: 'ai' };

      const faq = matchFaq(question);
      if (faq) return { text: fill(faq.answer), source: 'faq' };

      return { text: fill(CFG.fallback), source: 'fallback' };
    }

    function styles() {
      const b = CFG.brand;
      const side = b.position === 'left' ? 'left' : 'right';

      return `
      :host { all: initial; }
      * { box-sizing: border-box; margin: 0; padding: 0; }

      .root {
        position: fixed;
        ${side}: 20px;
        bottom: 20px;
        z-index: 2147483000;
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
                     Roboto, Helvetica, Arial, sans-serif;
        font-size: 15px;
        line-height: 1.5;
        color: ${b.navy};
      }

      /* ---- Launcher ---- */
      .launcher {
        display: flex; align-items: center; gap: 10px;
        flex-direction: ${side === 'left' ? 'row-reverse' : 'row'};
      }
      .teaser {
        background: #fff;
        border: 1px solid #E9E4DA;
        border-radius: 999px;
        padding: 8px 15px;
        font-size: 13.5px; font-weight: 500;
        color: ${b.navy};
        box-shadow: 0 6px 20px rgba(27,34,51,0.12);
        cursor: pointer;
        white-space: nowrap;
        animation: rise 0.5s cubic-bezier(0.16,1,0.3,1) 1.2s both;
      }
      .bubble-btn {
        width: 58px; height: 58px; border-radius: 50%;
        border: none; cursor: pointer; flex: none;
        background: linear-gradient(150deg, ${b.goldLight || b.gold}, ${b.gold} 60%, ${b.goldDark});
        box-shadow: 0 8px 26px rgba(184,140,41,0.42);
        display: grid; place-items: center;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }
      .bubble-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(184,140,41,0.5); }
      .bubble-btn:active { transform: translateY(0); }
      .bubble-btn svg { width: 26px; height: 26px; color: ${b.navy}; }
      @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }

      /* ---- Panel ---- */
      .panel {
        position: absolute; bottom: 0; ${side}: 0;
        width: 370px; max-width: calc(100vw - 40px);
        height: 540px; max-height: calc(100vh - 40px);
        background: #FBFAF7;
        border: 1px solid #E9E4DA;
        border-radius: 20px;
        box-shadow: 0 28px 70px rgba(27,34,51,0.26);
        display: flex; flex-direction: column;
        overflow: hidden;
        transform-origin: bottom ${side};
        opacity: 0; transform: scale(0.92) translateY(12px);
        pointer-events: none;
        transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1);
      }
      .panel[data-open="true"] { opacity: 1; transform: none; pointer-events: auto; }

      .head {
        background: ${b.navy};
        color: #fff;
        padding: 15px 16px;
        display: flex; align-items: center; gap: 11px;
        flex: none;
      }
      .head .avatar {
        width: 38px; height: 38px; border-radius: 50%; flex: none;
        background: linear-gradient(150deg, ${b.goldLight || b.gold}, ${b.gold});
        display: grid; place-items: center;
        font-weight: 700; font-size: 14px; color: ${b.navy};
        overflow: hidden;
      }
      /* A client logo can be any shape or aspect ratio, so contain it
         rather than cropping someone's wordmark in half. */
      .head .avatar-img {
        width: 100%; height: 100%; object-fit: contain; padding: 7px;
        display: block;
      }
      /* With a real logo: a solid circle in the logo's own colour, and a
         thin gold ring so it still reads against the navy header. */
      .head .avatar.has-logo {
        width: 42px; height: 42px;
        background: ${b.logoBg};
        box-shadow: 0 0 0 1.5px ${b.gold}, 0 2px 8px rgba(0,0,0,0.25);
      }
      .head .who { font-weight: 600; font-size: 14.5px; }
      .head .status { font-size: 12px; opacity: 0.66; display: flex; align-items: center; gap: 5px; }
      .head .status::before {
        content: ''; width: 6px; height: 6px; border-radius: 50%;
        background: #6FCB9F; display: block;
      }
      .close {
        margin-left: auto; background: none; border: none; cursor: pointer;
        color: rgba(255,255,255,0.7); font-size: 24px; line-height: 1;
        padding: 4px 6px; border-radius: 8px;
      }
      .close:hover { color: #fff; background: rgba(255,255,255,0.1); }

      .log {
        flex: 1; overflow-y: auto;
        padding: 16px 14px;
        display: flex; flex-direction: column; gap: 10px;
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }

      /* overflow-wrap: a full URL in an answer is one unbreakable "word"
         and would otherwise run straight out of the bubble. */
      .msg { max-width: 84%; font-size: 14.5px; line-height: 1.5; overflow-wrap: break-word; }
      .msg.bot {
        align-self: flex-start;
        background: #fff; border: 1px solid #E9E4DA;
        border-radius: 16px 16px 16px 5px;
        padding: 11px 14px;
        box-shadow: 0 2px 10px rgba(27,34,51,0.05);
        animation: pop 0.32s cubic-bezier(0.16,1,0.3,1);
      }
      .msg.user {
        align-self: flex-end;
        background: ${b.navy}; color: #fff;
        border-radius: 16px 16px 5px 16px;
        padding: 11px 14px;
        animation: pop 0.32s cubic-bezier(0.16,1,0.3,1);
      }
      .msg a { color: ${b.goldDark}; font-weight: 600; }
      .msg.user a { color: ${b.goldLight || '#fff'}; }
      @keyframes pop {
        from { opacity: 0; transform: translateY(9px) scale(0.97); }
        to   { opacity: 1; transform: none; }
      }

      .typing {
        align-self: flex-start;
        background: #fff; border: 1px solid #E9E4DA;
        border-radius: 16px 16px 16px 5px;
        padding: 13px 16px;
        display: flex; gap: 4px;
      }
      .typing i {
        width: 6px; height: 6px; border-radius: 50%; background: #8A90A0;
        animation: bob 1.2s infinite;
      }
      .typing i:nth-child(2) { animation-delay: 0.15s; }
      .typing i:nth-child(3) { animation-delay: 0.3s; }
      @keyframes bob {
        0%,60%,100% { opacity: 0.3; transform: translateY(0); }
        30%         { opacity: 1; transform: translateY(-4px); }
      }

      .quick { display: flex; flex-wrap: wrap; gap: 7px; padding: 0 14px 10px; flex: none; }
      .quick button {
        font: inherit; font-size: 13px;
        background: #fff; border: 1px solid #E9E4DA; color: #4A5163;
        border-radius: 999px; padding: 7px 13px; cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      }
      .quick button:hover {
        background: #F3E9D2; border-color: ${b.gold}; color: ${b.goldDark};
      }

      .composer {
        display: flex; gap: 9px; align-items: flex-end;
        padding: 12px 14px;
        border-top: 1px solid #E9E4DA;
        background: #fff;
        flex: none;
      }
      .composer textarea {
        flex: 1; font: inherit;
        font-size: 16px;   /* 16px stops iOS zooming the page on focus */
        border: 1px solid #E9E4DA; border-radius: 14px;
        padding: 10px 13px;
        resize: none; max-height: 96px; min-height: 42px;
        background: #FBFAF7; color: ${b.navy};
        font-family: inherit;
      }
      .composer textarea:focus { outline: 2px solid ${b.gold}; outline-offset: -1px; }
      .send {
        width: 42px; height: 42px; flex: none;
        border-radius: 50%; border: none; cursor: pointer;
        background: ${b.gold};
        display: grid; place-items: center;
        transition: background 0.15s ease, opacity 0.15s ease;
      }
      .send:hover { background: ${b.goldDark}; }
      .send:disabled { opacity: 0.4; cursor: default; }
      .send svg { width: 19px; height: 19px; color: #fff; }

      .footnote {
        display: flex; align-items: center; justify-content: center; gap: 5px;
        font-size: 11px; color: #8A90A0; text-decoration: none;
        padding: 0 14px 10px; flex: none;
      }
      .footnote:hover { color: ${b.gold}; }
      .footnote img { display: block; opacity: 0.75; }
      .footnote:hover img { opacity: 1; }

      /* ---- Phones: go full screen, it's far easier to type in ---- */
      @media (max-width: 480px) {
        .root { ${side}: 14px; bottom: 14px; }
        .panel {
          position: fixed; inset: 0;
          width: 100vw; max-width: 100vw;
          height: 100dvh; max-height: 100dvh;
          border-radius: 0; border: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition-duration: 0.01ms !important; }
      }
    `;
    }

    // Inlined so the install stays two files.
    const MERIDIAN_LOGO = 'data:image/png;base64,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';

    const ICON_CHAT =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 ' +
      '8.5 8.5 0 0 1-3.8-.9L3 20.5l1.6-4.9A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z"/></svg>';

    const ICON_SEND =
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4 20.85 12.9a1 1 0 0 0 ' +
      '0-1.84L3.4 3.6a1 1 0 0 0-1.39.91L2 9.12c0 .5.37.93.87 1L17 12 2.87 13.88c-.5.07-.87.5' +
      '-.87 1l.01 4.61a1 1 0 0 0 1.39.91Z"/></svg>';

    function initials(name) {
      return String(name || '?').trim().split(/\s+/).slice(0, 2)
        .map(function (w) { return w[0]; }).join('').toUpperCase() || '?';
    }

    function mount() {
      if (document.getElementById('meridian-chat-root')) return;

      const host = document.createElement('div');
      host.id = 'meridian-chat-root';
      document.body.appendChild(host);

      const root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;

      const style = document.createElement('style');
      style.textContent = styles();
      root.appendChild(style);

      const wrap = document.createElement('div');
      wrap.className = 'root';
      wrap.innerHTML = `
        <div class="panel" data-open="false" role="dialog" aria-label="Chat with ${esc(CFG.business.name)}">
          <div class="head">
            <div class="avatar${CFG.brand.logo ? ' has-logo' : ''}">${
              CFG.brand.logo
                ? `<img src="${esc(CFG.brand.logo)}" alt="" class="avatar-img"
                        onerror="this.parentNode.classList.remove('has-logo');this.parentNode.textContent=${JSON.stringify(initials(CFG.business.name))}">`
                : esc(initials(CFG.business.name))
            }</div>
            <div>
              <div class="who">${esc(CFG.business.name)}</div>
              <div class="status">Usually replies instantly</div>
            </div>
            <button class="close" aria-label="Close chat">&times;</button>
          </div>
          <div class="log" id="log" role="log" aria-live="polite"></div>
          <div class="quick" id="quick"></div>
          <div class="composer">
            <textarea id="input" rows="1" placeholder="Ask a question..."
                      aria-label="Your question"></textarea>
            <button class="send" id="send" aria-label="Send">${ICON_SEND}</button>
          </div>
          ${CFG.brand.poweredBy ? `
          <div class="footnote">
            <img src="${MERIDIAN_LOGO}" alt="" width="13" height="14">
            <span>Powered by Meridian</span>
          </div>` : ''}
        </div>

        <div class="launcher">
          ${CFG.brand.teaser ? `<div class="teaser" id="teaser">${esc(CFG.brand.teaser)}</div>` : ''}
          <button class="bubble-btn" id="open" aria-label="Open chat">${ICON_CHAT}</button>
        </div>
      `;
      root.appendChild(wrap);

      const panel = root.querySelector('.panel');
      const log = root.querySelector('#log');
      const input = root.querySelector('#input');
      const sendBtn = root.querySelector('#send');
      const quick = root.querySelector('#quick');
      const launcher = root.querySelector('.launcher');

      let opened = false;
      let thinking = false;

      function addMsg(text, who) {
        const el = document.createElement('div');
        el.className = 'msg ' + who;
        if (who === 'bot') appendLinked(el, text);
        else el.textContent = text;
        log.appendChild(el);
        log.scrollTop = log.scrollHeight;
        return el;
      }

      function showTyping() {
        const el = document.createElement('div');
        el.className = 'typing';
        el.id = 'typing';
        el.innerHTML = '<i></i><i></i><i></i>';
        log.appendChild(el);
        log.scrollTop = log.scrollHeight;
      }
      function hideTyping() {
        const t = root.querySelector('#typing');
        if (t) t.remove();
      }

      function renderQuick() {
        quick.innerHTML = '';
        if (log.children.length > 1) return;
        CFG.quickReplies.forEach(function (q) {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = q;
          b.addEventListener('click', function () { submit(q); });
          quick.appendChild(b);
        });
      }

      async function submit(text) {
        const question = String(text != null ? text : input.value).trim();
        if (!question || thinking) return;

        thinking = true;
        sendBtn.disabled = true;
        input.value = '';
        input.style.height = 'auto';

        addMsg(question, 'user');
        quick.innerHTML = '';
        showTyping();

        // A short floor so instant keyword answers do not read as canned.
        const started = Date.now();
        let result;
        try {
          result = await answer(question);
        } catch (err) {
          result = { text: fill(CFG.fallback), source: 'fallback' };
        }
        const wait = Math.max(0, 450 - (Date.now() - started));
        setTimeout(function () {
          hideTyping();
          addMsg(result.text, 'bot');
          thinking = false;
          sendBtn.disabled = false;
        }, wait);
      }

      function open() {
        panel.dataset.open = 'true';
        launcher.style.visibility = 'hidden';
        if (!opened) {
          opened = true;
          addMsg(fill(CFG.greeting), 'bot');
          renderQuick();
        }
        // Focusing on a phone pops the keyboard over the panel.
        if (window.matchMedia('(min-width: 481px)').matches) {
          setTimeout(function () { input.focus(); }, 220);
        }
      }

      function close() {
        panel.dataset.open = 'false';
        launcher.style.visibility = 'visible';
      }

      root.querySelector('#open').addEventListener('click', open);
      root.querySelector('.close').addEventListener('click', close);
      const teaser = root.querySelector('#teaser');
      if (teaser) teaser.addEventListener('click', open);

      sendBtn.addEventListener('click', function () { submit(); });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submit();
        }
      });

      input.addEventListener('input', function () {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 96) + 'px';
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && panel.dataset.open === 'true') close();
      });

      NS.open = open;
      NS.close = close;
      NS.ask = submit;
    }

    // Paste the output into the proxy's SYSTEM_PROMPT so the server holds it.
    NS.systemPrompt = systemPrompt;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount);
    } else {
      mount();
    }
  }

  if (window.Meridian && window.Meridian.config) return startWidget();
  if (!SELF) return fail('could not find own script tag');
  const client = (SELF.getAttribute('data-client') || '').trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(client)) return fail('missing or invalid data-client');

  const tag = document.createElement('script');
  tag.src = BASE + 'clients/' + client + '.js';
  tag.async = true;
  tag.onload = function () {
    if (window.Meridian && window.Meridian.config) startWidget();
    else fail('config for "' + client + '" did not set window.Meridian.config');
  };
  tag.onerror = function () { fail('could not load config for "' + client + '"'); };
  document.head.appendChild(tag);
})();
