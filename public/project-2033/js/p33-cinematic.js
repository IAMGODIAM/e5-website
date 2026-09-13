/* ============================================================
   p33-cinematic.js — Project 2033 hub interactions
   - bespoke gold line-work icon set (record quartet + parity pillars)
   - staged hero entrance release (fail-closed: no JS => hero visible)
   - scroll reveal + failsafe, counters, tilt, monument parallax
   - five-question accordion progress, smooth anchors
   - brief download + core-statement copy (copy verbatim, 2026-09-12)
   Decorative subsystems never break the page: try/catch per block.
   ============================================================ */
(function () {
'use strict';

var docEl = document.documentElement;
var reduced = false;
try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

/* ---------------- 1. bespoke icon set ---------------- */
function S(inner) {
  return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" focusable="false">' + inner + '</svg>';
}

var ICONS = {
  /* Measure — open ledger book with a rising plotted line */
  measure: S('<path d="M10 9.5c4.7-1.8 9.3-1.8 14 0v22.5c-4.7-1.8-9.3-1.8-14 0Z"/>' +
    '<path d="M24 9.5c4.7-1.8 9.3-1.8 14 0v22.5c-4.7-1.8-9.3-1.8-14 0Z"/>' +
    '<path d="M24 9.5V32"/>' +
    '<path d="M13.5 25.5l4-5 3.2 2.6 6-7.6"/>' +
    '<circle cx="30.7" cy="15.5" r="1.3"/>'),
  /* Document — scroll with a wax-seal circle */
  document: S('<path d="M16 5.5h16a2 2 0 0 1 2 2v27a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2v-27a2 2 0 0 1 2-2Z"/>' +
    '<path d="M18.5 14.5h11M18.5 19.5h11M18.5 24.5h7"/>' +
    '<circle cx="28" cy="31.5" r="4.5"/>' +
    '<circle cx="28" cy="31.5" r="1.6"/>'),
  /* Carry it to Congress — abstract dome, arc + columns */
  congress: S('<path d="M24 4.5v3"/>' +
    '<circle cx="24" cy="3.8" r="1.2"/>' +
    '<path d="M9 29a15 15 0 0 1 30 0"/>' +
    '<path d="M13.5 29v-1.5a10.5 10.5 0 0 1 21 0V29"/>' +
    '<path d="M16 33v8M22 33v8M26 33v8M32 33v8"/>' +
    '<path d="M10.5 41.5h27"/>'),
  /* Advance the law — balanced scales with a gold pivot */
  law: S('<path d="M24 6.5V38"/>' +
    '<path d="M24 6.5l2.2 2.6-2.2 2.6-2.2-2.6Z"/>' +
    '<path d="M12 12.5h24"/>' +
    '<path d="M12 12.5l-6 11M12 12.5l6 11"/>' +
    '<path d="M4.5 26a7.5 7.5 0 0 0 15 0"/>' +
    '<path d="M36 12.5l-6 11M36 12.5l6 11"/>' +
    '<path d="M28.5 26a7.5 7.5 0 0 0 15 0"/>' +
    '<path d="M18 41.5h12"/>'),
  /* Land — furrowed rows under a sun arc */
  land: S('<path d="M24 2.5V5"/>' +
    '<path d="M13.8 5.6l1.7 1.7M34.2 5.6l-1.7 1.7"/>' +
    '<path d="M15.5 13.5a8.5 8.5 0 0 1 17 0"/>' +
    '<path d="M6 29c8-3 16 3 24 0s8-3 12 0"/>' +
    '<path d="M6 35.5c8-3 16 3 24 0s8-3 12 0"/>' +
    '<path d="M6 42c8-3 16 3 24 0s8-3 12 0"/>'),
  /* Learning — open book with rising rays */
  learning: S('<path d="M24 5.5V11"/>' +
    '<path d="M16.5 8l2.5 4.2M31.5 8l-2.5 4.2"/>' +
    '<path d="M24 20c-3.4-2.6-7.8-3.2-13-2.6V36c5.2-.6 9.6 0 13 2.6 3.4-2.6 7.8-3.2 13-2.6V17.4c-5.2-.6-9.6 0-13 2.6Z"/>' +
    '<path d="M24 20v18.6"/>'),
  /* Enterprise — hexagon coin with a storefront awning mark */
  enterprise: S('<path d="M24 5l16.5 9.5v19L24 43 7.5 33.5v-19Z"/>' +
    '<path d="M15.5 23.5h17"/>' +
    '<path d="M15.5 25a2.8 2.8 0 0 0 5.7 0 2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.7 0"/>' +
    '<path d="M21 30.5h6V37h-6Z"/>'),
  /* District — map pin ringed by small district dots */
  district: S('<path d="M24 42.5c-7-8.2-11.5-14-11.5-20.8a11.5 11.5 0 0 1 23 0c0 6.8-4.5 12.6-11.5 20.8Z"/>' +
    '<circle cx="24" cy="21.5" r="4"/>' +
    '<circle cx="9" cy="9" r="1.6"/><circle cx="39" cy="9" r="1.6"/>' +
    '<circle cx="9" cy="39" r="1.6"/><circle cx="39" cy="39" r="1.6"/>')
};

try {
  var slots = document.querySelectorAll('[data-p33-ico]');
  for (var i = 0; i < slots.length; i++) {
    var name = slots[i].getAttribute('data-p33-ico');
    if (ICONS[name]) slots[i].innerHTML = ICONS[name];
  }
} catch (e) { /* icons are decorative; never break the page */ }

/* ---------------- 2. staged entrance release ----------------
   The inline stager after </header> added html.p33-cine before
   first paint. Release here; layered backstops guarantee -go. */
function release() {
  try { docEl.classList.add('p33-cine-go'); } catch (e) {}
}
try {
  if (reduced) { release(); }
  else {
    requestAnimationFrame(function () { requestAnimationFrame(release); });
  }
  window.addEventListener('load', function () { setTimeout(release, 1500); });
} catch (e) {}

/* ---------------- 3. scroll reveal + failsafe ---------------- */
try {
  var scope = document.getElementById('p33-main');
  var revealEls = scope ? scope.querySelectorAll('.p33-reveal') : [];
  var revealed = function (el) { el.classList.add('in'); };
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) {
        if (entries[k].isIntersecting) {
          revealed(entries[k].target);
          io.unobserve(entries[k].target);
        }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    for (var r = 0; r < revealEls.length; r++) io.observe(revealEls[r]);
  } else {
    for (var r2 = 0; r2 < revealEls.length; r2++) revealed(revealEls[r2]);
  }
  window.addEventListener('load', function () {
    setTimeout(function () {
      for (var q = 0; q < revealEls.length; q++) revealed(revealEls[q]);
    }, 1400);
  });
} catch (e) {}

/* ---------------- 4. counters ---------------- */
function easeOutExpo(x) { return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); }
function fmt(n) { return n.toLocaleString('en-US'); }
try {
  var counters = document.querySelectorAll('.p33-counter-value[data-count]');
  var runCounter = function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduced) { el.textContent = fmt(target); return; }
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

/* ---------------- 5. pointer tilt (vault cards) ---------------- */
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

/* ---------------- 6. monument band parallax (transform-only) ---------------- */
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

/* ---------------- 7. five-question progress hairline ---------------- */
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

/* ---------------- 8. grain register toggle ---------------- */
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

/* ---------------- 9. smooth anchors (reduced-motion aware) ---------------- */
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
      dest.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      try { history.replaceState(null, '', '#' + id); } catch (err) {}
    });
  }
} catch (e) {}

/* ---------------- 10. brief download + core statement copy ---------------- */
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
    } catch (e) { say('Download failed — try again.'); }
  });

  var cp = document.getElementById('copyStatement');
  if (cp) cp.addEventListener('click', function () {
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
        say(ok ? 'Core statement copied.' : 'Select and copy from the downloaded brief instead.');
      } catch (e) { say('Select and copy from the downloaded brief instead.'); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(CORE_STATEMENT).then(
        function () { say('Core statement copied.'); },
        function () { fallback(); }
      );
    } else { fallback(); }
  });
} catch (e) {}
})();
