/* ============================================================
   william.js — cinematic-editorial technique for
   e5enclave.com/about/william-berry-jr/
   "initials drawn" — stroke-drawn WB monogram, GSAP DrawSVG,
   single non-looping pass. "weight ramp on scroll" — kinetic
   typography lead, ScrollTrigger wght ramp (variable Cormorant).
   "practice glyph draw" — five hand-drawn practice glyphs
   registered into the adopted e5-icons.js shared library
   (draw-on-scroll via its own boot). "timeline reveal" —
   ScrollTrigger editorial section reveals.
   Fail-open: reduced-motion / missing libs => the static end-state
   (fully drawn monogram, complete icons, visible sections).
   ============================================================ */
(function () {
'use strict';

var reduced = false;
try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

/* ---- five hand-drawn practice glyphs (E5 icon language:
        48x48, stroke 1.7, round caps/joins, currentColor) ---- */
var GLYPHS = {
  svcPos: [ /* POS register: screen, entry lines, stand, base */
    '<rect x="13" y="7" width="22" height="15" rx="1.5"/>',
    '<path d="M17.5 11.5h13"/>',
    '<path d="M17.5 15.5h8"/>',
    '<path d="M24 22v5"/>',
    '<path d="M20.5 27.5h7"/>',
    '<path d="M17 33.5h14"/>'
  ],
  svcDeploy: [ /* deployment server: rack, bays, status dots */
    '<rect x="15" y="7" width="18" height="34" rx="2"/>',
    '<path d="M15 18h18M15 29h18"/>',
    '<circle cx="20.5" cy="12.5" r="1.3"/>',
    '<circle cx="20.5" cy="23.5" r="1.3"/>',
    '<circle cx="20.5" cy="34.5" r="1.3"/>',
    '<path d="M27 12.5h3M27 23.5h3M27 34.5h3"/>'
  ],
  svcVan: [ /* relocation van: body, cab, wheels */
    '<path d="M5 31V15h21v16"/>',
    '<path d="M26 19h7.5L40 25.5V31h-14"/>',
    '<circle cx="13.5" cy="34.5" r="3.2"/>',
    '<circle cx="32.5" cy="34.5" r="3.2"/>',
    '<path d="M16.7 34.5h12.6M5 31h5.3"/>'
  ],
  svcUplink: [ /* uplink link: signal arcs, node, mast */
    '<path d="M17 29a9.5 9.5 0 0 1 14 0"/>',
    '<path d="M12.5 24.5a16 16 0 0 1 23 0"/>',
    '<circle cx="24" cy="33.5" r="2.6"/>',
    '<path d="M24 36.1v5.4M20 41.5h8"/>'
  ],
  svcMigrate: [ /* migration arrow: origin, flight, target */
    '<circle cx="11" cy="30" r="2.2"/>',
    '<path d="M15 30h13"/>',
    '<path d="M23 24.5l5.5 5.5-5.5 5.5"/>',
    '<rect x="31" y="24" width="11" height="12" rx="1.5"/>'
  ]
};
/* registered before e5-icons.js boots (deferred scripts run first) */
if (window.E5Icons && E5Icons.ICONS) {
  for (var k in GLYPHS) {
    if (Object.prototype.hasOwnProperty.call(GLYPHS, k)) E5Icons.ICONS[k] = GLYPHS[k];
  }
}

var hasGsap = typeof window.gsap !== 'undefined';
var hasST = typeof window.ScrollTrigger !== 'undefined';
var hasDraw = typeof window.DrawSVGPlugin !== 'undefined';

/* ---- "initials drawn": monogram, one pass, never loops ---- */
function monogram() {
  var svg = document.getElementById('wb-mono');
  if (!svg || reduced || !hasGsap || !hasDraw) return; /* static end-state */
  gsap.registerPlugin(DrawSVGPlugin);
  gsap.timeline()
    .fromTo('#wb-ring', { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut' })
    .fromTo('#wb-w', { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut' }, '-=0.35')
    .fromTo('#wb-b', { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.0, ease: 'power2.inOut' }, '-=0.4');
}

/* ---- "weight ramp on scroll": kinetic lead ---- */
function kineticLead() {
  var el = document.getElementById('wb-lead');
  if (!el) return;
  if (reduced) { el.style.fontVariationSettings = '"wght" 640'; return; }
  if (!hasGsap || !hasST) return;
  gsap.registerPlugin(ScrollTrigger);
  var st = { wght: 340 };
  gsap.to(st, {
    wght: 640, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 32%', scrub: 0.6 },
    onUpdate: function () { el.style.fontVariationSettings = '"wght" ' + Math.round(st.wght); }
  });
}

/* ---- "timeline reveal": editorial section reveals ---- */
function reveals() {
  if (reduced || !hasGsap || !hasST) return; /* fully visible static default */
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray('.ed-rev').forEach(function (el) {
    gsap.from(el, {
      y: 26, opacity: 0, duration: 0.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });
}

function boot() {
  try { monogram(); kineticLead(); reveals(); }
  catch (e) { if (window.console && console.warn) console.warn('william: technique init failed open', e); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
