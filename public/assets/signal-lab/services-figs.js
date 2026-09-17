/* ============================================================
   services-figs.js — instrument technique for e5enclave.com/services/
   Two play-once film frames ("failover route replay",
   "cutover sweep") in the signal-lab register.
   Fail-open ladder: reduced-motion => labeled settled end-state;
   no GSAP/DrawSVG => static settled SVG; no JS => complete page.
   All behavior is DESIGNED/SIMULATED; permanent on-frame bugs.
   ============================================================ */
(function () {
'use strict';

var reduced = false;
try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
var hasGsap = typeof window.gsap !== 'undefined';
var hasST = typeof window.ScrollTrigger !== 'undefined';
var bootT0 = (window.performance && performance.now) ? performance.now() : 0;

/* data-attribute boot stamp: mode + init ms (measured, honest) */
function stamp(mode, ms) {
  try {
    document.documentElement.setAttribute('data-slab', mode);
    document.documentElement.setAttribute('data-slab-ms', String(Math.round(ms)));
  } catch (e) {}
}

/* ---------------- FIG.01 — failover route replay ---------------- */
function failover() {
  var frame = document.getElementById('fig-failover');
  if (!frame) return;
  var scrub = frame.querySelector('.ff-scrub');
  var playBtn = frame.querySelector('.ff-play');
  var replayBtn = frame.querySelector('.ff-replay');
  var stateEl = document.getElementById('ff-state');
  var priDots = frame.querySelectorAll('.ff-dp');
  var bkpDots = frame.querySelectorAll('.ff-db');

  /* Labeled settled end-state when motion is off or libs missing. */
  if (reduced || !hasGsap) {
    if (stateEl) stateEl.textContent = 'SETTLED · BACKUP CARRYING TRAFFIC (DESIGNED)';
    if (scrub) scrub.style.display = 'none';
    if (playBtn) playBtn.style.display = 'none';
    if (replayBtn) replayBtn.style.display = 'none';
    return;
  }

  /* Frame 0 = normal operations: primary carrying traffic. */
  gsap.set('#ff-pri', { opacity: 0.9 });
  gsap.set('#ff-bkp', { opacity: 0.3 });
  gsap.set(priDots, { opacity: 1 });
  gsap.set(bkpDots, { opacity: 0.15 });
  gsap.set('#ff-x', { opacity: 0 });

  function setState(t) { if (stateEl) stateEl.textContent = t; }

  var tl = gsap.timeline({ paused: true, defaults: { ease: 'power1.inOut' },
    onUpdate: function () { if (scrub) scrub.value = tl.progress(); } });

  /* t=0.0  normal operations */
  tl.call(function () { setState('PRIMARY CARRYING TRAFFIC (DESIGNED)'); }, null, 0);

  /* t=0.2  primary failure — X flashes 3x (0.09s each, ends 0.74) */
  tl.call(function () { setState('PRIMARY LINK DOWN (DESIGNED)'); }, null, 0.2);
  tl.fromTo('#ff-x', { opacity: 0 }, { opacity: 1, duration: 0.09, repeat: 5, yoyo: true, ease: 'none' }, 0.2);

  /* t=0.74 -> 1.34  the mandatory 600ms honest gap: nothing good happens */
  tl.to('#ff-pri', { opacity: 0.12, duration: 0.6, ease: 'none' }, 0.74);
  tl.to(priDots, { opacity: 0.1, duration: 0.6, ease: 'none' }, 0.74);

  /* t=1.34  backup reroute — dashed line strengthens, dots cascade in */
  tl.call(function () { setState('BACKUP CARRYING TRAFFIC (DESIGNED)'); }, null, 1.34);
  tl.to('#ff-bkp', { opacity: 1, duration: 0.5, ease: 'none' }, 1.34);
  tl.to(bkpDots, { opacity: 1, duration: 0.3, stagger: 0.08, ease: 'none' }, 1.4);

  /* t=2.4  settled designed state */
  tl.call(function () { setState('SETTLED · BACKUP CARRYING TRAFFIC (DESIGNED)'); }, null, 2.4);
  tl.to({}, { duration: 0.3 }, 2.4); /* hold the settled frame */

  function syncPlayLabel() {
    if (playBtn) playBtn.textContent = tl.paused() ? '▶ PLAY' : '❚❚ PAUSE';
  }
  if (playBtn) {
    playBtn.addEventListener('click', function () {
      if (tl.progress() >= 1) tl.restart(); else if (tl.paused()) tl.play(); else tl.pause();
      syncPlayLabel();
    });
    tl.eventCallback('onComplete', syncPlayLabel);
    syncPlayLabel();
  }
  if (replayBtn) {
    replayBtn.addEventListener('click', function () { tl.restart(); syncPlayLabel(); });
  }
  if (scrub) {
    scrub.setAttribute('max', '1'); scrub.setAttribute('step', '0.001'); scrub.value = 0;
    scrub.setAttribute('aria-label', 'Scrub the failover replay timeline');
    scrub.addEventListener('input', function () {
      tl.pause(); tl.progress(parseFloat(scrub.value) || 0); syncPlayLabel();
    });
  }
}

/* ---------------- FIG.02 — cutover sweep ---------------- */
function rollout() {
  var frame = document.getElementById('fig-rollout');
  if (!frame) return;
  var replayBtn = frame.querySelector('.ff-replay');
  var nodes = frame.querySelectorAll('.ro-node');
  var checks = frame.querySelectorAll('.ro-check');
  var scan = document.getElementById('ro-scan');

  if (reduced || !hasGsap) {
    if (replayBtn) replayBtn.style.display = 'none';
    if (scan) scan.style.display = 'none';
    return; /* static settled grid stays fully visible */
  }

  gsap.set(nodes, { opacity: 0.18 });
  gsap.set(checks, { opacity: 0 });
  gsap.set(scan, { xPercent: -110 });

  var tl = gsap.timeline({ paused: true, defaults: { ease: 'power1.inOut' } });
  /* scan sweeps left->right over 1.6s; nodes light as it passes */
  tl.to(scan, { xPercent: 110, duration: 1.6, ease: 'none' }, 0);
  tl.to(nodes, { opacity: 1, duration: 0.25, stagger: 0.1, ease: 'none' }, 0.1);
  /* checklist draws after the sweep */
  tl.to(checks, { opacity: 1, duration: 0.3, stagger: 0.22, ease: 'none' }, 1.7);
  tl.to({}, { duration: 0.4 }, 2.6); /* hold the settled frame */

  function playOnce() {
    if (hasST) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.create({
        trigger: frame, start: 'top 80%', once: true,
        onEnter: function () { tl.play(0); }
      });
    } else { tl.play(0); }
  }
  if (replayBtn) {
    replayBtn.addEventListener('click', function () { tl.restart(); });
  }
  playOnce();
}

/* ---------------- boot ---------------- */
function boot() {
  try {
    failover();
    rollout();
    var ms = ((window.performance && performance.now) ? performance.now() : 0) - bootT0;
    stamp(reduced ? 'reduced' : (hasGsap ? 'animated' : 'static'), ms);
  } catch (e) {
    stamp('static', 0);
    if (window.console && console.warn) console.warn('services-figs: init failed open', e);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
