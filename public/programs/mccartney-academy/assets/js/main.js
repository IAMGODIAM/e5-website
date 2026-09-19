/* ============================================================
   McCartney Academy — enhancement layer (P16)
   - js flag for progressive enhancement
   - gold-dust particles (finite, decorative)
   - scroll reveals (fail-open: no-JS shows everything)
   - FAQ accordion (no-JS: all answers open)
   - smooth anchor offset for fixed header
   Nothing here hides content. Removing this file loses
   motion only — the document stays complete.
   ============================================================ */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Gold dust: a few drifting motes in the hero ---------- */
  try {
    var dust = document.querySelector('.hero-dust');
    if (dust && !reduced) {
      var COUNT = 26;
      for (var i = 0; i < COUNT; i++) {
        var mote = document.createElement('i');
        mote.style.left = (Math.random() * 100).toFixed(2) + '%';
        mote.style.top = (35 + Math.random() * 60).toFixed(2) + '%';
        mote.style.animationDelay = (1.2 + Math.random() * 4.5).toFixed(2) + 's';
        mote.style.animationDuration = (5 + Math.random() * 5).toFixed(2) + 's';
        var s = (1.5 + Math.random() * 2.5).toFixed(1);
        mote.style.width = s + 'px';
        mote.style.height = s + 'px';
        dust.appendChild(mote);
      }
    }
  } catch (e) { /* decorative only — never break the page */ }

  /* ---------- Scroll reveals: add .in on entry; start visible without JS ---------- */
  try {
    var revealEls = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window && !reduced && revealEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }
  } catch (e) { /* content stays visible regardless */ }

  /* ---------- FAQ accordion ---------- */
  try {
    var items = document.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      var btn = item.querySelector('.faq-q');
      var panel = item.querySelector('.faq-a');
      if (!btn || !panel) return;

      var panelId = panel.id || ('faq-a-' + Math.random().toString(36).slice(2, 8));
      panel.id = panelId;
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', panelId);
      panel.setAttribute('role', 'region');

      btn.addEventListener('click', function () {
        var open = item.classList.contains('open');
        // Single-open: close the rest
        items.forEach(function (other) {
          other.classList.remove('open');
          var ob = other.querySelector('.faq-q');
          if (ob) ob.setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });

      btn.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          btn.click();
        }
      });
    });
  } catch (e) { /* answers remain open without JS */ }

  /* ---------- Anchor offset under the fixed header ---------- */
  try {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        ev.preventDefault();
        var head = document.querySelector('.site-head');
        var offset = (head ? head.offsetHeight : 70) + 18;
        var y = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  } catch (e) { /* native anchors still work */ }
})();
