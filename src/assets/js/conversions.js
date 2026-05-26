/**
 * E5 Enclave — Conversion Tracking v3
 * GA4 native events + Google Ads conversion fires.
 * GAds: AW-16672489240 | GA4: G-05PYDYP5S0
 * Updated: 2026-05-26 — Updated coalition conversion label to AW-16672489240/uHAvCIHUtqwcEJj-h44-
 */
(function () {
  'use strict';

  var GADS_ID = 'AW-16672489240';
  var GA4_ID  = 'G-05PYDYP5S0';

  var CONV = {
    coalition:  'uHAvCIHUtqwcEJj-h44-',
    volunteer:  '7609013246',
    contact:    '7609013249',
    donate:     '7608943409',
    blog3min:   '7609013252',
  };

  function fireConversion(actionId) {
    if (typeof gtag !== 'function') return;
    gtag('event', 'conversion', { send_to: GADS_ID + '/' + actionId });
  }

  function ga4Event(eventName, params) {
    if (typeof gtag !== 'function') return;
    gtag('event', eventName, params || {});
  }

  document.addEventListener('DOMContentLoaded', function () {

    /* ── FORM SUBMIT CONVERSIONS ── */
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
              if (subject === 'coalition-apply')  { fireConversion(CONV.coalition); ga4Event('form_submit', {form_id: 'coalition_apply', form_name: 'Coalition Application'}); }
              if (subject === 'volunteer-apply')  { fireConversion(CONV.volunteer); ga4Event('form_submit', {form_id: 'volunteer_apply', form_name: 'Volunteer Application'}); }
              if (subject === 'contact')          { fireConversion(CONV.contact);   ga4Event('form_submit', {form_id: 'contact', form_name: 'Contact Form'}); }
              if (subject === 'karmelo-support')  { ga4Event('form_submit', {form_id: 'karmelo_support', form_name: 'Karmelo Supporter Signup'}); }
              if (subject === 'restitution-246')  { ga4Event('form_submit', {form_id: 'restitution_246', form_name: 'Restitution 246 Signup'}); }
            }
          }
        });
      });
      observer.observe(el, { attributes: true });
    });

    /* ── EMAIL CAPTURE FORMS (new dispatch signup forms) ── */
    var emailForms = document.querySelectorAll('form[action*="subscribe"]');
    emailForms.forEach(function(form) {
      form.addEventListener('submit', function() {
        ga4Event('email_capture', {
          form_location: window.location.pathname,
          list: 'liberation-dispatches'
        });
      });
    });

    /* ── DONATE CTA CLICK ── */
    var donateBtns = document.querySelectorAll(
      'a[href*="/donate/"], button[data-action="donate"], .vc-donate-cta'
    );
    donateBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        fireConversion(CONV.donate);
        ga4Event('donate_intent', { button_text: btn.textContent.trim().substring(0,50), page: window.location.pathname });
      });
    });

    /* ── SCROLL DEPTH (25%, 50%, 75%, 90%) ── */
    var scrollMilestones = [25, 50, 75, 90];
    var firedMilestones = {};
    function getScrollPct() {
      var el = document.documentElement;
      var scrolled = el.scrollTop || document.body.scrollTop;
      var total = el.scrollHeight - el.clientHeight;
      return total > 0 ? Math.round((scrolled / total) * 100) : 0;
    }
    window.addEventListener('scroll', function() {
      var pct = getScrollPct();
      scrollMilestones.forEach(function(m) {
        if (pct >= m && !firedMilestones[m]) {
          firedMilestones[m] = true;
          ga4Event('scroll', { percent_scrolled: m, page: window.location.pathname });
          if (m === 75) {
            ga4Event('deep_read', { page: window.location.pathname, page_title: document.title });
          }
        }
      });
    }, { passive: true });

    /* ── TIME ON PAGE (2min, 5min, 8min) ── */
    [120000, 300000, 480000].forEach(function(ms) {
      setTimeout(function() {
        ga4Event('time_on_page', { seconds: ms/1000, page: window.location.pathname });
        if (ms === 120000 && typeof fireConversion === 'function') {
          // 2 minute engagement — mark as blog engagement equivalent
          if (window.location.pathname.indexOf('/blog/') === 0) {
            fireConversion(CONV.blog3min);
            ga4Event('blog_3min_engagement', { page: window.location.pathname });
          }
        }
      }, ms);
    });

    /* ── OUTBOUND LINK TRACKING ── */
    document.querySelectorAll('a[href^="http"]').forEach(function(link) {
      if (!link.href.includes('e5enclave.com')) {
        link.addEventListener('click', function() {
          ga4Event('outbound_click', { url: link.href, page: window.location.pathname });
        });
      }
    });

    /* ── COALITION PAGE CONVERSION — fire on /coalition/apply/ page load ── */
    if (window.location.pathname.indexOf('/coalition/apply') === 0) {
      // Page-load fire for direct thank-you page visits
      var urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('submitted') === '1' || document.referrer.includes('/coalition/apply')) {
        fireConversion(CONV.coalition);
        ga4Event('coalition_applied', { page: window.location.pathname });
      }
    }

    /* ── STRIPE REFERRAL RECOVERY — detect return from checkout ── */
    if (document.referrer && document.referrer.includes('checkout.stripe.com')) {
      ga4Event('stripe_return', {
        landing_page: window.location.pathname,
        source: 'stripe_checkout'
      });
    }

  });

})();
