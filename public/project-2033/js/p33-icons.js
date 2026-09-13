/* ============================================================
   p33-icons.js — Project 2033 bespoke SVG icon-motion system
   17 custom-drawn gold line-work icons (48x48, stroke 1.7, round
   joins), drawn in the E5 icon language. Never stock, never icon
   fonts. Draw-on entrances via DrawSVG (GSAP, vendored) —
   staggered path draws, total <=1.2s, settling to a clean static
   state. Motion explains the action; conversion-path icons stay
   static (no icon lives in the conversion path on this page).
   Fail-closed: no-JS => text-only; reduced-motion => icons appear
   complete with no draw animation; DrawSVG missing => skip.
   Provenance: original vector work for this page, 2026-09-12.
   ============================================================ */
(function () {
'use strict';

var docEl = document.documentElement;
var reduced = false;
try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

/* ---- svg shell: 48x48, currentColor, aria-hidden (decorative) ---- */
function S(inner) {
  return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" focusable="false">' + inner + '</svg>';
}

/* Each icon is an ordered array of fragments — draw order = array order. */
var ICONS = {
  /* ---- 02 · THE RECORD quartet ---- */
  measure: [ /* ledger book, rising plotted line, end dot */
    '<path d="M8.5 10.5c5-2.1 10-2.1 15.5 0v22c-5.5-2.1-10.5-2.1-15.5 0Z"/>',
    '<path d="M24 10.5c5.5-2.1 10.5-2.1 15.5 0v22c-5-2.1-10-2.1-15.5 0Z"/>',
    '<path d="M24 10.5V33"/>',
    '<path d="M12.5 27.5l4.5-5.8 3.4 3 6.2-7.8"/>',
    '<circle cx="26.6" cy="16.9" r="1.4"/>'
  ],
  document: [ /* scroll sheet, text lines, wax seal + ribbon */
    '<path d="M14.5 7.5h16.5a3 3 0 0 1 3 3v23.5a3 3 0 0 1-3 3H14.5a3 3 0 0 1-3-3V10.5a3 3 0 0 1 3-3Z"/>',
    '<path d="M17.5 14.5h11"/>',
    '<path d="M17.5 19.5h11"/>',
    '<path d="M17.5 24.5h6.5"/>',
    '<circle cx="28.5" cy="31.5" r="4.6"/>',
    '<circle cx="28.5" cy="31.5" r="1.7"/>',
    '<path d="M25.5 35.2l-1.8 5.3 3.8-2.5 3.8 2.5-1.8-5.3"/>'
  ],
  congress: [ /* abstract dome: base, dome arc, columns, finial */
    '<path d="M8.5 40h31"/>',
    '<path d="M10 31.5a14 14 0 0 1 28 0"/>',
    '<path d="M12 31.5h24"/>',
    '<path d="M15 31.5V40M21 31.5V40M27 31.5V40M33 31.5V40"/>',
    '<path d="M24 13.5v4.5"/>',
    '<circle cx="24" cy="11.2" r="1.3"/>'
  ],
  law: [ /* scales: post, finial, beam, strings, pans, pivot, base */
    '<path d="M24 7.5V39"/>',
    '<path d="M24 5.2l2.1 2.5-2.1 2.5-2.1-2.5Z"/>',
    '<path d="M11 13.5h26"/>',
    '<path d="M11 13.5L5.8 23M11 13.5l5.2 9.5"/>',
    '<path d="M5.8 23a5.2 5.2 0 0 0 10.4 0"/>',
    '<path d="M37 13.5l-5.2 9.5M37 13.5l5.2 9.5"/>',
    '<path d="M31.8 23a5.2 5.2 0 0 0 10.4 0"/>',
    '<circle cx="24" cy="13.5" r="1.3"/>',
    '<path d="M17 41.5h14"/>'
  ],

  /* ---- 03 · THE ARCHITECTURE rungs ---- */
  archRecord: [ /* archive drawers, handles, seal */
    '<path d="M8 12.5h32v9H8Z"/>',
    '<path d="M8 27.5h32v9H8Z"/>',
    '<path d="M21.5 17h5"/>',
    '<path d="M21.5 32h5"/>',
    '<circle cx="34" cy="36.5" r="3.6"/>',
    '<path d="M34 34.7v3.6M32.2 36.5h3.6"/>'
  ],
  archLiability: [ /* institution: pediment, columns, name plaque, base */
    '<path d="M7.5 14.5L24 6.5l16.5 8"/>',
    '<path d="M12.5 20v15M18.5 20v15M29.5 20v15M35.5 20v15"/>',
    '<path d="M8.5 39h31"/>',
    '<path d="M19 25.5h10v7H19Z"/>',
    '<path d="M22 29h4"/>'
  ],
  archMeasure: [ /* divider over a measured arc with ticks */
    '<path d="M24 7.5L15.5 38"/>',
    '<path d="M24 7.5l8.5 30.5"/>',
    '<circle cx="24" cy="7.5" r="2.2"/>',
    '<path d="M9 40.5a17 17 0 0 1 30 0"/>',
    '<path d="M12.5 36.8l1.6-2.7M24 33.2v-3M35.5 36.8l-1.6-2.7"/>'
  ],
  archInstrument: [ /* trust chest, keyhole, rising yield */
    '<path d="M9.5 22.5h29v14h-29Z"/>',
    '<path d="M9.5 22.5c0-6.5 6.5-11 14.5-11s14.5 4.5 14.5 11"/>',
    '<circle cx="24" cy="29.5" r="2.1"/>',
    '<path d="M24 31.6V35"/>',
    '<path d="M16 12.5V7M24 12.5V4.5M32 12.5V7"/>',
    '<path d="M13.8 9.2L16 7l2.2 2.2M21.8 6.7L24 4.5l2.2 2.2M29.8 9.2L32 7l2.2 2.2"/>'
  ],
  archGovern: [ /* ship's helm: rim, spokes, hub, handles */
    '<circle cx="24" cy="27" r="13"/>',
    '<path d="M24 14v26M11 27h26M14.8 17.8l18.4 18.4M33.2 17.8L14.8 36.2"/>',
    '<circle cx="24" cy="27" r="3.2"/>',
    '<path d="M24 14V8.5M11 27H5.5M37 27h5.5M24 40v5.5"/>'
  ],

  /* ---- 04 · THE PARITY PATH pillars ---- */
  land: [ /* sun arc, rays, three furrows */
    '<path d="M16.5 15.5a7.5 7.5 0 0 1 15 0"/>',
    '<path d="M24 4.5V8"/>',
    '<path d="M13.5 6.8l2 2M34.5 6.8l-2 2"/>',
    '<path d="M6 29c8-3.2 16 3.2 24 0s8-3.2 12 0"/>',
    '<path d="M6 36c8-3.2 16 3.2 24 0s8-3.2 12 0"/>',
    '<path d="M6 43c8-3.2 16 3.2 24 0s8-3.2 12 0"/>'
  ],
  learning: [ /* open book, spine, rising rays */
    '<path d="M24 21.5c-3.6-2.8-8-3.4-13.5-2.8v17.5c5.5-.6 9.9 0 13.5 2.8 3.6-2.8 8-3.4 13.5-2.8V18.7c-5.5-.6-9.9 0-13.5 2.8Z"/>',
    '<path d="M24 21.5V39"/>',
    '<path d="M24 6.5v5"/>',
    '<path d="M15.5 9.5l2.8 4.4M32.5 9.5l-2.8 4.4"/>'
  ],
  enterprise: [ /* hexagon coin, awning bar, scallops, door */
    '<path d="M24 5.5L39.5 14.5v19L24 42.5 8.5 33.5v-19Z"/>',
    '<path d="M14.5 24h19"/>',
    '<path d="M14.5 26.2a2.4 2.4 0 0 0 4.75 0 2.4 2.4 0 0 0 4.75 0 2.4 2.4 0 0 0 4.75 0 2.4 2.4 0 0 0 4.75 0"/>',
    '<path d="M21.5 31h5v6.5h-5Z"/>'
  ],
  district: [ /* map pin, eye, district dots */
    '<path d="M24 42.5c-7.2-8.4-11.8-14.2-11.8-21a11.8 11.8 0 0 1 23.6 0c0 6.8-4.6 12.6-11.8 21Z"/>',
    '<circle cx="24" cy="21.5" r="4"/>',
    '<circle cx="8.5" cy="8.5" r="1.6"/>',
    '<circle cx="39.5" cy="8.5" r="1.6"/>',
    '<circle cx="8.5" cy="39.5" r="1.6"/>',
    '<circle cx="39.5" cy="39.5" r="1.6"/>'
  ],

  /* ---- THE DEBT, DOCUMENTED ledger markers ---- */
  debtQuill: [ /* fountain-pen nib, breather + slit, ledger rules */
    '<path d="M24 5.5c5 0 8.2 4 8.2 9.2 0 8-5.2 14-8.2 17.3-3-3.3-8.2-9.3-8.2-17.3 0-5.2 3.2-9.2 8.2-9.2Z"/>',
    '<circle cx="24" cy="14.5" r="1.1"/>',
    '<path d="M24 16.5V27"/>',
    '<path d="M24 27l-2.6 4.2M24 27l2.6 4.2"/>',
    '<path d="M9 40h30"/>',
    '<path d="M12 44.5c8-2 16 2 24 0"/>'
  ],
  debtCoins: [ /* stacked wage coins, rising arrow */
    '<ellipse cx="17" cy="33" rx="8" ry="3"/>',
    '<ellipse cx="17" cy="28" rx="8" ry="3"/>',
    '<ellipse cx="17" cy="23" rx="8" ry="3"/>',
    '<path d="M9 23v10M25 23v10"/>',
    '<path d="M34 39V17"/>',
    '<path d="M29.8 21.2L34 17l4.2 4.2"/>'
  ],
  debtSeal: [ /* round stamp, dashed inner ring, star, ribbons */
    '<circle cx="24" cy="23" r="13"/>',
    '<circle cx="24" cy="23" r="9" stroke-dasharray="2.5 3"/>',
    '<path d="M24 16.5l2 4.4 4.8.5-3.5 3.3 1 4.7-4.3-2.4-4.3 2.4 1-4.7-3.5-3.3 4.8-.5Z"/>',
    '<path d="M18.5 34.5l-2 6.5 6-3.2M29.5 34.5l2 6.5-6-3.2"/>'
  ],
  debtBook: [ /* open book, spine, bookmark */
    '<path d="M24 14c-3.4-2.6-7.6-3.2-13-2.6v20c5.4-.6 9.6 0 13 2.6 3.4-2.6 7.6-3.2 13-2.6v-20c-5.4-.6-9.6 0-13 2.6Z"/>',
    '<path d="M24 14v20"/>',
    '<path d="M32.5 7.5V17l-3-2.4-3 2.4V7.5"/>'
  ]
};

/* ---- inject into [data-p33-ico] slots ---- */
try {
  var slots = document.querySelectorAll('[data-p33-ico]');
  for (var i = 0; i < slots.length; i++) {
    var frags = ICONS[slots[i].getAttribute('data-p33-ico')];
    if (frags) slots[i].innerHTML = S(frags.join(''));
  }
} catch (e) { /* icons are decorative; never break the page */ }

/* ---- draw-on entrances via DrawSVG ----
   Each icon's host card/step/row triggers its own draw when it
   enters the viewport. Stagger 70ms/path, 550ms draw each —
   total <= 1.2s for the largest icon (9 paths: 0.55 + 8*0.07 = 1.11s).
   Settles to a clean static state; never loops. */
try {
  var canDraw = !reduced &&
    typeof window.gsap !== 'undefined' &&
    typeof window.ScrollTrigger !== 'undefined' &&
    typeof window.DrawSVGPlugin !== 'undefined';
  if (canDraw) {
    gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
    var drawn = document.querySelectorAll('[data-p33-ico] svg');
    for (var d = 0; d < drawn.length; d++) (function (svg) {
      var shapes = svg.querySelectorAll('path, circle, ellipse');
      if (!shapes.length) return;
      var host = svg.closest('.p33-card, .p33-step, .p33-pillar, .p33-ledger-row') || svg;
      gsap.set(shapes, { drawSVG: '0%' });
      ScrollTrigger.create({
        trigger: host,
        start: 'top 82%',
        once: true,
        onEnter: function () {
          gsap.to(shapes, {
            drawSVG: '100%',
            duration: 0.55,
            stagger: 0.07,
            ease: 'power2.inOut',
            overwrite: true
          });
        }
      });
    })(drawn[d]);
  }
} catch (e) { /* draw-on is decorative; icons remain complete statically */ }

})();
