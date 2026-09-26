/* ============================================================================
 * MERIDIAN — missed-call app, STATIC BUILD
 * ----------------------------------------------------------------------------
 * WHY THIS FILE EXISTS
 *
 * The original app is an Express server with a SQLite database. It cannot run
 * on a static host, so this file stands in for the whole back end: it patches
 * window.fetch, answers every /api/* route the UI calls, and keeps its data in
 * localStorage instead of SQLite.
 *
 * Nothing is lost by doing this. The server was ALREADY simulating the text —
 * with no Twilio credentials it never sent one — so the only thing that changed
 * is where the simulation runs. Same templates, same segment maths, same log,
 * same numbers on the dashboard.
 *
 * WHAT IS DIFFERENT FROM THE SERVER
 *   - Data lives in this browser only. It is per-device, and clearing site data
 *     resets it. That is fine for a demo and is arguably better: every prospect
 *     gets a clean slate, and nothing of theirs is stored anywhere.
 *   - There is no /api/webhook/missed-call endpoint. A real phone system has
 *     nothing to POST to. The settings page says so.
 *   - SMS_MODE is permanently "dry". There is no way to send a real text from
 *     here, by construction, which is the right property for a page anyone can
 *     open.
 *
 * KEEPING IT HONEST
 *   The logic below is ported line-for-line from src/template.js, src/db.js and
 *   src/missed-call.js. If you change a template rule or the segment maths in
 *   the server, change it here too, or the demo stops matching the product.
 * ==========================================================================*/

(function () {
  'use strict';

  var STORE_KEY = 'meridian.missedcall.static.v1';

  /* ==========================================================================
     1. TEMPLATING  (ported from src/template.js)
     ========================================================================== */

  var TEMPLATE_VARIABLES = [
    { key: 'business_name', label: 'Business name', example: 'Sample Business' },
    { key: 'booking_link', label: 'Online booking link', example: 'https://example.com/book' },
    { key: 'hours', label: 'Opening hours', example: 'Tue-Sat, 9am-6pm' },
    { key: 'phone', label: "Business's own phone number", example: '+1 555 000 1111' },
    { key: 'caller_number', label: "The caller's number", example: '+1 555 867 5309' },
    { key: 'first_name', label: "Caller's first name, if known", example: 'there' },
  ];

  function buildVariables(business, opts) {
    opts = opts || {};
    return {
      business_name: business.name || 'our team',
      booking_link: business.booking_link || '',
      hours: business.hours || '',
      phone: business.phone || '',
      caller_number: opts.callerNumber || '',
      first_name: opts.firstName || 'there',
    };
  }

  /* Unknown placeholders stay visible ("{promo}") rather than vanishing, so a
     typo shows up in the preview instead of in a text a customer received. */
  function renderTemplate(template, variables) {
    var rendered = String(template == null ? '' : template).replace(
      /\{(\w+)\}/g,
      function (match, key) {
        return key in variables ? String(variables[key] == null ? '' : variables[key]) : match;
      }
    );
    return rendered.replace(/[ \t]{2,}/g, ' ').trim();
  }

  /* SMS segment maths. A single character outside GSM-7 (a curly quote, an
     em dash, an emoji) drops the limit from 160 to 70 and silently multiplies
     the cost of every message. The settings screen shows this live. */
  var GSM7 =
    '@£$¥èéùìòÇ\nØø\rÅå' +
    'Δ_ΦΓΛΩΠΨΣΘΞÆæßÉ' +
    " !\"#¤%&'()*+,-./0123456789:;<=>?" +
    '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§' +
    '¿abcdefghijklmnopqrstuvwxyzäöñüà';
  var GSM7_EXTENDED = '^{}\\[~]|€';

  function analyzeMessage(text) {
    var body = String(text == null ? '' : text);
    var isGsm7 = true;
    var units = 0;

    for (var i = 0; i < body.length; i++) {
      var ch = body[i];
      if (GSM7.indexOf(ch) !== -1) units += 1;
      else if (GSM7_EXTENDED.indexOf(ch) !== -1) units += 2; // escape + char
      else { isGsm7 = false; break; }
    }

    if (!isGsm7) units = body.length; // UCS-2 counts UTF-16 code units

    var single = isGsm7 ? 160 : 70;
    var multi = isGsm7 ? 153 : 67;
    var segments = units <= single ? 1 : Math.ceil(units / multi);

    return {
      characters: Array.from(body).length,
      encoding: isGsm7 ? 'GSM-7' : 'UCS-2',
      units: units,
      segments: segments,
      remainingInSegment: (segments === 1 ? single : multi * segments) - units,
    };
  }

  /* ==========================================================================
     2. NUMBERS  (ported from src/sms.js)
     ========================================================================== */

  function normalizeNumber(input, defaultCountryCode) {
    defaultCountryCode = defaultCountryCode || '1';
    var raw = String(input == null ? '' : input).trim();
    if (raw === '') return '';
    if (raw.charAt(0) === '+') return '+' + raw.slice(1).replace(/\D/g, '');

    var digits = raw.replace(/\D/g, '');
    if (digits.length === 10) return '+' + defaultCountryCode + digits;
    if (digits.length === 11 && digits.charAt(0) === '1') return '+' + digits;
    return '+' + digits;
  }

  function formatNumber(e164) {
    var m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(String(e164 == null ? '' : e164));
    return m ? '+1 (' + m[1] + ') ' + m[2] + '-' + m[3] : String(e164 == null ? '' : e164);
  }

  function slugify(input) {
    var s = String(input)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
    return s || 'business-' + Date.now();
  }

  /* SQLite writes "2026-09-06 14:03:11" in UTC, and formatTime() in app.js
     parses exactly that shape. Match it rather than using toISOString(). */
  function sqliteNow() {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  /* ==========================================================================
     3. STORAGE  (ported from src/db.js — localStorage instead of SQLite)
     ========================================================================== */

  /* Plain ASCII on purpose. Curly quotes and em dashes force UCS-2 and cut the
     per-segment limit from 160 to 70 characters. */
  var DEFAULT_TEMPLATE =
    "Hi, it's {business_name}! Sorry we missed your call - we're with a client " +
    'right now. Book online here: {booking_link} or reply to this text and ' +
    "we'll call you straight back. ({hours})";

  function seedState() {
    return {
      nextBusinessId: 2,
      nextCallId: 1,
      businesses: [{
        id: 1,
        slug: 'sample-business',
        name: 'Sample Business',
        template: DEFAULT_TEMPLATE,
        booking_link: 'https://example.com/book',
        hours: 'Tue-Sat, 9am-6pm',
        phone: '+15550001111',
        is_active: 1,
        created_at: sqliteNow(),
        updated_at: sqliteNow(),
      }],
      missedCalls: [],
    };
  }

  /* Every read goes through here, and every read tolerates a browser that
     refuses localStorage (private windows, blocked site data). A demo that
     throws on load is worse than a demo that forgets between visits. */
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return seedState();
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.businesses) || parsed.businesses.length === 0) {
        return seedState();
      }
      if (!Array.isArray(parsed.missedCalls)) parsed.missedCalls = [];
      return parsed;
    } catch (e) {
      return seedState();
    }
  }

  function save(state) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    return state;
  }

  var businesses = {
    all: function (s) {
      return s.businesses.slice().sort(function (a, b) {
        if (a.is_active !== b.is_active) return b.is_active - a.is_active;
        return String(a.name).localeCompare(String(b.name));
      });
    },
    byId: function (s, id) {
      return s.businesses.find(function (b) { return b.id === Number(id); });
    },
    bySlug: function (s, slug) {
      return s.businesses.find(function (b) { return b.slug === String(slug); });
    },
    /* Never return nothing: a demo with no business is a broken demo button. */
    active: function (s) {
      return s.businesses.find(function (b) { return b.is_active === 1; }) || s.businesses[0];
    },
    resolve: function (s, idOrSlug) {
      if (idOrSlug === undefined || idOrSlug === null || idOrSlug === '') return this.active(s);
      var byId = /^\d+$/.test(String(idOrSlug)) ? this.byId(s, idOrSlug) : undefined;
      return byId || this.bySlug(s, idOrSlug) || this.active(s);
    },
    create: function (s, fields) {
      if (this.bySlug(s, fields.slug)) {
        throw new Error('A business with that name/slug already exists. Pick a different name.');
      }
      var row = {
        id: s.nextBusinessId++,
        slug: fields.slug,
        name: fields.name,
        template: fields.template || DEFAULT_TEMPLATE,
        booking_link: fields.booking_link || '',
        hours: fields.hours || '',
        phone: fields.phone || '',
        is_active: 0,
        created_at: sqliteNow(),
        updated_at: sqliteNow(),
      };
      s.businesses.push(row);
      return row;
    },
    update: function (s, id, fields) {
      var row = this.byId(s, id);
      if (!row) return null;
      ['name', 'template', 'booking_link', 'hours', 'phone', 'slug'].forEach(function (k) {
        if (fields[k] !== undefined) row[k] = String(fields[k]);
      });
      row.updated_at = sqliteNow();
      return row;
    },
    setActive: function (s, id) {
      var row = this.byId(s, id);
      if (!row) return null;
      s.businesses.forEach(function (b) { b.is_active = 0; });
      row.is_active = 1;
      return row;
    },
    remove: function (s, id) {
      var row = this.byId(s, id);
      if (!row) return false;
      if (s.businesses.length <= 1) return false; // never delete the last profile
      s.businesses = s.businesses.filter(function (b) { return b.id !== row.id; });
      s.missedCalls = s.missedCalls.filter(function (c) { return c.business_id !== row.id; });
      if (row.is_active) this.setActive(s, s.businesses[0].id);
      return true;
    },
  };

  var missedCalls = {
    create: function (s, row) {
      var biz = businesses.byId(s, row.business_id) || {};
      var saved = {
        id: s.nextCallId++,
        business_id: Number(row.business_id),
        caller_number: String(row.caller_number),
        source: String(row.source),
        status: String(row.status),
        message_body: String(row.message_body),
        twilio_sid: row.twilio_sid == null ? null : row.twilio_sid,
        error: row.error == null ? null : row.error,
        dry_run: row.dry_run ? 1 : 0,
        latency_ms: row.latency_ms == null ? null : row.latency_ms,
        created_at: sqliteNow(),
        business_name: biz.name,
        business_slug: biz.slug,
      };
      s.missedCalls.push(saved);
      return saved;
    },
    recent: function (s, limit) {
      return s.missedCalls
        .slice()
        .sort(function (a, b) { return b.id - a.id; })
        .slice(0, Math.min(Number(limit) || 50, 500));
    },
    stats: function (s) {
      var rows = s.missedCalls;
      var withLatency = rows.filter(function (r) { return typeof r.latency_ms === 'number'; });
      var count = function (st) {
        return rows.filter(function (r) { return r.status === st; }).length;
      };
      return {
        total: rows.length,
        sent: count('sent'),
        simulated: count('simulated'),
        failed: count('failed'),
        avg_latency_ms: withLatency.length
          ? Math.round(withLatency.reduce(function (a, r) { return a + r.latency_ms; }, 0) / withLatency.length)
          : null,
      };
    },
    clear: function (s) { s.missedCalls = []; },
  };

  /* ==========================================================================
     4. LIVE EVENTS
     --------------------------------------------------------------------------
     The server used server-sent events so the dashboard updated the instant a
     call landed. BroadcastChannel gives the same effect across tabs, which is
     what actually matters in a pitch: the demo open on one screen, the
     dashboard on another, both moving at once.
     ========================================================================== */

  var LISTENERS = [];
  var channel = null;
  try { channel = new BroadcastChannel('meridian-missed-call'); } catch (e) { /* unsupported */ }

  if (channel) {
    channel.onmessage = function (e) {
      if (e.data && e.data.event) deliver(e.data.event, e.data.payload, false);
    };
  }

  function deliver(event, payload, alsoRemote) {
    LISTENERS.forEach(function (l) {
      if (l.event !== event) return;
      try { l.handler({ data: JSON.stringify(payload) }); } catch (err) { console.error(err); }
    });
    if (alsoRemote && channel) {
      try { channel.postMessage({ event: event, payload: payload }); } catch (e) { /* ignore */ }
    }
  }

  function broadcast(event, payload) { deliver(event, payload, true); }

  /* Stand in for EventSource, but only for our own stream — anything else falls
     through to the real implementation. */
  var NativeEventSource = window.EventSource;

  function ShimEventSource(url) {
    this.url = String(url);
    this.readyState = 1;
    this.onerror = null;
    this.onopen = null;
    this._own = [];
  }
  ShimEventSource.prototype.addEventListener = function (event, handler) {
    var entry = { event: event, handler: handler };
    LISTENERS.push(entry);
    this._own.push(entry);
  };
  ShimEventSource.prototype.removeEventListener = function (event, handler) {
    LISTENERS = LISTENERS.filter(function (l) {
      return !(l.event === event && l.handler === handler);
    });
  };
  ShimEventSource.prototype.close = function () {
    var own = this._own;
    LISTENERS = LISTENERS.filter(function (l) { return own.indexOf(l) === -1; });
    this.readyState = 2;
  };

  window.EventSource = function (url) {
    if (String(url).indexOf('/api/events') !== -1) return new ShimEventSource(url);
    return new NativeEventSource(url);
  };

  /* ==========================================================================
     5. THE FLOW  (ported from src/missed-call.js)
     ========================================================================== */

  function handleMissedCall(s, input) {
    var startedAt = Date.now();

    var business = businesses.resolve(s, input.businessId);
    if (!business) throw new Error('No business profile configured.');

    var to = normalizeNumber(input.callerNumber);
    if (!to || to.replace(/\D/g, '').length < 7) {
      throw new Error('"' + input.callerNumber +
        '" is not a usable phone number. Use E.164, e.g. +14155550123.');
    }

    var variables = buildVariables(business, { callerNumber: to, firstName: input.firstName });
    var body = renderTemplate(business.template, variables);
    var analysis = analyzeMessage(body);

    /* Tell the screens the call landed BEFORE the text goes out. This is what
       makes the demo feel instant — the call appears, the reply follows. */
    broadcast('missed-call:incoming', {
      business: { id: business.id, name: business.name, slug: business.slug },
      callerNumber: to,
      source: input.source || 'demo',
      at: new Date().toISOString(),
    });

    /* Where the server called Twilio. Here it is always a simulation, and there
       is deliberately no code path that could make it anything else. */
    var record = missedCalls.create(s, {
      business_id: business.id,
      caller_number: to,
      source: input.source || 'demo',
      status: 'simulated',
      message_body: body,
      twilio_sid: null,
      error: null,
      dry_run: true,
      latency_ms: Date.now() - startedAt,
    });

    var payload = Object.assign({}, record, { variables: variables, analysis: analysis });
    broadcast('missed-call:handled', payload);
    return payload;
  }

  /* ==========================================================================
     6. THE ROUTER  (ported from src/routes/api.js)
     ========================================================================== */

  function json(data, status) {
    return new Response(JSON.stringify(data), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  function route(method, path, body) {
    var s = load();
    var m;

    // ---- GET /api/status --------------------------------------------------
    if (method === 'GET' && path === '/api/status') {
      return json({
        smsMode: 'dry',
        smsLive: false,
        twilioConfigured: false,
        twilioNumber: null,
        demoDefaultDryRun: true,
        callFlowMode: 'direct',
        ringTimeoutSeconds: 18,
        publicBaseUrl: null,
        forwardToNumber: null,
        activeBusiness: businesses.active(s),
        connectedScreens: 1,
        bookingPlatform: 'none',
        availableBookingPlatforms: [],
        templateVariables: TEMPLATE_VARIABLES,
        staticBuild: true,
      });
    }

    // ---- POST /api/demo/simulate-missed-call ------------------------------
    if (method === 'POST' && path === '/api/demo/simulate-missed-call') {
      try {
        var caller = String(body.caller_number == null ? '' : body.caller_number).trim()
          || '+15558675309';
        var record = handleMissedCall(s, {
          callerNumber: caller,
          businessId: body.business,
          firstName: body.first_name,
          source: 'demo',
        });
        save(s);
        return json({ ok: true, record: record });
      } catch (err) {
        return json({ ok: false, error: err.message }, 400);
      }
    }

    // ---- POST /api/preview ------------------------------------------------
    if (method === 'POST' && path === '/api/preview') {
      try {
        var biz = businesses.resolve(s, body.business);
        if (!biz) throw new Error('No business profile configured.');
        var callerNum = body.caller_number || '+15558675309';
        var vars = buildVariables(biz, { callerNumber: callerNum });
        var text = renderTemplate(
          body.template !== undefined ? body.template : biz.template,
          vars
        );
        var out = { ok: true, body: text, variables: vars, analysis: analyzeMessage(text) };
        if (body.template === undefined) out.business = biz;
        return json(out);
      } catch (err) {
        return json({ ok: false, error: err.message }, 400);
      }
    }

    // ---- GET /api/businesses ----------------------------------------------
    if (method === 'GET' && path === '/api/businesses') {
      return json({ ok: true, businesses: businesses.all(s), active: businesses.active(s) });
    }

    // ---- POST /api/businesses ---------------------------------------------
    if (method === 'POST' && path === '/api/businesses') {
      try {
        if (!body.name || String(body.name).trim() === '') {
          return json({ ok: false, error: 'A business name is required.' }, 400);
        }
        var created = businesses.create(s, {
          name: String(body.name).trim(),
          slug: slugify(body.slug || body.name),
          template: body.template,
          booking_link: body.booking_link,
          hours: body.hours,
          phone: body.phone,
        });
        save(s);
        return json({ ok: true, business: created });
      } catch (err) {
        return json({ ok: false, error: err.message }, 400);
      }
    }

    // ---- POST /api/businesses/:id/activate --------------------------------
    m = /^\/api\/businesses\/([^/]+)\/activate$/.exec(path);
    if (method === 'POST' && m) {
      var activated = businesses.setActive(s, m[1]);
      if (!activated) return json({ ok: false, error: 'Business not found.' }, 404);
      save(s);
      return json({ ok: true, business: activated });
    }

    // ---- PATCH / DELETE /api/businesses/:id -------------------------------
    m = /^\/api\/businesses\/([^/]+)$/.exec(path);
    if (m) {
      if (method === 'PATCH') {
        var updated = businesses.update(s, m[1], body);
        if (!updated) return json({ ok: false, error: 'Business not found.' }, 404);
        save(s);
        return json({ ok: true, business: updated });
      }
      if (method === 'DELETE') {
        var removed = businesses.remove(s, m[1]);
        if (!removed) {
          return json({
            ok: false,
            error: 'Could not delete - the business does not exist, or it is the only profile left.',
          }, 400);
        }
        save(s);
        return json({ ok: true });
      }
    }

    // ---- GET / DELETE /api/missed-calls -----------------------------------
    if (path.indexOf('/api/missed-calls') === 0) {
      if (method === 'GET') {
        var limit = 50;
        var q = path.indexOf('?');
        if (q !== -1) {
          var lm = /limit=(\d+)/.exec(path.slice(q));
          if (lm) limit = parseInt(lm[1], 10);
        }
        var rows = missedCalls.recent(s, limit).map(function (r) {
          return Object.assign({}, r, { caller_display: formatNumber(r.caller_number) });
        });
        return json({ ok: true, missedCalls: rows, stats: missedCalls.stats(s) });
      }
      if (method === 'DELETE') {
        missedCalls.clear(s);
        save(s);
        return json({ ok: true });
      }
    }

    // ---- Anything else, including the webhook the server used to expose ----
    return json({
      ok: false,
      error: 'Not available in the static demo. This page has no back end - ' +
             'run the full app to use ' + path + '.',
    }, 404);
  }

  /* ==========================================================================
     7. PATCH fetch
     ========================================================================== */

  var nativeFetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var path = url;

    // Only claim our own routes; everything else goes to the real network.
    try {
      var u = new URL(url, location.href);
      if (u.origin !== location.origin) return nativeFetch(input, init);
      path = u.pathname + u.search;
    } catch (e) { /* relative path, use as-is */ }

    if (path.indexOf('/api/') !== 0) return nativeFetch(input, init);

    init = init || {};
    var method = (init.method || 'GET').toUpperCase();
    var body = {};
    if (init.body) {
      try { body = JSON.parse(init.body); } catch (e) { body = {}; }
    }

    /* Resolve on a later tick. The real thing crossed a network, and the demo's
       "call lands, then the reply arrives" beat depends on this not being
       synchronous. */
    return new Promise(function (resolve) {
      setTimeout(function () {
        try {
          resolve(route(method, path, body));
        } catch (err) {
          console.error('[static-api]', err);
          resolve(json({ ok: false, error: err.message }, 500));
        }
      }, 120);
    });
  };

  /* Expose the internals so the console is still useful when something looks
     wrong during a pitch. */
  window.MeridianStaticAPI = {
    reset: function () {
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
      location.reload();
    },
    dump: function () { return load(); },
    renderTemplate: renderTemplate,
    analyzeMessage: analyzeMessage,
  };
})();
