/* ============================================================
   MERIDIAN — Form delivery (contact form + diagnostic)
   ------------------------------------------------------------
   Both forms send through Web3Forms: free, 250 submissions a
   month, no account or card. Each submission arrives as an
   email to whatever address the key was created for.

   TO TURN IT ON (2 minutes):
     1. Go to https://web3forms.com, enter Meridian's email.
     2. Copy the access key they email you.
     3. Paste it below as ACCESS_KEY, then push.

   The key is SAFE to have in a public file. Web3Forms designs
   it that way: it can only send mail TO you, never read it.

   Until a key is set, `configured` is false. The contact form
   then keeps its old placeholder behaviour, and the diagnostic
   still shows results but sends nothing. A warning is logged
   to the console so this can't be missed in testing.
   ============================================================ */
(function () {
  "use strict";

  var ACCESS_KEY = "";   // ← paste the Web3Forms access key here

  var ENDPOINT = "https://api.web3forms.com/submit";

  /** POST one submission. Resolves true on success, false on any failure. */
  function send(subject, fields) {
    if (!ACCESS_KEY) return Promise.resolve(false);

    var body = { access_key: ACCESS_KEY, subject: subject, from_name: "Meridian website" };
    Object.keys(fields).forEach(function (k) { body[k] = fields[k]; });

    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (json) { return json.success === true; })
      .catch(function () { return false; });
  }

  if (!ACCESS_KEY && window.console) {
    console.warn("[Meridian] Forms are NOT connected: submissions go nowhere. Set ACCESS_KEY in /js/forms.js.");
  }

  window.MeridianForms = { configured: !!ACCESS_KEY, send: send };
})();
