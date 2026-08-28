/* ============================================================
   MERIDIAN — Site interactions
   - Mobile nav toggle
   - Sticky header shadow on scroll
   - Subtle scroll-in reveal (IntersectionObserver)
   - Hero glow: subtle cursor-follow parallax (desktop, motion-safe)
   - Lead form (stubbed until a backend is wired — see index.html)
   ============================================================ */
(function () {
  "use strict";

  /* --- Hero glow parallax: the sunburst drifts gently toward the cursor.
     Only on precise pointers (mouse/trackpad) and only when the visitor
     hasn't asked for reduced motion. --- */
  var heroEl = document.querySelector(".hero");
  var glowEl = document.querySelector(".hero-glow");
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (heroEl && glowEl && finePointer && !reduceMotion) {
    var ticking = false;
    var lastX = 0;
    var lastY = 0;
    var applyShift = function () {
      glowEl.style.setProperty("--glow-shift-x", lastX + "px");
      glowEl.style.setProperty("--glow-shift-y", lastY + "px");
      ticking = false;
    };
    heroEl.addEventListener("mousemove", function (e) {
      var rect = heroEl.getBoundingClientRect();
      var nx = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 .. 0.5
      var ny = (e.clientY - rect.top) / rect.height - 0.5;
      lastX = Math.round(nx * 26);
      lastY = Math.round(ny * 22);
      if (!ticking) {
        window.requestAnimationFrame(applyShift);
        ticking = true;
      }
    });
    heroEl.addEventListener("mouseleave", function () {
      lastX = 0; lastY = 0;
      window.requestAnimationFrame(applyShift);
    });
  }

  /* --- Mobile nav toggle --- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    // Close the menu after tapping a link (mobile)
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      }
    });
  }

  /* --- Sticky header shadow on scroll --- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* --- Subtle scroll-in reveal (IntersectionObserver) --- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    // Fallback: no IO support — just show everything
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* --- Lead form (stubbed) ---
     Validates required fields, then swaps in the thank-you message.
     To make it live, see the "CONTACT FORM" note in index.html and
     replace the block below with a real submit (fetch to your endpoint). */
  var form = document.getElementById("leadForm");
  var success = document.getElementById("formSuccess");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      // TODO: send `new FormData(form)` to your endpoint here.
      form.style.display = "none";
      if (success) {
        success.classList.add("show");
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
})();
