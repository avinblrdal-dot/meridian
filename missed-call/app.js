/* ============================================================
   MERIDIAN — shared front-end helpers
   ------------------------------------------------------------
   Plain browser JavaScript, no framework, no build step. Every
   page loads this file first, then its own inline <script>.

   Why no framework: this app has to start and work on a laptop
   in a salon back room with one command. A build step is one
   more thing that can be broken on the morning you need it.
   ============================================================ */

/** Small querySelector aliases. */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ------------------------------------------------------------
   HTTP
   ------------------------------------------------------------ */

/**
 * JSON fetch that always resolves to a usable object and never throws
 * an unhandled error at a click handler.
 */
async function api(path, { method = 'GET', body } = {}) {
  try {
    const res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || `Request failed (${res.status})` };
    }
    return data;
  } catch (err) {
    // Network-level failure: server stopped, laptop asleep, wifi dropped.
    return { ok: false, error: 'Could not reach the server. Is it still running?' };
  }
}

/* ------------------------------------------------------------
   Toasts
   ------------------------------------------------------------ */

function toast(message, kind = '') {
  let host = $('#toasts');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toasts';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = message;
  el.setAttribute('role', 'status');
  host.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

/* ------------------------------------------------------------
   Escaping + formatting
   ------------------------------------------------------------ */

/** Escape text before putting it in innerHTML. */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

/**
 * Escape, then turn bare URLs into links.
 * Used for the message preview so the booking link is clickable in the
 * phone mockup, exactly as it would be on a real handset.
 */
function escWithLinks(value) {
  return esc(value).replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

/** "2026-09-06 14:03:11" (SQLite UTC) -> a friendly local time. */
function formatTime(sqliteUtc) {
  if (!sqliteUtc) return '';
  const iso = String(sqliteUtc).replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(sqliteUtc);

  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return sameDay ? time : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

/** +14155550123 -> +1 (415) 555-0123 */
function formatNumber(e164) {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(String(e164 ?? ''));
  return m ? `+1 (${m[1]}) ${m[2]}-${m[3]}` : String(e164 ?? '');
}

/** First letters of a business name, for the phone-mockup avatar. */
function initials(name) {
  return String(name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/* ------------------------------------------------------------
   Live event stream (SSE)
   ------------------------------------------------------------
   One connection per page. Auto-reconnects on its own — important
   when a laptop lid closes between meetings.
   ------------------------------------------------------------ */

const liveEvents = {
  source: null,
  handlers: new Map(),

  /** Register a handler for a server event name. */
  on(event, handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event).push(handler);
    this._ensureConnected();
    return this;
  },

  _ensureConnected() {
    if (this.source) return;
    this.source = new EventSource('/api/events');

    for (const event of ['missed-call:incoming', 'missed-call:handled']) {
      this.source.addEventListener(event, (e) => {
        let payload = {};
        try { payload = JSON.parse(e.data); } catch { /* ignore malformed frame */ }
        for (const handler of this.handlers.get(event) ?? []) {
          try { handler(payload); } catch (err) { console.error(err); }
        }
      });
    }

    // EventSource reconnects by itself; this is just so a dropped connection
    // is visible in the console rather than silent.
    this.source.onerror = () => console.warn('[sse] connection lost, retrying...');
  },
};

/* ------------------------------------------------------------
   Mode strip — is the next click going to send a real text?
   ------------------------------------------------------------ */

/**
 * Fetch /api/status and paint the strip under the nav.
 * Returns the status object so pages can reuse it.
 */
async function paintModeBar() {
  const status = await api('/api/status');
  const bar = $('#modebar');
  if (!bar) return status;

  if (status.error) {
    bar.dataset.mode = 'dry';
    bar.textContent = 'Could not reach the server.';
    return status;
  }

  // "Will a click send a real text?" depends on BOTH the server mode and the
  // demo default. Say the true answer plainly — no ambiguity in front of a client.
  const live = status.smsLive && !status.demoDefaultDryRun;
  bar.dataset.mode = live ? 'live' : 'dry';
  bar.textContent = live
    ? `LIVE MODE — real texts will be sent from ${status.twilioNumber}`
    : status.smsLive
      ? 'SAFE MODE — the demo button simulates by default. Tick "send for real" to actually text.'
      : 'SAFE MODE — no Twilio credentials configured. Every text is simulated.';

  return status;
}

/** Mark the current page in the nav. */
function markNav() {
  const here = location.pathname.replace(/\/$/, '') || '/';
  for (const link of $$('.nav a')) {
    const target = new URL(link.href, location.origin).pathname.replace(/\/$/, '') || '/';
    if (target === here) link.setAttribute('aria-current', 'page');
  }
}

document.addEventListener('DOMContentLoaded', markNav);
