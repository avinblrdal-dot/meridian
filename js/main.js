(function () {
  "use strict";

  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  if (nav && toggle) {
    var setOpen = function (open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  }

  // The header tucks away while scrolling down and comes back on scroll up,
  // or when the pointer reaches the top edge of the window.
  var header = document.querySelector(".site-header");
  if (header) {
    var lastY = window.scrollY;
    header.classList.toggle("scrolled", lastY > 8);
    var keepOpen = function () {
      return (nav && nav.classList.contains("open")) || header.contains(document.activeElement);
    };
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      header.classList.toggle("scrolled", y > 8);
      if (y > lastY && y > 120 && !keepOpen()) header.classList.add("tucked");
      else if (y < lastY) header.classList.remove("tucked");
      lastY = y;
    }, { passive: true });
    document.addEventListener("mousemove", function (e) {
      if (e.clientY < 24) header.classList.remove("tucked");
    }, { passive: true });
    header.addEventListener("focusin", function () { header.classList.remove("tucked"); });
  }

  // The hero email box carries the address down to the full form.
  var heroForm = document.getElementById("heroForm");
  if (heroForm) {
    heroForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("email");
      if (email) email.value = document.getElementById("heroEmail").value.trim();
      document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
      var name = document.getElementById("name");
      if (name) name.focus({ preventScroll: true });
    });
  }

  // Metric graphics animate once, the first time the panel scrolls into view.
  var metrics = document.getElementById("metrics");
  if (metrics) {
    if ("IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { metrics.classList.add("in"); seen.disconnect(); }
      }, { threshold: 0.4 });
      seen.observe(metrics);
    } else {
      metrics.classList.add("in");
    }
  }

  var carousel = document.getElementById("carousel");
  if (carousel) {
    var track = carousel.querySelector(".carousel-track");
    carousel.querySelectorAll(".round-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = track.querySelector(".tool-card");
        var step = card ? card.getBoundingClientRect().width + 20 : 320;
        track.scrollBy({ left: step * Number(btn.dataset.dir), behavior: "smooth" });
      });
    });
  }

  var calcIds = ["inCalls", "inTicket", "inLost"];
  if (document.getElementById("inCalls")) {
    var money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
    var read = function (id, max) {
      var v = parseFloat(document.getElementById(id).value);
      return isFinite(v) ? Math.min(Math.max(v, 0), max) : 0;
    };
    var update = function () {
      var calls = read("inCalls", 500);
      var ticket = read("inTicket", 2000);
      var lost = read("inLost", 100) / 100;
      var week = calls * ticket * lost;
      document.getElementById("calcYear").textContent = money(week * 52);
      document.getElementById("calcWeek").textContent = money(week);
      document.getElementById("calcCalls").textContent = Math.round(calls * 52).toLocaleString("en-US");
      document.getElementById("calcLine").textContent =
        "from " + calls + " missed call" + (calls === 1 ? "" : "s") + " a week";
    };
    calcIds.forEach(function (id) { document.getElementById(id).addEventListener("input", update); });
    update();
  }

  var form = document.getElementById("leadForm");
  if (form) {
    var done = document.getElementById("formSuccess");
    var error = document.getElementById("formError");
    var submit = form.querySelector('button[type="submit"]');
    var label = submit.textContent;

    var showError = function (message) {
      error.textContent = message;
      error.hidden = false;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      error.hidden = true;

      var forms = window.MeridianForms;
      if (!forms || !forms.configured) {
        showError("The form isn't connected yet, so this message can't be sent.");
        return;
      }

      var fields = {};
      new FormData(form).forEach(function (v, k) { fields[k] = v; });

      submit.disabled = true;
      submit.textContent = "Sending...";
      forms.send("New intro call request: " + (fields.business || fields.name), fields).then(function (ok) {
        submit.disabled = false;
        submit.textContent = label;
        if (ok) {
          form.hidden = true;
          done.hidden = false;
        } else {
          showError("That didn't send. Check your connection and try again.");
        }
      });
    });
  }
})();
