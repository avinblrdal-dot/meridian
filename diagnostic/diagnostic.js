/* ============================================================
   MERIDIAN — Diagnostic logic
   ------------------------------------------------------------
   1. QUESTIONS  — what is asked, and what each answer is worth
   2. SERVICES   — what can be recommended
   3. scoring    — add up points per service, best score wins
   4. the screens: intro → 7 questions → results + sign-up

   Each answer can carry `score` (points per service) and `why`
   (the sentence shown under the recommendation, if that answer
   ended up mattering). To change what gets recommended, change
   the numbers here — nothing else needs touching.
   ============================================================ */
(function () {
  "use strict";

  /* ------------------------------------------------------------
     1. QUESTIONS
     ------------------------------------------------------------ */
  var QUESTIONS = [
    {
      id: "type",
      title: "What kind of business do you run?",
      options: [
        { label: "Hair salon" },
        { label: "Barbershop" },
        { label: "Nail, lash or brow studio" },
        { label: "Spa or massage" },
        { label: "Fitness, yoga or dance studio" },
        { label: "Something else" },
      ],
    },
    {
      id: "size",
      title: "How many people work there, including you?",
      options: [
        { label: "Just me", score: { missed: 2 }, why: { missed: "You're running it solo, so every client you're with is a call you can't take." } },
        { label: "2 to 5", score: { missed: 1 } },
        { label: "6 to 15" },
        { label: "16 or more", score: { faq: 1 } },
      ],
    },
    {
      id: "booking",
      title: "How do most clients book with you?",
      options: [
        { label: "Phone calls", score: { missed: 2 }, why: { missed: "Most of your bookings start as a phone call." } },
        { label: "An online booking app", score: { noshows: 1, faq: 1 } },
        { label: "Instagram or Facebook messages", score: { faq: 2 }, why: { faq: "Clients reach you through messages, where the same questions pile up." } },
        { label: "Walk-ins", score: { reviews: 1 } },
        { label: "A mix of everything", score: { missed: 1, faq: 1 } },
      ],
    },
    {
      id: "pains",
      title: "What costs you the most time or money?",
      hint: "Pick up to three.",
      multi: 3,
      options: [
        { label: "Calls I miss while I'm with a client", score: { missed: 3 }, why: { missed: "You told us missed calls are one of your biggest costs." } },
        { label: "Answering the same questions all day", score: { faq: 3 }, why: { faq: "You spend real time answering the same questions." } },
        { label: "No-shows and last-minute cancellations", score: { noshows: 3 }, why: { noshows: "No-shows and late cancellations are hitting your book." } },
        { label: "Clients who don't come back", score: { noshows: 2 }, why: { noshows: "Clients aren't rebooking as often as they could." } },
        { label: "Not enough Google reviews", score: { reviews: 3 }, why: { reviews: "You want more reviews, and a steady way to get them." } },
        { label: "Scheduling back-and-forth and admin", score: { audit: 2 } },
      ],
    },
    {
      id: "missedCalls",
      title: "In a normal week, how many calls go unanswered?",
      options: [
        { label: "0 to 2", score: { missed: -2 } },
        { label: "3 to 10", score: { missed: 2 }, why: { missed: "A few unanswered calls a week adds up to lost bookings." } },
        { label: "More than 10", score: { missed: 4 }, why: { missed: "More than ten calls a week go unanswered. That's the biggest leak here." } },
        { label: "Honestly, not sure", score: { missed: 1 } },
      ],
    },
    {
      id: "aiUse",
      title: "What tools do you use today?",
      options: [
        { label: "Mostly phone and paper" },
        { label: "Booking software with reminders" },
        { label: "I've tried ChatGPT or similar" },
        { label: "Several AI or automation tools" },
      ],
    },
    {
      id: "goal",
      title: "If we built something, how would you want it?",
      options: [
        { label: "Set up so I never have to think about it" },
        { label: "Set up, and teach me how to run it" },
        { label: "Just exploring for now" },
      ],
    },
  ];

  /* ------------------------------------------------------------
     2. SERVICES — names and copy match the site's "What We Build"
     ------------------------------------------------------------ */
  var SERVICES = {
    missed: {
      name: "Missed-call text-back",
      desc: "When you can't pick up, the caller gets a friendly text within seconds with your booking link, so the booking still lands.",
      demo: { href: "/demo", label: "See it on a phone" },
    },
    faq: {
      name: "Front-desk assistant",
      desc: "A chat assistant on your website that answers hours, prices, parking and policies from your own answers, never made-up ones.",
      demo: { href: "/salon-demo", label: "Try it on a sample salon" },
    },
    noshows: {
      name: "Reminders and rebooking",
      desc: "Reminders and one-tap rebooking set up properly in the booking tools you already use, so chairs stay full.",
    },
    reviews: {
      name: "Review engine",
      desc: "A simple system that asks happy clients for a Google review at the right moment, plus quick reply drafts.",
    },
    audit: {
      name: "Free AI Opportunity Audit",
      desc: "Your answers point in a few directions. A free session together is the fastest way to find the one fix worth building first.",
    },
  };
  var ORDER = ["missed", "faq", "noshows", "reviews"];   // tie-break order

  /* ------------------------------------------------------------
     3. SCORING
     ------------------------------------------------------------ */
  function selected(q) {
    return (answers[q.id] || []).map(function (i) { return q.options[i]; });
  }

  function recommend() {
    var score = { missed: 0, faq: 0, noshows: 0, reviews: 0, audit: 0 };
    var why = { missed: [], faq: [], noshows: [], reviews: [] };

    QUESTIONS.forEach(function (q) {
      selected(q).forEach(function (opt) {
        Object.keys(opt.score || {}).forEach(function (k) { score[k] += opt.score[k]; });
        Object.keys(opt.why || {}).forEach(function (k) { why[k].push({ text: opt.why[k], weight: (opt.score || {})[k] || 0 }); });
      });
    });

    var ranked = ORDER.slice().sort(function (a, b) {
      return score[b] - score[a] || ORDER.indexOf(a) - ORDER.indexOf(b);
    });

    // Nothing clearly stood out (e.g. only "admin" picked): lead with the Audit.
    var top = ranked[0];
    var best = score[top] >= 3 ? top : "audit";
    var alts = ranked.filter(function (k) { return k !== best && score[k] > 0; }).slice(0, 2);
    if (alts.length < 2 && best !== "audit") alts.push("audit");
    if (alts.length < 2) alts = alts.concat(ranked.filter(function (k) { return alts.indexOf(k) < 0 && k !== best; })).slice(0, 2);

    // Strongest reasons first, so the one that mattered most is never cut.
    var reasons = (why[best] || []).sort(function (a, b) { return b.weight - a.weight; })
      .slice(0, 3).map(function (w) { return w.text; });

    return { best: best, alts: alts, why: reasons, score: score };
  }

  /* ------------------------------------------------------------
     4. SCREENS
     ------------------------------------------------------------ */
  var root = document.getElementById("dx");
  var answers = {};
  var step = 0;
  var source = new URLSearchParams(location.search).get("src") || "website";

  var TICK = '<span class="tick" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 13l4 4L20 5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render(html) {
    root.innerHTML = '<div class="dx-fade">' + html + "</div>";
    var focus = root.querySelector("h1, h2");
    if (focus) { focus.setAttribute("tabindex", "-1"); focus.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function intro() {
    render(
      '<div class="dx-intro">' +
        '<span class="eyebrow">2-minute diagnostic</span>' +
        "<h1>Find your biggest time-waster.</h1>" +
        '<p class="lead">Seven quick questions about how your business runs. At the end you get the one fix we\'d start with, and why.</p>' +
        '<ul class="dx-points">' +
          "<li>No sign-up needed to see your result</li>" +
          "<li>Built for salons, spas and studios</li>" +
          "<li>Honest: if you don't need us, it'll say so</li>" +
        "</ul>" +
        '<button class="btn btn-primary btn-lg" id="dxStart">Start</button>' +
      "</div>"
    );
    document.getElementById("dxStart").addEventListener("click", function () { step = 0; question(); });
  }

  function question() {
    var q = QUESTIONS[step];
    var picked = answers[q.id] || [];
    var pct = Math.round((step / QUESTIONS.length) * 100);

    var opts = q.options.map(function (o, i) {
      return '<button type="button" class="dx-opt' + (q.multi ? "" : " single") + '" data-i="' + i + '" aria-pressed="' +
        (picked.indexOf(i) >= 0) + '">' + TICK + "<span>" + esc(o.label) + "</span></button>";
    }).join("");

    render(
      '<div class="dx-progress"><div class="dx-bar"><span style="width:' + pct + '%"></span></div>' +
        '<span class="dx-count">' + (step + 1) + " / " + QUESTIONS.length + "</span></div>" +
      '<div class="dx-q">' +
        "<h2>" + esc(q.title) + "</h2>" +
        (q.hint ? '<p class="dx-hint">' + esc(q.hint) + "</p>" : '<p class="dx-hint">Pick one.</p>') +
        '<div class="dx-options" role="group" aria-label="' + esc(q.title) + '">' + opts + "</div>" +
      "</div>" +
      '<div class="dx-nav">' +
        '<button type="button" class="dx-back" id="dxBack"' + (step === 0 ? " hidden" : "") + ">← Back</button>" +
        (q.multi ? '<button type="button" class="btn btn-primary" id="dxNext"' + (picked.length ? "" : " disabled") + ">Next</button>" : "") +
      "</div>"
    );

    root.querySelectorAll(".dx-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = +btn.dataset.i;
        if (!q.multi) {
          answers[q.id] = [i];
          // A short beat so the tap visibly registers before moving on.
          root.querySelectorAll(".dx-opt").forEach(function (b) { b.setAttribute("aria-pressed", b === btn); });
          setTimeout(next, 220);
          return;
        }
        var cur = answers[q.id] = (answers[q.id] || []).slice();
        var at = cur.indexOf(i);
        if (at >= 0) cur.splice(at, 1);
        else if (cur.length < q.multi) cur.push(i);
        root.querySelectorAll(".dx-opt").forEach(function (b) { b.setAttribute("aria-pressed", cur.indexOf(+b.dataset.i) >= 0); });
        document.getElementById("dxNext").disabled = !cur.length;
      });
    });

    var back = document.getElementById("dxBack");
    back.addEventListener("click", function () { if (step > 0) { step--; question(); } });
    var nextBtn = document.getElementById("dxNext");
    if (nextBtn) nextBtn.addEventListener("click", next);
  }

  function next() {
    if (step < QUESTIONS.length - 1) { step++; question(); }
    else results();
  }

  /** Answers as readable text, for the email that lands in Meridian's inbox. */
  function answerSummary() {
    var out = {};
    QUESTIONS.forEach(function (q) {
      out[q.title] = selected(q).map(function (o) { return o.label; }).join("; ");
    });
    return out;
  }

  function results() {
    var r = recommend();
    var best = SERVICES[r.best];

    var why = r.why.length
      ? '<ul class="dx-why">' + r.why.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>"
      : "";
    var demo = best.demo
      ? '<a class="btn btn-on-dark" href="' + best.demo.href + '" target="_blank" rel="noopener">' + esc(best.demo.label) + " →</a>"
      : "";

    var alts = r.alts.map(function (k) {
      var s = SERVICES[k];
      return '<div class="dx-alt"><span class="tag">Also worth a look</span><h3>' + esc(s.name) + "</h3><p>" + esc(s.desc) + "</p>" +
        (s.demo ? '<a href="' + s.demo.href + '" target="_blank" rel="noopener">' + esc(s.demo.label) + " →</a>" : "") + "</div>";
    }).join("");

    render(
      '<div class="dx-progress"><div class="dx-bar"><span style="width:100%"></span></div><span class="dx-count">Done</span></div>' +
      '<div class="dx-result-head"><span class="eyebrow">Your result</span><h1>Here\'s where we\'d start.</h1></div>' +
      '<div class="dx-best"><span class="tag">' + (r.best === "audit" ? "Best first step" : "Best fit for you") + "</span>" +
        "<h2>" + esc(best.name) + "</h2><p>" + esc(best.desc) + "</p>" + why + demo + "</div>" +
      '<div class="dx-alts">' + alts + "</div>" +
      '<p class="dx-caveat">This is a starting point, not a diagnosis. A free AI Opportunity Audit is where we check it against how your business actually runs, and if a fix isn\'t worth it, we\'ll tell you.</p>' +
      '<div class="dx-capture">' +
        "<h2>Want us to look at it with you?</h2>" +
        '<p class="lead">Book a free Audit. We\'ll bring your answers, so there\'s nothing to repeat.</p>' +
        '<form class="lead-form" id="dxForm" novalidate>' +
          '<div class="form-row">' +
            '<div class="field"><label for="dxName">Your name</label><input id="dxName" name="name" autocomplete="name" required></div>' +
            '<div class="field"><label for="dxBiz">Business name</label><input id="dxBiz" name="business" autocomplete="organization" required></div>' +
          "</div>" +
          '<div class="form-row">' +
            '<div class="field"><label for="dxEmail">Email</label><input id="dxEmail" name="email" type="email" autocomplete="email" required></div>' +
            '<div class="field"><label for="dxPhone">Phone <span style="font-weight:400;color:var(--ink-soft)">(optional)</span></label><input id="dxPhone" name="phone" type="tel" autocomplete="tel"></div>' +
          "</div>" +
          '<input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<button type="submit" class="btn btn-primary btn-lg">Book my free Audit</button>' +
          '<p class="form-error" id="dxError" role="alert" hidden>That didn\'t send. Please try again in a moment.</p>' +
        "</form>" +
        '<div class="form-success" id="dxDone" role="status">' +
          '<div class="check" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M4 13l4 4L20 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
          "<h3>Thanks, we've got it.</h3><p>We'll be in touch shortly to set up your free Audit.</p>" +
        "</div>" +
      "</div>" +
      '<button type="button" class="dx-restart" id="dxRestart">Start over</button>'
    );

    var form = document.getElementById("dxForm");
    var done = document.getElementById("dxDone");
    var err = document.getElementById("dxError");
    var submit = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      err.hidden = true;

      var fields = { source: source, recommendation: best.name, also: r.alts.map(function (k) { return SERVICES[k].name; }).join("; ") };
      new FormData(form).forEach(function (v, k) { fields[k] = v; });
      var a = answerSummary();
      Object.keys(a).forEach(function (k) { fields[k] = a[k]; });

      var forms = window.MeridianForms;
      var finish = function () { form.style.display = "none"; done.classList.add("show"); };
      if (!forms || !forms.configured) { finish(); return; }

      submit.disabled = true;
      submit.textContent = "Sending…";
      forms.send("Diagnostic: " + fields.business + " → " + best.name, fields).then(function (ok) {
        submit.disabled = false;
        submit.textContent = "Book my free Audit";
        if (ok) finish(); else err.hidden = false;
      });
    });

    document.getElementById("dxRestart").addEventListener("click", function () { answers = {}; intro(); });
  }

  // Debug/QA hook: lets the scoring be checked from the console.
  window.MeridianDiagnostic = { QUESTIONS: QUESTIONS, SERVICES: SERVICES, recommendFor: function (a) { answers = a; return recommend(); } };

  intro();
})();
