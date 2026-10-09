/* ============================================================================
 * MERIDIAN CHAT — hosted embeddable FAQ assistant
 * ----------------------------------------------------------------------------
 * This is the HOSTED build. It is served from Meridian's own domain and
 * installed on a client's website with ONE line:
 *
 *   <script src="https://YOUR-DOMAIN/embed/chat.js" data-client="ivy-lane" defer></script>
 *
 * The client's web person pastes that into a "custom code" box and is done.
 * They never upload a file, and they never touch it again.
 *
 * WHY IT MATTERS THAT MERIDIAN HOSTS IT
 *   The answers live in clients/<slug>.js on THIS server, not on theirs. When
 *   a salon changes its prices, you edit one file here and every visitor sees
 *   the new answer within minutes. No emailing files, no asking a client to
 *   log in to Squarespace, no waiting on their web guy.
 *
 * HOW THE BOOT WORKS
 *   1. At parse time this file grabs its own <script> tag and reads
 *      data-client (and works out its own folder from its src).
 *   2. It injects clients/<slug>.js, which sets window.MERIDIAN_CHAT_CONFIG.
 *   3. Once that lands, the widget mounts.
 *   Config is loaded with a <script> tag rather than fetch() on purpose:
 *   script tags work cross-origin with no CORS headers to configure, so this
 *   cannot be broken by a host's server settings.
 *
 *   If the config fails to load, the widget does NOT mount. A chat bubble
 *   that opens onto "I don't know" answers is worse than no bubble at all.
 *
 * ATTRIBUTES on the script tag
 *   data-client="ivy-lane"   which config to load from clients/
 *   data-config="https://…"  a full config URL instead (rarely needed)
 *   (neither)                uses window.MERIDIAN_CHAT_CONFIG if the page
 *                            already defines one — the old two-file install
 *
 * TWO ANSWERING MODES
 *
 *   Keyword mode (default, always available)
 *     Matches the question against the `faqs` list in the config. Instant,
 *     free forever, works with no internet, and cannot invent an answer that
 *     isn't in the config. This is the mode a real client site should run.
 *
 *   AI mode (optional)
 *     Sends the question plus the FAQ list to a language model for a more
 *     natural answer. Falls back to keyword mode automatically on any error,
 *     timeout, or missing key — the widget can never end up dead.
 *
 * ISOLATION
 *   Everything renders inside a shadow root, so the host site's CSS cannot
 *   break the widget and the widget's CSS cannot break the host site.
 *
 * SOURCE OF TRUTH
 *   The answering logic here is kept identical to
 *   ../../meridian-chatbot/meridian-chat.js, which is the copy-onto-their-
 *   server version. Only the boot and the branding differ. Fix bugs in both.
 * ==========================================================================*/

(function () {
  'use strict';

  /* ---- Who am I, and where do I live? --------------------------------
     document.currentScript only has a value while this file is being
     parsed, so it has to be read here at the top level - not later, and
     not inside a callback. Everything about where to find the config
     hangs off it.

     The fallback covers a script tag injected by a tag manager, where
     currentScript can be null: we look for any script whose src points
     at this file.
     ------------------------------------------------------------------ */

  const SELF = document.currentScript || (function () {
    const all = document.getElementsByTagName('script');
    for (let i = all.length - 1; i >= 0; i--) {
      if (/\/embed\/chat\.js(\?|$)/.test(all[i].src || '')) return all[i];
    }
    return null;
  })();

  /** The folder this file sits in, with a trailing slash. */
  const BASE = (function () {
    if (!SELF || !SELF.src) return '';
    return SELF.src.replace(/[^/]*$/, '');
  })();

  /* ---- Config, with safe defaults so a partial config file degrades
          to something that still works rather than a crash.

          CFG is filled in at boot, not here, because the config file
          arrives after this one. Everything below closes over it.  ---- */

  let CFG = null;

  function buildConfig(RAW) {
    RAW = RAW || {};
    return {
      business: Object.assign(
        { name: 'our team', phone: '', bookingLink: '', address: '' },
        RAW.business
      ),
      greeting: RAW.greeting || 'Hi! Ask me anything.',
      quickReplies: Array.isArray(RAW.quickReplies) ? RAW.quickReplies : [],
      faqs: Array.isArray(RAW.faqs) ? RAW.faqs : [],
      fallback:
        RAW.fallback ||
        "I'm not sure about that one, sorry! Give us a call and we'll answer properly.",
      ai: Object.assign(
        { enabled: false, provider: 'gemini', apiKey: '', proxyUrl: '',
          model: '', timeoutMs: 8000 },
        RAW.ai
      ),
      brand: Object.assign(
        { gold: '#B88C29', goldDark: '#96701E', navy: '#1B2233',
          position: 'right', teaser: 'Questions? Ask away',
          // Path or URL to the business's own logo, shown in the chat
          // header. Falls back to their initials if unset or if it 404s.
          logo: '',
          // Set false only if a client objects to the credit line.
          poweredBy: true },
        RAW.brand
      ),
    };
  }

  /* ---- Text helpers -------------------------------------------------- */

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** Escape, then linkify URLs and phone numbers so they're tappable. */
  function escRich(v) {
    var out = esc(v);
    out = out.replace(/(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    // Phone numbers like (512) 555-0142 or 512-555-0142
    out = out.replace(/(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g,
      function (m) { return '<a href="tel:' + m.replace(/\D/g, '') + '">' + m + '</a>'; });
    return out;
  }

  /** Fill {phone} / {booking_link} / {business_name} in any answer string. */
  function fill(text) {
    return String(text || '')
      .replace(/\{phone\}/g, CFG.business.phone)
      .replace(/\{booking_link\}/g, CFG.business.bookingLink)
      .replace(/\{business_name\}/g, CFG.business.name)
      .replace(/\{address\}/g, CFG.business.address)
      .trim();
  }

  /* ============================================================
     KEYWORD MATCHING
     ------------------------------------------------------------
     Deliberately simple and predictable. Scores each FAQ against
     the question and returns the best one, IF it clears a
     confidence bar. Below the bar it returns nothing, and the
     widget says it doesn't know rather than guessing — a wrong
     price does more damage than an honest "call us".
     ============================================================ */

  /** Lowercase, strip punctuation, collapse whitespace. */
  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/['’]/g, '')          // don't let "what's" break matching
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Crude stemmer: trims common English endings so "prices" ≈ "price". */
  function stem(word) {
    return word
      .replace(/(ing|edly|ed|ies|es|s)$/, '')
      .replace(/i$/, 'y');
  }

  /** Words too common to carry meaning — ignored when scoring. */
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

  /**
   * Score one FAQ against the question.
   *
   *   +6  the question literally contains a multi-word keyword phrase
   *   +3  a single keyword matches a question word
   *   +1  a word from the answer matches (weak signal, breaks ties)
   */
  function scoreFaq(faq, question) {
    const qNorm = normalize(question);
    const qWords = tokens(question);

    // A question made up entirely of common words - "what do you do" - has no
    // scoring words left after the stop list. Phrase matching can still catch
    // it, so don't bail out here; just let the single-word loop below find
    // nothing. A genuinely empty question still scores zero everywhere.
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

  /** Best FAQ for a question, or null if nothing is confident enough. */
  function matchFaq(question) {
    let best = null;
    let bestScore = 0;

    for (const faq of CFG.faqs) {
      const s = scoreFaq(faq, question);
      if (s > bestScore) { bestScore = s; best = faq; }
    }

    // The confidence bar. 3 = at least one solid keyword hit.
    return bestScore >= 3 ? best : null;
  }

  /* ============================================================
     AI MODE
     ============================================================ */

  /** The FAQ list, flattened into context the model can quote from. */
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

  /**
   * Ask the configured model. Resolves to a string, or null on ANY problem —
   * the caller then falls back to keyword matching, so the widget never dies
   * because an API had a bad day.
   */
  async function askAI(question) {
    const ai = CFG.ai;
    if (!ai.enabled) return null;
    if (!ai.proxyUrl && !ai.apiKey) return null;

    // Abort rather than leave the visitor watching dots forever.
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, ai.timeoutMs || 8000);

    try {
      let url, body, headers = { 'Content-Type': 'application/json' };

      if (ai.proxyUrl) {
        // Production path: our own endpoint holds the key server-side.
        url = ai.proxyUrl;
        body = { question: question, system: systemPrompt() };
      } else if (ai.provider === 'groq') {
        url = 'https://api.groq.com/openai/v1/chat/completions';
        headers.Authorization = 'Bearer ' + ai.apiKey;
        body = {
          model: ai.model || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt() },
            { role: 'user', content: question },
          ],
          max_tokens: 160,
          temperature: 0.3,
        };
      } else {
        // Gemini
        const model = ai.model || 'gemini-2.0-flash';
        url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
              encodeURIComponent(model) + ':generateContent?key=' +
              encodeURIComponent(ai.apiKey);
        body = {
          system_instruction: { parts: [{ text: systemPrompt() }] },
          contents: [{ role: 'user', parts: [{ text: question }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.3 },
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        console.warn('[meridian-chat] AI request failed:', res.status,
                     '— falling back to keyword matching.');
        return null;
      }

      const data = await res.json();

      // Each provider buries the text somewhere different.
      const text =
        (data.reply) ||                                             // our proxy
        (data.choices && data.choices[0] &&
         data.choices[0].message && data.choices[0].message.content) ||  // groq
        (data.candidates && data.candidates[0] && data.candidates[0].content &&
         data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
         data.candidates[0].content.parts[0].text) ||                    // gemini
        null;

      return text ? String(text).trim() : null;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('[meridian-chat] AI error — falling back to keywords.', err);
      }
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ============================================================
     ANSWERING — AI first when on, keywords always as the net
     ============================================================ */

  async function answer(question) {
    const aiText = await askAI(question);
    if (aiText) return { text: aiText, source: 'ai' };

    const faq = matchFaq(question);
    if (faq) return { text: fill(faq.answer), source: 'faq' };

    return { text: fill(CFG.fallback), source: 'fallback' };
  }

  /* ============================================================
     UI
     ============================================================ */

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
        background: linear-gradient(150deg, #E8C874, ${b.gold} 60%, ${b.goldDark});
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
        background: linear-gradient(150deg, #E8C874, ${b.gold});
        display: grid; place-items: center;
        font-weight: 700; font-size: 14px; color: ${b.navy};
        overflow: hidden;
      }
      /* A client logo can be any shape or aspect ratio, so contain it
         rather than cropping someone's wordmark in half. */
      .head .avatar-img {
        width: 100%; height: 100%; object-fit: contain; padding: 5px;
        display: block;
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
      .msg.user a { color: #E8C874; }
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

  /* ---- Meridian's own marks, for the credit line -----------------------
     Resolved from BASE, so this keeps working on whatever domain the site
     ends up on without anything being hardcoded. If BASE is empty (someone
     inlined this file), the credit line just shows no image. */
  const MERIDIAN_LOGO = BASE ? BASE + 'meridian-logo.png' : '';
  const MERIDIAN_URL = BASE ? BASE.replace(/embed\/$/, '') : 'https://meridian.example';

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

  /* ---- Build and mount ------------------------------------------------ */

  function mount() {
    if (document.getElementById('meridian-chat-root')) return; // never twice

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
          <div class="avatar">${
            /* The client's own logo if they gave us one, otherwise their
               initials. Deliberately NOT the Meridian logo: to a visitor
               this is the salon's front desk, not ours. Our credit goes in
               the footer instead. If the image 404s we swap back to
               initials rather than showing a broken-image icon. */
            CFG.brand.logo
              ? `<img src="${esc(CFG.brand.logo)}" alt="" class="avatar-img"
                      onerror="this.parentNode.textContent=${JSON.stringify(initials(CFG.business.name))}">`
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
        <a class="footnote" href="${esc(MERIDIAN_URL)}" target="_blank" rel="noopener noreferrer">
          <img src="${esc(MERIDIAN_LOGO)}" alt="" width="13" height="14">
          <span>Powered by Meridian</span>
        </a>` : ''}
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

    /* ---- Rendering ---- */

    function addMsg(text, who) {
      const el = document.createElement('div');
      el.className = 'msg ' + who;
      el.innerHTML = who === 'bot' ? escRich(text) : esc(text);
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
      // Quick replies only make sense at the start of a conversation.
      if (log.children.length > 1) return;
      CFG.quickReplies.forEach(function (q) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = q;
        b.addEventListener('click', function () { submit(q); });
        quick.appendChild(b);
      });
    }

    /* ---- Sending ---- */

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

      // A short floor on the response time. An instant answer reads as
      // canned; roughly half a second reads as considered. Keyword matching
      // is otherwise literally instantaneous.
      const started = Date.now();
      let result;
      try {
        result = await answer(question);
      } catch (err) {
        console.warn('[meridian-chat]', err);
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

    /* ---- Open / close ---- */

    function open() {
      panel.dataset.open = 'true';
      launcher.style.visibility = 'hidden';
      if (!opened) {
        opened = true;
        addMsg(fill(CFG.greeting), 'bot');
        renderQuick();
      }
      // Don't steal focus on a phone — it pops the keyboard over everything.
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
      // Enter sends, Shift+Enter makes a new line.
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    });

    // Grow the textarea with the text, up to the CSS max-height.
    input.addEventListener('input', function () {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 96) + 'px';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.dataset.open === 'true') close();
    });

    /* ---- Public handle, for the demo page's config panel ---- */
    window.MeridianChat = {
      open: open,
      close: close,
      ask: submit,
      config: CFG,
      /** Exposed so the demo page can show which mode answered. */
      _answer: answer,
      _matchFaq: matchFaq,
    };
  }

  /* ============================================================
     BOOT
     ------------------------------------------------------------
     Work out which config to load, load it, then mount. Every
     failure path ends in "don't mount", never in a half-working
     bubble - see the note at the top of this file.
     ============================================================ */

  /** Mount once the document has a <body> to append to. */
  function mountWhenReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount);
    } else {
      mount();
    }
  }

  function start(raw) {
    CFG = buildConfig(raw);
    mountWhenReady();
  }

  function fail(why) {
    // A console warning, not a thrown error: a broken chat widget must
    // never take a client's website down with it.
    if (window.console && console.warn) {
      console.warn('[meridian-chat] not starting - ' + why);
    }
  }

  function loadConfig(url, done) {
    const tag = document.createElement('script');
    tag.src = url;
    tag.async = true;
    tag.onload = function () { done(window.MERIDIAN_CHAT_CONFIG || null); };
    tag.onerror = function () { done(null); };
    (document.head || document.documentElement).appendChild(tag);
  }

  function boot() {
    // 1. Config already on the page? That's the old two-file install, and
    //    it still works. Nothing to fetch.
    if (window.MERIDIAN_CHAT_CONFIG) return start(window.MERIDIAN_CHAT_CONFIG);

    if (!SELF) return fail('could not find my own <script> tag');

    // 2. An explicit config URL wins over a client slug.
    const explicit = SELF.getAttribute('data-config');
    const client = (SELF.getAttribute('data-client') || '').trim();

    let url = explicit;
    if (!url) {
      if (!client) {
        return fail('no data-client on the script tag, and no config on the page');
      }
      // Slugs become a path, so keep them boring. This is the one place a
      // value off the host page reaches the network.
      if (!/^[a-z0-9][a-z0-9-]*$/.test(client)) {
        return fail('data-client "' + client + '" is not a valid slug ' +
                    '(lowercase letters, numbers and hyphens only)');
      }
      url = BASE + 'clients/' + client + '.js';
    }

    loadConfig(url, function (cfg) {
      if (!cfg) {
        return fail('could not load the config at ' + url +
                    ' - check the file exists and data-client is spelled right');
      }
      start(cfg);
    });
  }

  boot();
})();
