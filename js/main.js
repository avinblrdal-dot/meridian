/* ============================================================
   MERIDIAN — Site interactions
   - Mobile nav toggle
   - Sticky header shadow on scroll
   - Subtle scroll-in reveal (IntersectionObserver)
   - Lead form (stubbed until a backend is wired — see index.html)
   ============================================================ */
(function () {
  "use strict";

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

  /* --- Auto-hide nav (mouse/trackpad only — see the matching
     "(hover: hover) and (pointer: fine)" block in styles.css) ---
     Hidden above the viewport by default. Scrolling down hides it (or
     keeps it hidden); scrolling up reveals it. The cursor can also pull
     it into view directly — near the very top edge (#navHoverZone) or
     hovering the header itself — and it stays visible while a header
     link has keyboard focus or the mobile menu is open. */
  var hoverZone = document.getElementById("navHoverZone");
  var hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (header && hoverZone && hoverCapable) {
    var isHovering = false;
    var showNav = function () { header.classList.add("nav-visible"); };
    var hideNav = function () {
      if (isHovering) return;
      if (links && links.classList.contains("open")) return;      // mobile menu open
      if (header.contains(document.activeElement)) return;         // keyboard focus inside
      header.classList.remove("nav-visible");
    };
    hoverZone.addEventListener("mouseenter", function () { isHovering = true; showNav(); });
    header.addEventListener("mouseenter", function () { isHovering = true; showNav(); });
    header.addEventListener("mouseleave", function () { isHovering = false; hideNav(); });
    header.addEventListener("focusin", showNav);
    header.addEventListener("focusout", function () { setTimeout(hideNav, 0); });
    if (toggle) toggle.addEventListener("click", showNav);

    // Scroll direction only: down hides it, up shows it.
    var lastY = window.scrollY;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y > lastY) hideNav();       // scrolling down
      else if (y < lastY) showNav();  // scrolling up
      lastY = y;
    }, { passive: true });
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
