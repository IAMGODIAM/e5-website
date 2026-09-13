/* E5 Enclave · donate-genesis cinematic initializer
   Same pattern as /assets/cinematic/e5-cinematic.js (which only activates on
   "/" unless data-hyperframes): capability gating, quality tiers, reduced-motion,
   and a window.E5DonateCinematic API. DOM-first hero: the single ambient loop
   is a 2D canvas gold-leaf particle field — the vendored three-hero chunk
   (352KB) would breach the 150KB hero-module budget, so the hero is DOM-only
   per Brand Bible §10.2 (documented in build notes).
   Conversion goal: donate · hero-rule: ratified */
(function () {
  'use strict';

  var doc = document.documentElement;
  var hero = document.querySelector('.e5-hero');
  if (!hero) return;

  /* ---------- capability gating ---------- */
  function storedPref() {
    try {
      var v = localStorage.getItem('e5-motion');
      return v === 'reduced' ? true : v === 'full' ? false : null;
    } catch (e) { return null; }
  }
  var mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pref = storedPref();
  var reduced = pref === null ? mqReduced : pref;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var canvas = hero.querySelector('.e5-cinematic-canvas');
  var ctx = null;
  try { ctx = canvas ? canvas.getContext('2d') : null; } catch (e) { ctx = null; }

  /* quality tiers: full | reduced | static */
  var quality = 'full';
  if (reduced || saveData || !ctx) quality = 'static';
  else if (Math.min(window.screen.width || 9999, window.screen.height || 9999) < 380) quality = 'reduced';
  doc.classList.add('e5-quality-' + quality);
  doc.classList.toggle('e5-reduced-motion', reduced);

  /* ---------- instrumentation (hero event taxonomy, Brand Bible §7.6) ---------- */
  var heroId = hero.getAttribute('data-hero-id') || 'donate-genesis';
  var firedMediaState = false;
  function track(name, props) {
    try {
      if (typeof gtag === 'function') {
        var p = { page: '/donate/', hero_id: heroId, goal: 'donate' };
        for (var k in props) p[k] = props[k];
        gtag('event', name, p);
      }
    } catch (e) {}
  }
  function mediaState(fallback) {
    if (firedMediaState) return;
    firedMediaState = true;
    track('hero_media_state', { fallback: fallback });
  }
  if (quality === 'static') mediaState(reduced ? 'reduced-motion' : (saveData ? 'data-saver' : 'no-canvas'));

  /* ---------- entrance: one choreography, ≤900ms, stagger ≤120ms ---------- */
  var readyResolve;
  var ready = new Promise(function (res) { readyResolve = res; });
  function markReady() {
    if (doc.classList.contains('e5-cinematic-ready')) return;
    doc.classList.add('e5-cinematic-ready');
    track('hero_view', { variant: quality });
    readyResolve();
  }
  if (doc.classList.contains('js')) {
    requestAnimationFrame(function () { requestAnimationFrame(markReady); });
    setTimeout(markReady, 1600); /* failsafe: never leave the hero hidden */
  } else { markReady(); }

  /* CTA impression + click attribution */
  var ctaCluster = hero.querySelector('.e5-hero-ctas');
  if (ctaCluster && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          track('hero_cta_impression', { cta_id: 'hero-cta-cluster', position: 'primary' });
          io.disconnect();
        }
      });
    }, { threshold: 0.5 });
    io.observe(ctaCluster);
  }
  hero.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-cta-id]') : null;
    if (!a) return;
    var id = a.getAttribute('data-cta-id');
    track('hero_cta_click', { cta_id: id, label: (a.textContent || '').trim().slice(0, 40) });
    if (id === 'hero-give-monthly') track('hero_goal_start', { goal: 'donate', cta_id: id });
  });
  /* hero_goal_complete: no conversion instrument is wired on this page (the
     "Continue to Payment" control has no payment destination — Chairman's
     decision pending). The dispatch below is the future hook; it fires on the
     custom 'e5:donate-complete' event when a destination is wired. */
  document.addEventListener('e5:donate-complete', function (e) {
    var d = (e && e.detail) || {};
    track('hero_goal_complete', { goal: 'donate', cta_id: d.cta_id || 'give-continue', value: d.value });
  });

  /* ---------- the one ambient loop: gold-leaf particle field ---------- */
  var seal = hero.querySelector('.e5-hero-seal');
  var raf = 0, particles = [], W = 0, H = 0, running = false, lastT = 0;
  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

  function sizeCanvas() {
    if (!canvas) return;
    var r = hero.getBoundingClientRect();
    W = Math.max(1, Math.floor(r.width)); H = Math.max(1, Math.floor(r.height));
    canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function seed() {
    particles = [];
    var n = quality === 'full' ? Math.min(110, Math.floor(W / 13)) : Math.min(40, Math.floor(W / 26));
    for (var i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.8 + Math.random() * 2.4,
        vy: 0.08 + Math.random() * 0.28, sway: 6 + Math.random() * 22,
        ph: Math.random() * Math.PI * 2, sp: 0.4 + Math.random() * 0.9,
        warm: Math.random() < 0.72
      });
    }
  }
  function frame(t) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (t - lastT < 33) return; /* ~30fps cap: this loop is ambience, not cinema */
    lastT = t;
    ctx.clearRect(0, 0, W, H);
    var time = t / 1000;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.y -= p.vy; p.x += Math.sin(time * p.sp + p.ph) * 0.22;
      if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
      var tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * p.sp * 1.7 + p.ph));
      var col = p.warm ? '214,168,75' : '236,217,164';
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.2);
      g.addColorStop(0, 'rgba(' + col + ',' + (0.85 * tw).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2); ctx.fill();
    }
  }
  function start() {
    if (running || quality === 'static' || !ctx) return;
    sizeCanvas(); if (!particles.length) seed();
    running = true; lastT = 0; raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf); raf = 0;
    if (ctx && quality === 'static') { sizeCanvas(); ctx.clearRect(0, 0, W, H); }
  }
  /* composed static frame for the static tier: a few settled motes, no loop */
  function paintStatic() {
    if (!ctx) return;
    sizeCanvas(); seed(); ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i], col = p.warm ? '214,168,75' : '236,217,164';
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.2);
      g.addColorStop(0, 'rgba(' + col + ',0.5)'); g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* pause offscreen / hidden — the loop is decorative, never essential */
  var heroVisible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible) start(); else stop();
    }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else if (heroVisible) start();
  });
  var rzT = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rzT);
    rzT = setTimeout(function () { sizeCanvas(); seed(); if (quality === 'static') paintStatic(); }, 220);
  });

  /* ---------- decorative parallax (never on CTA/headline legibility) ---------- */
  var pxRaf = 0;
  function parallax() {
    pxRaf = 0;
    if (reduced || quality === 'static') return;
    var y = window.scrollY || window.pageYOffset;
    if (y > H * 1.2) return;
    if (canvas) canvas.style.transform = 'translate3d(0,' + (y * 0.10).toFixed(1) + 'px,0)';
    if (seal) seal.style.translate = '0 calc(-50% + ' + (y * -0.05).toFixed(1) + 'px)';
  }
  window.addEventListener('scroll', function () {
    if (!pxRaf) pxRaf = requestAnimationFrame(parallax);
  }, { passive: true });

  /* ---------- motion toggle (estate pattern: persist + reload) ---------- */
  var toggle = hero.querySelector('.e5-hero-motion');
  if (toggle) {
    toggle.textContent = reduced ? 'Motion: reduced' : 'Motion: full';
    toggle.setAttribute('aria-pressed', String(reduced));
    toggle.addEventListener('click', function () {
      try { localStorage.setItem('e5-motion', reduced ? 'full' : 'reduced'); } catch (e) {}
      location.reload();
    }, { once: true });
  }

  /* ---------- giving-instrument live region (announces, never alters) ---------- */
  var status = document.getElementById('give-status');
  function freqWord() {
    var f = document.querySelector('input[name="freq"]:checked');
    return f && f.value === 'once' ? 'one-time' : 'per month';
  }
  function announceTier(input) {
    if (!status || !input) return;
    var card = input.closest('.e5-tier');
    var amt = card ? (card.querySelector('.tier__amount') || {}).textContent : '';
    amt = (amt || '').replace(/\s+/g, ' ').trim();
    status.textContent = amt + ' ' + freqWord() + ' selected.';
  }
  Array.prototype.forEach.call(document.querySelectorAll('input[name="amount"]'), function (input) {
    input.addEventListener('change', function () { announceTier(input); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('input[name="freq"]'), function (input) {
    input.addEventListener('change', function () {
      var sel = document.querySelector('input[name="amount"]:checked');
      if (status && sel) announceTier(sel);
    });
  });

  /* ---------- boot ---------- */
  if (quality === 'static') paintStatic(); else start();

  /* ---------- public API (E5Cinematic-style) ---------- */
  window.E5DonateCinematic = {
    ready: ready,
    setReducedMotion: function (b) {
      try { localStorage.setItem('e5-motion', b ? 'reduced' : 'full'); } catch (e) {}
      location.reload();
    },
    getState: function () {
      return {
        compositionId: 'donate-genesis', goal: 'donate', quality: quality,
        reducedMotion: doc.classList.contains('e5-reduced-motion'),
        heroRule: 'ratified'
      };
    },
    destroy: function () { stop(); },
    /* future hook: fire when a payment destination is wired + completes */
    trackGoalComplete: function (detail) {
      document.dispatchEvent(new CustomEvent('e5:donate-complete', { detail: detail || {} }));
    }
  };
})();
