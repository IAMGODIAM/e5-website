/* ============================================================
   p33-measure.js — hero instrumentation for Project 2033
   Six-event taxonomy per the ratified cinematic hero rule §8:
   hero_view, hero_cta_impression, hero_cta_click,
   hero_goal_start, hero_goal_complete, hero_media_state.
   Fires into the site's GA4 (gtag, baked in sovereign chrome).
   Async, non-blocking, after LCP. Attribution: hero_id +
   cta_id on every event; hero_goal_complete carries both.
   No PII: labels are our own CTA text, destinations are
   in-page anchors. Fail-closed: no gtag => silent no-op.
   ============================================================ */
(function () {
'use strict';

function fire(name, params) {
  try {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, params || {});
  } catch (e) {}
}

var hero = document.querySelector('[data-hero-id]');
if (!hero) return;
var HERO_ID = hero.getAttribute('data-hero-id') || 'p33-hero';
var GOAL = hero.getAttribute('data-hero-goal') || 'share';
var PAGE = (function () {
  try { return window.location.pathname; } catch (e) { return '/project-2033/'; }
})();

function afterLCP(fn) {
  /* instrumentation never blocks the critical path */
  try {
    if ('requestIdleCallback' in window) { requestIdleCallback(fn, { timeout: 3000 }); }
    else { setTimeout(fn, 1200); }
  } catch (e) { setTimeout(fn, 1200); }
}

/* ---- hero_view: hero entered viewport, once per pageview ---- */
try {
  var viewed = false;
  var vio = new IntersectionObserver(function (entries) {
    for (var k = 0; k < entries.length; k++) {
      if (entries[k].isIntersecting && !viewed) {
        viewed = true;
        afterLCP(function () {
          fire('hero_view', {
            page: PAGE, hero_id: HERO_ID, variant: 'cinematic', goal: GOAL
          });
        });
        vio.disconnect();
      }
    }
  }, { threshold: 0.25 });
  vio.observe(hero);
} catch (e) {}

/* ---- hero_cta_impression: CTA cluster rendered interactively ---- */
function impressions() {
  try {
    var ctas = hero.querySelectorAll('[data-cta-id]');
    for (var i = 0; i < ctas.length; i++) {
      fire('hero_cta_impression', {
        hero_id: HERO_ID,
        cta_id: ctas[i].getAttribute('data-cta-id'),
        position: ctas[i].getAttribute('data-cta-position') || 'secondary'
      });
    }
  } catch (e) {}
}
try {
  window.addEventListener('load', function () { afterLCP(impressions); });
} catch (e) {}

/* ---- hero_cta_click + hero_goal_start ---- */
try {
  hero.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-cta-id]') : null;
    if (!el) return;
    var ctaId = el.getAttribute('data-cta-id');
    var label = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    var dest = el.getAttribute('href') || '';
    fire('hero_cta_click', {
      hero_id: HERO_ID, cta_id: ctaId, label: label,
      destination: dest,
      position: el.getAttribute('data-cta-position') || 'secondary'
    });
    /* the hero CTAs navigate to the argument sections — the
       instrument is the section the reader is carried into */
    fire('hero_goal_start', { goal: GOAL, hero_id: HERO_ID, cta_id: ctaId });
  });
} catch (e) {}

/* ---- hero_goal_complete: brief downloaded / statement copied ----
   Dispatched as p33:goal-complete by p33-cinematic.js; the CTA
   section buttons carry the same cta_id scheme for funnel parity. */
try {
  document.addEventListener('p33:goal-complete', function (e) {
    var ctaId = (e.detail && e.detail.ctaId) || 'unknown';
    fire('hero_goal_complete', {
      goal: GOAL, hero_id: HERO_ID, cta_id: ctaId
    });
  });
  /* goal_start for the CTA-section instruments (click => instrument opens) */
  var act = document.getElementById('act');
  if (act) {
    act.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-cta-id]') : null;
      if (!el) return;
      fire('hero_goal_start', {
        goal: GOAL, hero_id: HERO_ID, cta_id: el.getAttribute('data-cta-id')
      });
    });
  }
} catch (e) {}

/* ---- hero_media_state: fallback engaged (once per session per hero) ---- */
try {
  var mediaFired = {};
  try {
    mediaFired = JSON.parse(sessionStorage.getItem('p33-media-state') || '{}');
  } catch (e2) {}
  document.addEventListener('p33:media-state', function (e) {
    var fb = (e.detail && e.detail.fallback) || 'unknown';
    if (mediaFired[HERO_ID + ':' + fb]) return;
    mediaFired[HERO_ID + ':' + fb] = 1;
    try { sessionStorage.setItem('p33-media-state', JSON.stringify(mediaFired)); } catch (e2) {}
    afterLCP(function () {
      fire('hero_media_state', { hero_id: HERO_ID, fallback: fb });
    });
  });
} catch (e) {}
})();
