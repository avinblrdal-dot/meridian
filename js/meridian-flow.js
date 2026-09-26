/* ============================================================================
 * MERIDIAN — "Missed call to recovered booking" animation
 * ----------------------------------------------------------------------------
 * A single self-contained file. No dependencies, no build step, no framework.
 *
 * HOW TO EMBED
 *
 *   <div data-meridian-flow></div>
 *   <script src="meridian-flow.js"></script>
 *
 * That's it. The script finds the div, injects its own styles into a shadow
 * root (so it cannot collide with the host page's CSS), and starts looping.
 *
 * OPTIONS — set as data attributes on the container:
 *
 *   data-business="Ivy Lane Studio"   Name shown in the animation
 *   data-theme="dark"                 For navy sections. Default is light.
 *   data-autoplay="false"             Don't start until scrolled into view
 *   data-pause-on-hover="false"       Keep running when hovered
 *   data-speed="1.25"                 Playback multiplier (1 = normal)
 *   data-loop="false"                 Play once and stop on the final frame
 *
 * PROGRAMMATIC CONTROL — useful for the GIF exporter:
 *
 *   window.MeridianFlow.instances[0].goToStep(2)   jump to a step
 *   window.MeridianFlow.instances[0].pause()
 *   window.MeridianFlow.instances[0].play()
 *
 * ACCESSIBILITY
 *   Respects prefers-reduced-motion: the animation still advances through the
 *   four steps so the story is told, but the movement is cross-fades rather
 *   than travel. A text summary sits behind it for screen readers.
 * ==========================================================================*/

(function () {
  'use strict';

  /* ---- Brand tokens --------------------------------------------------
     Lifted from the Meridian marketing site so the embed matches the page
     it lands on. Change these four and the whole thing re-themes.        */
  const BRAND = {
    gold: '#B88C29',
    goldLight: '#E8C874',
    goldSoft: '#F3E9D2',
    navy: '#1B2233',
    navySoft: '#2C3448',
    ink: '#4A5163',
    line: '#E9E4DA',
    cream: '#F6F2EA',
    offwhite: '#FBFAF7',
    white: '#FFFFFF',
    green: '#1F7A4D',
    greenSoft: '#E6F4EC',
  };

  /* ---- The Meridian mark ---------------------------------------------
     Inlined as a data URI rather than loaded from a path, deliberately.
     This file gets copied around - onto the marketing site, into the GIF
     exporter, potentially onto a client page - and a relative image path
     would break in at least one of those places. 1.7KB is a cheap price
     for the file staying genuinely self-contained.

     Regenerate from assets/meridian-logo.png if the logo ever changes:
       python3 -c "from PIL import Image; import io,base64; \
         im=Image.open('meridian-logo.png').convert('RGBA'); \
         im.thumbnail((96,96), Image.LANCZOS); b=io.BytesIO(); \
         im.quantize(colors=32, method=Image.FASTOCTREE).save(b,'PNG',optimize=True); \
         print(base64.b64encode(b.getvalue()).decode())"
     ------------------------------------------------------------------- */
  const LOGO = 'data:image/png;base64,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';

  /* ---- The four beats of the story ----------------------------------
     `hold` is how long each step sits on screen, in ms, before the next
     one begins. Tuned so the whole loop is ~13s: long enough to read,
     short enough that a visitor sees the payoff before scrolling past. */
  const STEPS = [
    {
      key: 'ring',
      label: 'A customer calls',
      caption: "You're with a client. The phone rings out.",
      hold: 3000,
    },
    {
      key: 'detect',
      label: 'Meridian notices',
      caption: 'We catch the missed call the second it happens.',
      hold: 2600,
    },
    {
      key: 'text',
      label: 'They get a text back',
      caption: 'Within seconds — before they call anyone else.',
      hold: 4200,
    },
    {
      key: 'booked',
      label: 'The booking is saved',
      caption: 'They tap the link and book themselves in.',
      hold: 3400,
    },
  ];

  /* ---- Stylesheet ----------------------------------------------------
     Injected into a shadow root, so `.card` here can never fight a
     `.card` on the host page.                                           */
  function styles() {
    return `
      :host {
        display: block;
        container-type: inline-size;
        /* Font is inherited from the host page where possible, with a
           safe stack behind it. The embed never loads its own webfont —
           that would be a network request a marketing embed can't justify. */
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
                     Roboto, Helvetica, Arial, sans-serif;

        /* ---- Themeable surface tokens ----
           The Meridian site alternates cream and navy sections, so the embed
           has to sit on either. Only these change between themes; the phone
           mockups stay light in both, because a phone screen is a phone
           screen regardless of the page around it. */
        --m-bg:        ${BRAND.offwhite};   /* outer panel */
        --m-bd:        ${BRAND.line};       /* outer panel border */
        --m-fg:        ${BRAND.navy};       /* headings, strong text */
        --m-fg2:       ${BRAND.ink};        /* captions, secondary text */
        --m-card:      ${BRAND.white};      /* raised cards inside the stage */
        --m-card-bd:   ${BRAND.line};
        --m-shadow:    rgba(27,34,51,0.10);
        --m-track:     ${BRAND.line};       /* progress track */
        --m-wash:      ${BRAND.goldSoft};   /* corner glow */
        --m-wash-op:   0.75;
        --m-halo:      ${BRAND.goldSoft};   /* circle behind the handset icon */
      }

      /* Dark variant: <div data-meridian-flow data-theme="dark"> */
      :host([data-theme="dark"]) {
        --m-bg:        ${BRAND.navy};
        --m-bd:        rgba(255,255,255,0.10);
        --m-fg:        #EDEFF4;
        --m-fg2:       #A8AEBF;
        --m-card:      ${BRAND.navySoft};
        --m-card-bd:   rgba(255,255,255,0.09);
        --m-shadow:    rgba(0,0,0,0.35);
        --m-track:     rgba(255,255,255,0.13);
        --m-wash:      rgba(184,140,41,0.30);
        --m-wash-op:   1;
        --m-halo:      rgba(184,140,41,0.20);
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      .wrap {
        position: relative;
        background: var(--m-bg);
        border: 1px solid var(--m-bd);
        border-radius: 20px;
        padding: 30px 26px 26px;
        overflow: hidden;
        color: var(--m-fg);
      }
      /* A very soft gold wash in the corner — warmth, not glow. */
      .wrap::before {
        content: '';
        position: absolute;
        top: -120px; right: -100px;
        width: 320px; height: 320px;
        background: radial-gradient(circle, var(--m-wash) 0%, transparent 70%);
        opacity: var(--m-wash-op);
        pointer-events: none;
      }

      .head { position: relative; text-align: center; margin-bottom: 24px; }
      .eyebrow {
        font-size: 11px; font-weight: 700; letter-spacing: 0.18em;
        text-transform: uppercase; color: ${BRAND.gold};
        margin-bottom: 8px;
      }
      .title {
        font-size: clamp(19px, 3.6cqi, 25px);
        font-weight: 600; letter-spacing: -0.015em; line-height: 1.2;
      }

      /* ---- The stage ---- */
      .stage {
        position: relative;
        height: 250px;
        display: grid;
        place-items: center;
        margin-bottom: 22px;
      }
      /* Scenes stack in the same box, so a symmetric cross-fade superimposes
         two of them and reads as a smudge — very visible once the animation is
         flattened into GIF frames. Instead the OUTGOING scene leaves quickly
         (0.24s) and the INCOMING one waits for it (0.22s delay) before easing
         in. Net effect: a clean hand-off, no double exposure, and the same
         overall pacing. */
      .scene {
        position: absolute; inset: 0;
        display: grid; place-items: center;
        opacity: 0;
        transform: translateY(14px) scale(0.97);
        transition: opacity 0.24s ease, transform 0.24s ease;
        pointer-events: none;
      }
      .scene[data-on="true"] {
        opacity: 1;
        transform: none;
        transition: opacity 0.42s ease 0.22s,
                    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.22s;
      }

      /* ---- Scene 1 + 2: the salon phone ---- */
      .phone-card {
        background: var(--m-card);
        border: 1px solid var(--m-card-bd);
        border-radius: 18px;
        padding: 22px 26px;
        box-shadow: 0 12px 36px var(--m-shadow);
        text-align: center;
        min-width: 210px;
      }
      .handset {
        width: 62px; height: 62px;
        margin: 0 auto 14px;
        border-radius: 50%;
        background: var(--m-halo);
        display: grid; place-items: center;
        color: ${BRAND.gold};
        position: relative;
      }
      .handset svg { width: 28px; height: 28px; }
      /* Ripple rings = a ringing phone, without a single cliché */
      .ripple {
        position: absolute; inset: 0;
        border-radius: 50%;
        border: 2px solid ${BRAND.gold};
        opacity: 0;
      }
      .scene[data-scene="ring"][data-on="true"] .ripple { animation: ripple 1.8s ease-out infinite; }
      .scene[data-scene="ring"][data-on="true"] .ripple:nth-child(2) { animation-delay: 0.6s; }
      .scene[data-scene="ring"][data-on="true"] .handset { animation: wobble 1.8s ease-in-out infinite; }
      @keyframes ripple {
        0%   { transform: scale(1);   opacity: 0.55; }
        100% { transform: scale(1.9); opacity: 0; }
      }
      @keyframes wobble {
        0%, 60%, 100% { transform: rotate(0); }
        10%, 30%      { transform: rotate(-9deg); }
        20%, 40%      { transform: rotate(9deg); }
      }

      .phone-label { font-size: 14px; font-weight: 600; }
      .phone-sub {
        font-size: 12.5px; color: var(--m-fg2); margin-top: 3px;
        font-variant-numeric: tabular-nums;
      }
      /* The "missed call" stamp. Fades in partway through scene 1, so the
         first beat actually SHOWS the miss rather than just the ring — that
         is the moment the whole product exists to solve. */
      .missed {
        display: inline-block; margin-top: 12px;
        font-size: 10.5px; font-weight: 700; letter-spacing: 0.09em;
        text-transform: uppercase;
        color: #C24A4A; background: rgba(194,74,74,0.12);
        border: 1px solid rgba(194,74,74,0.28);
        padding: 4px 11px; border-radius: 999px;
        opacity: 0; transform: translateY(5px);
      }
      .scene[data-scene="ring"][data-on="true"] .missed {
        /* The delay is set from JS as a fraction of scene 1's hold time, so it
           stays correctly placed within the scene at any playback speed.
           Hard-coding it in seconds here would make the stamp appear at the
           very last moment once data-speed goes above 1. */
        animation: missedIn 0.45s cubic-bezier(0.16,1,0.3,1)
                   var(--m-missed-delay, 1860ms) forwards;
      }
      @keyframes missedIn { to { opacity: 1; transform: none; } }

      /* ---- Still-frame mode ----
         Used by the GIF exporter to grab a deterministic static fallback
         image. Freezes the ambient loops (ripple, handset wobble) so the
         capture can't land on a frame where the phone icon is mid-tilt, and
         forces the "missed call" stamp fully in. Never set in normal use. */
      :host([data-still]) .ripple,
      :host([data-still]) .handset { animation: none !important; }
      :host([data-still]) .missed {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
      }

      /* ---- Scene 2: detection ---- */
      .detect-row { display: flex; align-items: center; gap: 16px; }
      .node {
        width: 74px; height: 74px; border-radius: 50%;
        display: grid; place-items: center;
        background: var(--m-card);
        border: 1px solid var(--m-card-bd);
        box-shadow: 0 8px 24px var(--m-shadow);
        flex: none;
      }
      .node.brandmark {
        background: ${BRAND.navy};
        border-color: ${BRAND.navy};
        position: relative;
      }
      /* The real Meridian mark. The class is still called "ring" so the
         step-2 animation that scales this node in still targets it.
         (No backticks in here - this comment lives inside a template
         literal, and one would end it.) */
      .brandmark .ring {
        width: 30px; height: 30px; position: relative;
        display: block;
        background-image: url("${LOGO}");
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
      }
      .node svg { width: 30px; height: 30px; color: ${BRAND.gold}; }

      .wire {
        width: 54px; height: 2px;
        background: var(--m-track);
        position: relative; border-radius: 2px;
      }
      .wire::after {
        content: ''; position: absolute; inset: 0;
        background: ${BRAND.gold};
        transform-origin: left;
        transform: scaleX(0);
      }
      .scene[data-scene="detect"][data-on="true"] .wire::after { animation: fill 0.7s ease forwards; }
      .scene[data-scene="detect"][data-on="true"] .wire.delay::after { animation-delay: 0.45s; }
      @keyframes fill { to { transform: scaleX(1); } }

      /* ---- Scene 3: the text ---- */
      .msg-phone {
        width: 236px;
        background: ${BRAND.navy};
        border-radius: 26px;
        padding: 10px;
        box-shadow: 0 18px 44px rgba(27,34,51,0.22);
      }
      .msg-screen {
        background: ${BRAND.cream};
        border-radius: 19px;
        padding: 12px 11px 14px;
        min-height: 176px;
        display: flex; flex-direction: column;
      }
      .notch {
        width: 62px; height: 4px; border-radius: 999px;
        background: rgba(255,255,255,0.3);
        margin: 0 auto 8px;
      }
      .msg-from {
        text-align: center; padding-bottom: 9px; margin-bottom: 10px;
        border-bottom: 1px solid ${BRAND.line};
        font-size: 11.5px; font-weight: 600; color: ${BRAND.navy};
      }
      .bubble {
        background: ${BRAND.white};
        border: 1px solid ${BRAND.line};
        border-radius: 14px 14px 14px 4px;
        padding: 10px 12px;
        font-size: 12px; line-height: 1.5;
        color: ${BRAND.navy};
        box-shadow: 0 3px 12px rgba(27,34,51,0.07);
        margin-top: auto;
        opacity: 0; transform: translateY(12px);
      }
      .scene[data-scene="text"][data-on="true"] .bubble { animation: bubbleIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.35s forwards; }
      @keyframes bubbleIn { to { opacity: 1; transform: none; } }
      .bubble .link { color: ${BRAND.gold}; font-weight: 600; }
      .stamp {
        font-size: 9.5px; color: #8A90A0; margin-top: 7px;
        letter-spacing: 0.03em;
      }

      /* ---- Scene 4: booked ---- */
      .booked-card {
        background: var(--m-card);
        border: 1px solid var(--m-card-bd);
        border-radius: 18px;
        padding: 24px 30px;
        box-shadow: 0 14px 40px var(--m-shadow);
        text-align: center;
        min-width: 224px;
      }
      .tick {
        width: 62px; height: 62px; margin: 0 auto 14px;
        border-radius: 50%;
        background: ${BRAND.greenSoft};
        display: grid; place-items: center;
      }
      :host([data-theme="dark"]) .tick { background: rgba(93,199,145,0.16); }
      :host([data-theme="dark"]) .tick path { stroke: #6FCB9F; }
      .tick svg { width: 30px; height: 30px; }
      .tick path {
        stroke: ${BRAND.green}; stroke-width: 2.6; fill: none;
        stroke-linecap: round; stroke-linejoin: round;
        stroke-dasharray: 30; stroke-dashoffset: 30;
      }
      .scene[data-scene="booked"][data-on="true"] .tick path { animation: draw 0.55s ease 0.25s forwards; }
      @keyframes draw { to { stroke-dashoffset: 0; } }
      .booked-title { font-size: 16px; font-weight: 600; }
      .booked-sub { font-size: 12.5px; color: var(--m-fg2); margin-top: 4px; }
      .booked-meta {
        margin-top: 14px; padding-top: 12px;
        border-top: 1px solid var(--m-card-bd);
        font-size: 11.5px; color: var(--m-fg2);
        display: flex; justify-content: space-between; gap: 12px;
      }
      .booked-meta b { color: var(--m-fg); font-weight: 600; }

      /* ---- Caption + progress ---- */
      .caption {
        position: relative;
        text-align: center;
        font-size: 14px;
        color: var(--m-fg2);
        min-height: 2.9em;
        line-height: 1.45;
        margin-bottom: 18px;
      }
      .caption b { color: var(--m-fg); font-weight: 600; display: block; margin-bottom: 2px; }
      .caption > span {
        display: block;
        opacity: 0;
        transition: opacity 0.35s ease;
        position: absolute; left: 0; right: 0;
      }
      .caption > span[data-on="true"] { opacity: 1; position: relative; }

      .track { position: relative; display: flex; gap: 7px; }
      .seg {
        flex: 1; height: 3px; border-radius: 999px;
        background: var(--m-track); overflow: hidden;
      }
      .seg i {
        display: block; height: 100%; width: 100%;
        background: ${BRAND.gold};
        transform-origin: left; transform: scaleX(0);
      }
      .seg[data-state="done"] i { transform: scaleX(1); }
      .seg[data-state="active"] i { animation: sweep linear forwards; }
      @keyframes sweep { from { transform: scaleX(0); } to { transform: scaleX(1); } }

      /* ---- Reduced motion: keep the story, drop the travel ---- */
      @media (prefers-reduced-motion: reduce) {
        .scene { transition: opacity 0.3s ease; transform: none !important; }
        .ripple, .handset, .wire::after, .bubble, .tick path, .seg i {
          animation: none !important;
        }
        .bubble { opacity: 1 !important; transform: none !important; }
        .tick path { stroke-dashoffset: 0 !important; }
        .wire::after { transform: scaleX(1) !important; }
        .seg[data-state="active"] i, .seg[data-state="done"] i { transform: scaleX(1); }
      }

      /* ---- Narrow screens ---- */
      @container (max-width: 420px) {
        .wrap { padding: 24px 18px 20px; border-radius: 16px; }
        .stage { height: 226px; }
        .msg-phone { width: 210px; }
        .detect-row { gap: 10px; }
        .wire { width: 34px; }
        .node { width: 64px; height: 64px; }
      }
      /* Fallback for browsers without container queries */
      @media (max-width: 460px) {
        .wrap { padding: 24px 18px 20px; }
        .stage { height: 226px; }
      }

      .sr {
        position: absolute; width: 1px; height: 1px;
        overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
      }
    `;
  }

  /* ---- Icons (inline SVG, no icon font) ------------------------------ */

  const ICON_PHONE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>' +
    '</svg>';

  const ICON_MESSAGE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 20.5l1.6-4.9A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z"/>' +
    '</svg>';

  const ICON_TICK =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  /* ---- Markup -------------------------------------------------------- */

  function markup(business) {
    return `
      <div class="wrap" part="wrap">
        <div class="head">
          <div class="eyebrow">Missed call recovery</div>
          <h3 class="title">A missed call doesn't have to be a lost booking</h3>
        </div>

        <div class="stage">
          <!-- 1. Ringing -->
          <div class="scene" data-scene="ring" data-on="false">
            <div class="phone-card">
              <div class="handset">
                <span class="ripple"></span><span class="ripple"></span>
                ${ICON_PHONE}
              </div>
              <div class="phone-label">${escapeHtml(business)}</div>
              <div class="phone-sub">Incoming &middot; +1 (555) 867-5309</div>
              <div class="missed">Missed call</div>
            </div>
          </div>

          <!-- 2. Detected -->
          <div class="scene" data-scene="detect" data-on="false">
            <div class="detect-row">
              <div class="node">${ICON_PHONE}</div>
              <div class="wire"></div>
              <div class="node brandmark"><span class="ring"></span></div>
              <div class="wire delay"></div>
              <div class="node">${ICON_MESSAGE}</div>
            </div>
          </div>

          <!-- 3. The text arrives -->
          <div class="scene" data-scene="text" data-on="false">
            <div class="msg-phone">
              <div class="notch"></div>
              <div class="msg-screen">
                <div class="msg-from">${escapeHtml(business)}</div>
                <div class="bubble">
                  Sorry we missed you! We're with a client right now.
                  Book online here: <span class="link">book.link/${slug(business)}</span>
                  &mdash; or reply and we'll call you straight back.
                  <div class="stamp">Sent automatically &middot; 8 seconds after the call</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Booked -->
          <div class="scene" data-scene="booked" data-on="false">
            <div class="booked-card">
              <div class="tick">${ICON_TICK}</div>
              <div class="booked-title">Booked</div>
              <div class="booked-sub">Thursday, 2:30pm &middot; Cut &amp; finish</div>
              <div class="booked-meta">
                <span>Booking recovered</span>
                <b>+$85</b>
              </div>
            </div>
          </div>
        </div>

        <div class="caption">
          ${STEPS.map(
            (s, i) =>
              `<span data-cap="${i}" data-on="false"><b>${escapeHtml(s.label)}</b>${escapeHtml(s.caption)}</span>`
          ).join('')}
        </div>

        <div class="track" role="presentation">
          ${STEPS.map(() => '<div class="seg" data-state="idle"><i></i></div>').join('')}
        </div>

        <p class="sr">
          Animation: a customer calls ${escapeHtml(business)} and nobody can pick up.
          Meridian detects the missed call and automatically sends the caller a text
          with a booking link. The customer books, and the appointment is recovered.
        </p>
      </div>`;
  }

  /* ---- Helpers ------------------------------------------------------- */

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /**
   * Turn a business name into a plausible booking-link slug for the mock text.
   *
   * The cap is generous enough that ordinary two- and three-word salon names
   * survive intact — a slug cut mid-word ("ivylanestudi") reads as a bug to
   * anyone looking closely at the animation, which is the opposite of the
   * impression this asset exists to make.
   */
  function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'salon';
  }

  /* ---- The instance --------------------------------------------------- */

  function MeridianFlow(host) {
    const opts = {
      business: host.dataset.business || 'Ivy Lane Studio',
      autoplay: host.dataset.autoplay !== 'false',
      pauseOnHover: host.dataset.pauseOnHover !== 'false',
      speed: parseFloat(host.dataset.speed) || 1,
      loop: host.dataset.loop !== 'false',
    };

    // Shadow DOM keeps host-page CSS out and our CSS in. This is the single
    // biggest reason this embed can be dropped into ANY site — Squarespace,
    // Wix, WordPress, a hand-rolled page — without it looking broken.
    const root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;

    // data-theme is read straight off the host element by the CSS
    // (:host([data-theme="dark"])), so nothing to do here beyond making sure
    // the attribute is present for the light case too — it keeps the intent
    // obvious when someone inspects the page later.
    if (!host.hasAttribute('data-theme')) host.setAttribute('data-theme', 'light');

    const styleEl = document.createElement('style');
    styleEl.textContent = styles();
    root.appendChild(styleEl);

    const holder = document.createElement('div');
    holder.innerHTML = markup(opts.business);
    root.appendChild(holder);

    const scenes = Array.prototype.slice.call(root.querySelectorAll('.scene'));
    const caps = Array.prototype.slice.call(root.querySelectorAll('[data-cap]'));
    const segs = Array.prototype.slice.call(root.querySelectorAll('.seg'));

    let index = -1;
    let timer = null;
    let paused = false;
    let stopped = !opts.autoplay;

    const api = {
      /** Show a specific step immediately, without scheduling the next. */
      goToStep: function (i) {
        index = ((i % STEPS.length) + STEPS.length) % STEPS.length;
        paint();
        return api;
      },
      play: function () { stopped = false; paused = false; schedule(); return api; },
      pause: function () { paused = true; clearTimeout(timer); return api; },
      /** For the GIF exporter: total loop duration at the current speed. */
      duration: function () {
        return STEPS.reduce(function (sum, s) { return sum + s.hold; }, 0) / opts.speed;
      },
      steps: STEPS,
      options: opts,
      root: root,
    };

    /** Paint the current index onto the DOM. */
    function paint() {
      // Keep the "missed call" stamp's entrance proportional to how long
      // scene 1 is actually on screen at the current speed (62% of the way
      // through), rather than a fixed number of seconds.
      host.style.setProperty(
        '--m-missed-delay',
        Math.round((STEPS[0].hold * 0.62) / opts.speed) + 'ms'
      );

      scenes.forEach(function (el, i) {
        el.setAttribute('data-on', String(i === index));
      });
      caps.forEach(function (el, i) {
        el.setAttribute('data-on', String(i === index));
      });
      segs.forEach(function (el, i) {
        const state = i < index ? 'done' : i === index ? 'active' : 'idle';
        el.setAttribute('data-state', state);
        const bar = el.querySelector('i');
        if (state === 'active') {
          // Restart the sweep animation and match it to this step's hold time.
          bar.style.animation = 'none';
          void bar.offsetWidth;                       // force reflow
          bar.style.animation = 'sweep ' + (STEPS[index].hold / opts.speed) + 'ms linear forwards';
        } else {
          bar.style.animation = 'none';
        }
      });
    }

    /** Advance to the next step after the current one's hold time. */
    function schedule() {
      clearTimeout(timer);
      if (stopped || paused) return;

      const hold = index >= 0 ? STEPS[index].hold : 0;
      timer = setTimeout(function () {
        const next = index + 1;
        if (next >= STEPS.length && !opts.loop) {
          stopped = true;
          return;
        }
        index = next % STEPS.length;
        paint();
        schedule();
      }, hold / opts.speed);
    }

    /* Start on the first frame so the embed is never a blank box, even
       before it begins playing. */
    index = 0;
    paint();

    if (opts.pauseOnHover) {
      host.addEventListener('mouseenter', function () { paused = true; clearTimeout(timer); });
      host.addEventListener('mouseleave', function () { paused = false; schedule(); });
    }

    // Don't animate off-screen: saves battery on mobile and means the visitor
    // sees the story from step 1 when it scrolls into view, not halfway through.
    if (typeof IntersectionObserver === 'function') {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (stopped && opts.autoplay) { stopped = false; index = 0; paint(); }
            paused = false;
            schedule();
          } else {
            paused = true;
            clearTimeout(timer);
          }
        });
      }, { threshold: 0.25 }).observe(host);
    } else if (opts.autoplay) {
      schedule();
    }

    return api;
  }

  /* ---- Auto-mount ----------------------------------------------------- */

  const registry = { instances: [], mount: mount, Flow: MeridianFlow };

  function mount(target) {
    const nodes = target
      ? [target]
      : Array.prototype.slice.call(
          document.querySelectorAll('[data-meridian-flow], #meridian-flow')
        );

    nodes.forEach(function (node) {
      if (node.__meridianMounted) return;   // never double-mount
      node.__meridianMounted = true;
      registry.instances.push(MeridianFlow(node));
    });
    return registry.instances;
  }

  window.MeridianFlow = registry;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { mount(); });
  } else {
    mount();
  }
})();
