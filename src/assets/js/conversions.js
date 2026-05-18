/**
 * E5 Enclave — Conversion Tracking
 * Fires gtag() conversion events for all 5 Phase 3 conversion actions.
 * Hooks: form submit success, donate CTA click, blog time-on-page.
 * GAds account: AW-16672489240
 * Conversion action IDs mapped below.
 */
(function () {
  'use strict';

  var GADS_ID = 'AW-16672489240';

  var CONV = {
    coalition:  '7609362945',  // E5 — Coalition Application Submitted
    volunteer:  '7609013246',  // E5 — Volunteer Application Submitted
    contact:    '7609013249',  // E5 — Contact Form Submitted
    donate:     '7608943409',  // E5 — Donate Page CTA Click
    blog3min:   '7609013252',  // E5 — Blog Engagement 3+ Minutes
  };

  function fireConversion(actionId) {
    if (typeof gtag !== 'function') return;
    gtag('event', 'conversion', {
      send_to: GADS_ID + '/' + actionId,
    });
  }

  /* ── FORM SUBMIT CONVERSIONS ── */
  /* Hooks into data-subject attribute set on each form */
  document.addEventListener('DOMContentLoaded', function () {

    /* Form success observer — watch .vc-form-success for 'show' class */
    var successEls = document.querySelectorAll('.vc-form-success');
    successEls.forEach(function (el) {
      var form = el.closest('.vc-form-wrap, section, main')
                   ? el.closest('.vc-form-wrap, section, main').querySelector('[data-vc-form]')
                   : null;
      if (!form) return;

      var subject = form.dataset.subject || '';
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          if (m.type === 'attributes' && m.attributeName === 'class') {
            if (el.classList.contains('show')) {
              if (subject === 'coalition-apply')  fireConversion(CONV.coalition);
              if (subject === 'volunteer-apply')  fireConversion(CONV.volunteer);
              if (subject === 'contact')          fireConversion(CONV.contact);
            }
          }
        });
      });
      observer.observe(el, { attributes: true });
    });

    /* ── DONATE CTA CLICK ── */
    var donateBtns = document.querySelectorAll(
      'a[href*="/donate/"], button[data-action="donate"], .vc-donate-cta'
    );
    donateBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        fireConversion(CONV.donate);
      });
    });

    /* ── BLOG 3-MINUTE ENGAGEMENT ── */
    if (document.body.dataset.pageType === 'post' ||
        window.location.pathname.indexOf('/blog/') === 0) {
      var fired = false;
      setTimeout(function () {
        if (!fired) {
          fired = true;
          fireConversion(CONV.blog3min);
          if (typeof gtag === 'function') {
            gtag('event', 'blog_3min_engagement', {
              event_category: 'engagement',
              event_label: window.location.pathname,
            });
          }
        }
      }, 180000); /* 3 minutes = 180,000 ms */
    }
  });

})();
