/* ============================================================
   p33-cinematic.js — Project 2033 hub motion choreography
   Single engine: GSAP (vendored) + ScrollTrigger + Lenis.
   - Staged hero entrance (<=900ms) + variable-font weight swell
   - ScrollTrigger reveals (stagger <=120ms), SplitText ledes
   - Lenis smooth scroll (reduced-motion => native)
   - Counters, tilt, monument parallax, faq progress, grain toggle
   - Brief download + core-statement copy (copy verbatim, 2026-09-12)
   Fail-closed per subsystem: CSS staged states + no-JS fallbacks
   survive any vendor failure. Decorative motion never breaks copy.
   ============================================================ */
(function () {
'use strict';

var docEl = document.documentElement;
var reduced = false;
try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

var hasGsap = typeof window.gsap !== 'undefined';
var hasST = typeof window.ScrollTrigger !== 'undefined';
var hasSplit = typeof window.SplitText !== 'undefined';
var useGsap = hasGsap && hasST && !reduced;
if (hasGsap && hasST) { try { gsap.registerPlugin(ScrollTrigger); } catch (e) {} }

/* ---------------- 0. Lenis smooth scroll ----------------
   Lenis is the active smoother. ScrollSmoother is vendored
   (per plan) but NOT activated: it requires a body wrapper
   restructure that risks the baked sovereign chrome. */
var lenis = null;
try {
  if (!reduced && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var rafLenis = function (t) { lenis.raf(t); requestAnimationFrame(rafLenis); };
      requestAnimationFrame(rafLenis);
    }
  }
} catch (e) { lenis = null; }

/* ---------------- 1. staged hero entrance ----------------
   Visible-by-default: hero text is NEVER hidden by markup/CSS alone.
   The p33-cine staging class is added here, by JS, in the same task that
   builds the GSAP timeline — so no-JS users and any pre-animation JS
   failure always see the headline. Reduced-motion => never staged =>
   instant visible state, never a stuck transform. */
function cssStage() {
  try { docEl.classList.add('p33-cine'); } catch (e) {}
}
function cssRelease() {
  try { docEl.classList.add('p33-cine-go'); } catch (e) {}
}

try {
  if (useGsap) {
    /* GSAP drives the entrance: kicker -> H1 lines (masked) ->
       deck -> panel, total <=900ms, stagger <=120ms. The CSS
       -go class is never added on this path; inline GSAP
       values override the .p33-cine stylesheet states. */
    cssStage();
    var h1 = document.getElementById('hero-title');
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo('.p33-hero-kicker', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5 }, 0)
      /* y:0 in BOTH vars: the CSS staged state (translateY(110%)) computes to a
         pixel matrix that GSAP parses as y; without y:0 that pixel offset is never
         animated and the headline sticks at +110% forever. (Ship-blocking bug.)
         opacity is in the tween too: the staged state sets opacity:0 and the
         GSAP path never adds p33-cine-go, so nothing else would fade it in. */
      .fromTo('.p33-h1-line', { yPercent: 110, y: 0, opacity: 0 }, { yPercent: 0, y: 0, opacity: 1, duration: 0.7, stagger: 0.12 }, 0.1)
      .fromTo('.p33-hero-deck', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5 }, 0.35)
      .fromTo('.p33-hero-panel', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4 }, 0.5);
    /* variable-font weight swell on the headline: 340 -> 520 */
    if (h1) {
      var w = { v: 340 };
      gsap.to(w, {
        v: 520, duration: 0.8, ease: 'expo.out', delay: 0.1,
        onUpdate: function () {
          h1.style.fontVariationSettings = '"wght" ' + w.v.toFixed(0);
        },
        onComplete: function () { h1.style.fontVariationSettings = ''; }
      });
    }
    /* backstop: if ANY hero target is still hidden or stuck at an
       offset (not just the kicker), CSS release. Catches partial
       timeline failures like the stuck-h1 regression. */
    setTimeout(function () {
      try {
        var stuck = false;
        var k = document.querySelector('.p33-hero-kicker');
        if (k && parseFloat(getComputedStyle(k).opacity) < 0.5) stuck = true;
        var h1ls = document.querySelectorAll('.p33-h1-line');
        for (var hi = 0; hi < h1ls.length && !stuck; hi++) {
          var m = getComputedStyle(h1ls[hi]).transform;
          /* settled = none | matrix(1,0,0,1,0,0); anything else = stuck mid-offset */
          if (m && m !== 'none' && !/^matrix\(1,\s*0,\s*0,\s*1,\s*0,\s*0(\.0+)?\)$/.test(m)) stuck = true;
        }
        if (stuck) cssRelease();
      } catch (e) { cssRelease(); }
    }, 2200);
  } else if (reduced) {
    /* reduced-motion: never staged => instant visible state, no transitions,
       no stuck transforms. (The CSS reduced-motion block is belt-and-braces.) */
  } else {
    /* no-GSAP path: CSS transition entrance, staged only once JS commits to it */
    cssStage();
    requestAnimationFrame(function () { requestAnimationFrame(cssRelease); });
    window.addEventListener('load', function () { setTimeout(cssRelease, 1500); });
  }
} catch (e) { cssRelease(); }

/* ---------------- 2. scroll reveals ---------------- */
function revealFinal(els) {
  for (var i = 0; i < els.length; i++) {
    els[i].classList.add('in');
    els[i].style.opacity = '1';
    els[i].style.transform = 'none';
  }
}
try {
  var scope = document.getElementById('p33-main');
  var revealEls = scope ? Array.prototype.slice.call(scope.querySelectorAll('.p33-reveal')) : [];
  var splitLineSets = []; /* SplitText lede lines, for the failsafe below */

  /* failsafe FIRST: everything visible by load + 1.4s, including SplitText
     ledes (which are spliced out of revealEls below). Registered before any
     reveal machinery runs so an exception in setup can't skip it. */
  window.addEventListener('load', function () {
    setTimeout(function () {
      revealFinal(revealEls);
      try {
        if (useGsap) {
          for (var s = 0; s < splitLineSets.length; s++) {
            /* y:0 alongside yPercent: same parsed-pixel-offset hazard as the
               hero h1 — never leave a translated line behind */
            gsap.set(splitLineSets[s], { yPercent: 0, y: 0 });
          }
        }
      } catch (e2) {}
      if (hasST) { try { ScrollTrigger.refresh(); } catch (e) {} }
    }, 1400);
  });

  /* SplitText masked line reveals for section ledes (not reduced-motion) */
  if (useGsap && hasSplit) {
    try {
      var ledes = [];
      for (var li = 0; li < revealEls.length; li++) {
        if (revealEls[li].classList.contains('p33-lede')) ledes.push(revealEls[li]);
      }
      for (var s2 = 0; s2 < ledes.length; s2++) (function (lede) {
        var split = new SplitText(lede, { type: 'lines', mask: 'lines' });
        var lines = split.lines || [];
        splitLineSets.push(lines);
        /* remove from the generic batch so it isn't double-animated */
        var ix = revealEls.indexOf(lede);
        if (ix > -1) revealEls.splice(ix, 1);
        gsap.set(lines, { yPercent: 110 });
        gsap.set(lede, { opacity: 1, y: 0 });
        lede.classList.add('in');
        ScrollTrigger.create({
          trigger: lede, start: 'top 85%', once: true,
          onEnter: function () {
            gsap.to(lines, { yPercent: 0, duration: 0.7, stagger: 0.09, ease: 'expo.out', overwrite: true });
          }
        });
      })(ledes[s2]);
    } catch (e) { /* fall through to generic reveals */ }
  }

  if (useGsap && revealEls.length) {
    ScrollTrigger.batch(revealEls, {
      start: 'top 88%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0, duration: 0.8, stagger: 0.12,
          ease: 'power3.out', overwrite: true,
          onComplete: function () {
            for (var b = 0; b < batch.length; b++) batch[b].classList.add('in');
          }
        });
      }
    });
  } else if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) {
        if (entries[k].isIntersecting) {
          entries[k].target.classList.add('in');
          io.unobserve(entries[k].target);
        }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    for (var r = 0; r < revealEls.length; r++) io.observe(revealEls[r]);
  } else {
    revealFinal(revealEls);
  }
  /* (failsafe moved to the top of this section: registered before reveal
     machinery so setup exceptions can't skip it; also covers SplitText ledes) */
} catch (e) {}

/* ---------------- 3. counters ---------------- */
function easeOutExpo(x) { return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); }
function fmt(n) { return n.toLocaleString('en-US'); }
try {
  var counters = document.querySelectorAll('.p33-counter-value[data-count]');
  var runCounter = function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduced) { el.textContent = fmt(target); return; }
    if (useGsap) {
      var o = { v: 0 };
      gsap.to(o, {
        v: target, duration: 2, ease: 'expo.out',
        onUpdate: function () { el.textContent = fmt(Math.round(o.v)); },
        onComplete: function () { el.textContent = fmt(target); }
      });
      return;
    }
    var t0 = null, dur = 2000;
    function tick(now) {
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(Math.round(target * easeOutExpo(p)));
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target);
    }
    requestAnimationFrame(tick);
  };
  if (!reduced && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) {
        if (entries[k].isIntersecting) {
          runCounter(entries[k].target);
          cio.unobserve(entries[k].target);
        }
      }
    }, { threshold: 0.4 });
    for (var c = 0; c < counters.length; c++) cio.observe(counters[c]);
  } else {
    for (var c2 = 0; c2 < counters.length; c2++) runCounter(counters[c2]);
  }
} catch (e) {}

/* ---------------- 4. pointer tilt (vault cards) ---------------- */
try {
  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    var cards = document.querySelectorAll('.p33-tilt');
    for (var tI = 0; tI < cards.length; tI++) (function (card) {
      var max = parseFloat(card.getAttribute('data-tilt') || '6');
      card.addEventListener('pointermove', function (e) {
        var b = card.getBoundingClientRect();
        var rx = ((e.clientY - b.top) / b.height - 0.5) * -2 * max;
        var ry = ((e.clientX - b.left) / b.width - 0.5) * 2 * max;
        card.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      }, { passive: true });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; }, { passive: true });
    })(cards[tI]);
  }
} catch (e) {}

/* ---------------- 5. monument band parallax (transform-only) ---------------- */
try {
  if (!reduced) {
    var bandRules = document.querySelector('.p33-monument-rules');
    var band = document.querySelector('.p33-monument');
    if (band && bandRules) {
      var scheduled = false;
      var onScroll = function () {
        if (scheduled) return; scheduled = true;
        requestAnimationFrame(function () {
          scheduled = false;
          var b = band.getBoundingClientRect();
          var vh = window.innerHeight || 1;
          var prog = (b.top + b.height / 2 - vh / 2) / vh; /* -0.5..0.5-ish */
          bandRules.style.transform = 'translateX(' + (prog * -60).toFixed(1) + 'px)';
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }
} catch (e) {}

/* ---------------- 6. five-question progress hairline ---------------- */
try {
  var faqSec = document.getElementById('questions');
  var bar = faqSec ? faqSec.querySelector('.p33-qprogress-bar') : null;
  var details = faqSec ? faqSec.querySelectorAll('.p33-faq details') : [];
  function paintBar() {
    if (!bar) return;
    var open = 0;
    for (var d = 0; d < details.length; d++) if (details[d].open) open++;
    bar.style.width = details.length ? (open / details.length * 100).toFixed(1) + '%' : '0';
  }
  for (var d2 = 0; d2 < details.length; d2++) {
    details[d2].addEventListener('toggle', paintBar);
  }
  paintBar();
} catch (e) {}

/* ---------------- 7. grain register toggle ---------------- */
try {
  var grain = document.querySelector('.p33-grain');
  if (grain) {
    var lastVault = null, gScheduled = false;
    var paintGrain = function () {
      gScheduled = false;
      var el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      var inVault = !!(el && el.closest && el.closest('.p33-vault, .p33-hero, .p33-cta'));
      if (inVault !== lastVault) {
        lastVault = inVault;
        grain.classList.toggle('p33-grain--dark', inVault);
        grain.classList.toggle('p33-grain--light', !inVault);
      }
    };
    var gScroll = function () {
      if (gScheduled) return; gScheduled = true;
      requestAnimationFrame(paintGrain);
    };
    window.addEventListener('scroll', gScroll, { passive: true });
    paintGrain();
  }
} catch (e) {}

/* ---------------- 8. smooth anchors (Lenis-aware, reduced-motion aware) ---------------- */
try {
  var main = document.getElementById('p33-main');
  if (main) {
    main.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      var dest = id && document.getElementById(id);
      if (!dest) return;
      e.preventDefault();
      try { history.replaceState(null, '', '#' + id); } catch (err) {}
      if (lenis && !reduced) { lenis.scrollTo(dest, { offset: -84, duration: 1.2 }); }
      else { dest.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
    });
  }
} catch (e) {}

/* ---------------- 9. brief download + core statement copy ---------------- */
var CORE_STATEMENT = "Project 2033 advances reparations as the material settlement of a documented national debt \u2014 the foundation for durable Black economic parity. The debt runs from trillions at the most conservative to quadrillions at full accounting. Project 2033 names no settlement price \u2014 it names the ledger. The scale must follow the evidence. The remedy must outlive an election cycle: a sovereign public trust, independent administration, and institutions for land, learning, enterprise, and law that turn acknowledgment into lasting power.";

var BRIEF_TEXT = "PROJECT 2033\n" +
"REPARATIONS & THE PATH TO ECONOMIC PARITY\n" +
"\n" +
CORE_STATEMENT + "\n" +
"\n" +
"THE CASE\n" +
"America's obligations did not vanish when the laws changed \u2014 they compounded. Enslavement extracted labor; law converted the extraction into wealth; policy then protected the gains while restricting Black access to land, credit, education, housing, public safety, and political power. Reparations starts with that record: name the harm, name the institutions responsible, measure the compounded loss \u2014 and build a repair that lasts.\n" +
"\n" +
"THE DEBT, DOCUMENTED\n" +
"Project 2033 names no settlement price. It names the ledger. These are not our numbers \u2014 they are the economics profession's.\n" +
"- $7 quadrillion: Thomas Craemer, peer-reviewed, Social Science Quarterly (2015), at 6%. The rate does the work: at 3%, the same paper values the same labor at $5.9-$14.2 trillion in 2009 dollars.\n" +
"- $6.2 quadrillion: Craemer, Smith, Harrison, Logan, Bellamy & Darity, peer-reviewed, Review of Black Political Economy (2020) \u2014 the wage-based valuation of enslaved labor.\n" +
"- Seven quadrillion: ADCRC Chicago, Taking Account, March 2026.\n" +
"- Also published: Darity & Mullen, From Here to Equality (2020) \u2014 $10.7 trillion by the wealth-gap method, about $267,000 per eligible descendant of American slavery.\n" +
"The methods differ. The conclusion doesn't: the reparations debt is the largest unpaid invoice in American history \u2014 trillions at the most conservative, quadrillions at full accounting.\n" +
"\n" +
"THE RECORD\n" +
"- Black Distress Index: 1,574 verified observations across 17 federal sources.\n" +
"- The Measure of the Wound: scholarship connecting contemporary distress to its producing mechanisms.\n" +
"- DC.E5: a district-organized congressional advocacy operation addressing nine offices.\n" +
"\n" +
"THE ARCHITECTURE\n" +
"1. Establish the record.\n" +
"2. Determine public liability.\n" +
"3. Measure the obligation.\n" +
"4. Capitalize a sovereign, perpetual public trust.\n" +
"5. Govern transparently for parity.\n" +
"\n" +
"THE PARITY PATH\n" +
"Recurring public capacity for education, housing equity, enterprise capital, health, retirement security, land, and community infrastructure.\n" +
"\n" +
"The settlement repairs the balance sheet. The parity path changes who can own, govern, teach, build, and endure.\n";

try {
  var note = document.getElementById('copyNote');
  function say(msg) { if (note) note.textContent = msg; }

  var dl = document.getElementById('downloadBrief');
  if (dl) dl.addEventListener('click', function () {
    try {
      var blob = new Blob([BRIEF_TEXT], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'project-2033-reparations-brief.txt';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      say('Brief downloaded.');
      try { document.dispatchEvent(new CustomEvent('p33:goal-complete', { detail: { ctaId: 'cta-download-brief' } })); } catch (e2) {}
    } catch (e) { say('Download failed — try again.'); }
  });

  var cp = document.getElementById('copyStatement');
  if (cp) cp.addEventListener('click', function () {
    function done() {
      say('Core statement copied.');
      try { document.dispatchEvent(new CustomEvent('p33:goal-complete', { detail: { ctaId: 'cta-copy-statement' } })); } catch (e2) {}
    }
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = CORE_STATEMENT;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        ta.remove();
        if (ok) done(); else say('Select and copy from the downloaded brief instead.');
      } catch (e) { say('Select and copy from the downloaded brief instead.'); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(CORE_STATEMENT).then(done, fallback);
    } else { fallback(); }
  });
} catch (e) {}
})();
