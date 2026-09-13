/* ============================================================
   e5-icons.js — E5 shared motion-icon library · v1.1.0 (2026-09-13)
   33 bespoke gold line-work icons (48x48, stroke 1.7, round
   joins/caps, currentColor). Never stock, never icon fonts.
   Consolidated from the Project 2033 cinematic build (17 page
   icons, 2026-09-12) and the #hub attention upgrade (7 hub
   markers, 2026-09-13), and the Black Dragons v50 set (4 principles
   + 5 pillars, 2026-09-13). Provenance: original vector work for
   E5 Enclave Inc., drawn in the E5 icon language.

   Usage:
     <span data-e5-ico="hubLetter"></span>
     <script src="/js/e5-icons.js"></script>
   Draw-on entrances (GSAP DrawSVG, vendored) fire per host card
   via ScrollTrigger; stagger 70ms/path, 550ms each, <=1.2s total,
   settling static — never looping. Hosts: [data-e5-draw-host]
   or the default card selectors below. Mark an icon static with
   data-e5-static (form-adjacent doctrine: no decorative motion
   around forms).

   Fail-closed: no-JS => empty slot (decorative only, never load-
   bearing); prefers-reduced-motion => icons render complete with
   no draw animation; DrawSVG/GSAP missing => static icons.
   ============================================================ */

(function () {
'use strict';

var docEl = document.documentElement;
var reduced = false;
try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

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
  ],

  /* ---- THE HUB · REPARATIONS NOW markers (2026-09-13) ---- */
  hubLetter: [ /* envelope, flap, wax seal — "Read the letter" */
    '<path d="M10 18.5a2.5 2.5 0 0 1 2.5-2.5h23a2.5 2.5 0 0 1 2.5 2.5v15a2.5 2.5 0 0 1-2.5 2.5h-23A2.5 2.5 0 0 1 10 33.5Z"/>',
    '<path d="M11.5 18L24 27.5 36.5 18"/>',
    '<circle cx="24" cy="27.5" r="4.4"/>',
    '<circle cx="24" cy="27.5" r="1.5"/>'
  ],
  hubSign: [ /* pen nib, slit, breather, signature flourish — "Sign the record" */
    '<path d="M33 6.5l8.5 8.5L28 28.5l-6.5-6.5Z"/>',
    '<path d="M37.2 10.8l-8.6 8.6"/>',
    '<circle cx="31.4" cy="16.6" r="1.2"/>',
    '<path d="M8 38.5c5.5 0 7.5-5.5 11.5-5.5 3 0 3.6 3.6 7 3.6 3.6 0 5.4-2.8 11.5-2.8"/>'
  ],
  hubPacket: [ /* sheet, folded corner, download arrow, tray — "Download the packet" */
    '<path d="M14 6.5h12.5L34 14v27.5H14Z"/>',
    '<path d="M26.5 6.5V14H34"/>',
    '<path d="M24 21.5v11"/>',
    '<path d="M19.8 28.3l4.2 4.2 4.2-4.2"/>',
    '<path d="M17 38h14"/>'
  ],
  hubAsk: [ /* placard on post, demand lines — the ask card */
    '<path d="M12 10.5a2.5 2.5 0 0 1 2.5-2.5h19a2.5 2.5 0 0 1 2.5 2.5v12a2.5 2.5 0 0 1-2.5 2.5h-19A2.5 2.5 0 0 1 12 22.5Z"/>',
    '<path d="M17 13.5h14"/>',
    '<path d="M17 17.5h14"/>',
    '<path d="M17 21.5h8.5"/>',
    '<path d="M24 25v15"/>',
    '<path d="M18 40h12"/>'
  ],
  hubBrief: [ /* single sheet, rising ledger line, end dot — the brief */
    '<path d="M13 6.5h14.5L35 14v27.5H13Z"/>',
    '<path d="M27.5 6.5V14H35"/>',
    '<path d="M18 33l5-6.2 3.8 3 6.4-7.6"/>',
    '<circle cx="33.2" cy="22.2" r="1.4"/>'
  ],
  hubWhip: [ /* whip-count table, column rule, check — the whip map */
    '<path d="M8 14.5A2.5 2.5 0 0 1 10.5 12h27a2.5 2.5 0 0 1 2.5 2.5V33a2.5 2.5 0 0 1-2.5 2.5h-27A2.5 2.5 0 0 1 8 33Z"/>',
    '<path d="M8 19.5h32"/>',
    '<path d="M23 19.5v16"/>',
    '<path d="M12.5 27.5l3.5 3.5 7-8"/>',
    '<path d="M27.5 25.5h8"/>',
    '<path d="M27.5 30h8"/>'
  ],
  hubFlame: [ /* commemoration flame, inner ember — the Lankford letter */
    '<path d="M24 5.5c2.8 6.8 10.5 10.6 10.5 18.5a10.5 10.5 0 0 1-21 0c0-4.8 2.8-7.8 4.8-9.8.7 2.5 2.2 3.9 3.9 4.4-.6-4.4.2-9.3 1.8-13.1Z"/>',
    '<path d="M24 27c1.6 2.6 4 4.2 4 7a4 4 0 0 1-8 0c0-1.9 1.2-3.1 2-4 .4 1 1.1 1.7 2 2-.3-1.8-.3-3.5 0-5Z"/>'
  ],
  /* ---- BLACK DRAGONS · v50 principles + pillars (2026-09-13) ---- */
  /* Source: dragons/redesign-blackredgold-v50 branch (PR #50),
     public/black-dragons-initiative/js/bd50-cinematic.js. Render-audited
     2026-09-13: all 9 bboxes inside the 48-unit viewBox. */
  bdPinFlame: [ /* I · Political independence — flame held in a broken circle */
    '<path d=\"M38 15A15.5 15.5 0 1 0 38 33\"/>',
    '<path d=\"M24 36.5c-4.8-3.5-7.2-7.2-7.2-11.4a7.2 7.2 0 0 1 14.4 0c0 4.2-2.4 7.9-7.2 11.4Z\"/>',
    '<path d=\"M24 31.6c-2.1-1.6-3.1-3.3-3.1-5.3a3.1 3.1 0 0 1 6.2 0c0 2-1 3.7-3.1 5.3Z\"/>'
  ],
  bdPinSeedling: [ /* II · Economic self-sufficiency — seedling in a hexagon */
    '<path d=\"M24 5l16.5 9.5v19L24 43 7.5 33.5v-19Z\"/>',
    '<path d=\"M24 34.5V23\"/>',
    '<path d=\"M24 27.5c-5 0-8.5-3.4-8.5-8.4 5 0 8.5 3.4 8.5 8.4Z\"/>',
    '<path d=\"M24 24.5c5 0 8.5-3.4 8.5-8.4-5 0-8.5 3.4-8.5 8.4Z\"/>'
  ],
  bdPinBook: [ /* III · Cultural renaissance — open book under rising rays */
    '<path d=\"M24 17c-3-2.4-7-3-12-2.4V35c5-.6 9 0 12 2.4 3-2.4 7-3 12-2.4V14.6c-5-.6-9 0-12 2.4Z\"/>',
    '<path d=\"M24 17v20.4\"/>',
    '<path d=\"M24 5v4.5\"/>',
    '<path d=\"M15 7.6l2.2 3.8\"/>',
    '<path d=\"M33 7.6l-2.2 3.8\"/>'
  ],
  bdPinRings: [ /* IV · Radical solidarity — three interlocking rings */
    '<circle cx=\"18\" cy=\"19.5\" r=\"7.5\"/>',
    '<circle cx=\"30\" cy=\"19.5\" r=\"7.5\"/>',
    '<circle cx=\"24\" cy=\"30\" r=\"7.5\"/>',
    '<path d=\"M12 41.5a4 4 0 0 1 8 0 4 4 0 0 1 8 0 4 4 0 0 1 8 0\"/>'
  ],
  bdPillarColumn: [ /* 01 · Institutional Autonomy — column with pediment */
    '<path d=\"M10 14.5L24 6.5l14 8\"/>',
    '<path d=\"M12.5 18.5h23\"/>',
    '<path d=\"M12.5 37.5h23\"/>',
    '<path d=\"M17.5 18.5v19\"/>',
    '<path d=\"M24 18.5v19\"/>',
    '<path d=\"M30.5 18.5v19\"/>',
    '<path d=\"M9.5 41.5h29\"/>'
  ],
  bdPillarScales: [ /* 02 · Economic Justice — scales with heart-coin */
    '<path d=\"M24 7v31\"/>',
    '<path d=\"M13 12.5h22\"/>',
    '<path d=\"M13 12.5l-5 10\"/>',
    '<path d=\"M13 12.5l5 10\"/>',
    '<path d=\"M5.5 25A7.5 7.5 0 0 0 20.5 25\"/>',
    '<path d=\"M35 12.5l-5 10\"/>',
    '<path d=\"M35 12.5l5 10\"/>',
    '<path d=\"M27.5 25A7.5 7.5 0 0 0 42.5 25\"/>',
    '<path d=\"M24 27.5l2.6 3.2-2.6 3.2-2.6-3.2Z\"/>',
    '<path d=\"M17.5 41.5h13\"/>'
  ],
  bdPillarField: [ /* 03 · Land and Resources — field parcel under the sun */
    '<circle cx=\"24\" cy=\"11\" r=\"4.2\"/>',
    '<path d=\"M7 40.5L18.5 19h11L41 40.5\"/>',
    '<path d=\"M4.5 40.5h39\"/>',
    '<path d=\"M24 40.5V27\"/>',
    '<path d=\"M17.5 40.5l2.8-9.5\"/>',
    '<path d=\"M30.5 40.5l-2.8-9.5\"/>'
  ],
  bdPillarCouncil: [ /* 04 · Community-Controlled Governance — council ring, one fire */
    '<circle cx=\"24\" cy=\"24\" r=\"4.6\"/>',
    '<circle cx=\"24\" cy=\"24\" r=\"1.4\"/>',
    '<circle cx=\"24\" cy=\"10.5\" r=\"1.9\"/>',
    '<circle cx=\"33.5\" cy=\"14.5\" r=\"1.9\"/>',
    '<circle cx=\"37.5\" cy=\"24\" r=\"1.9\"/>',
    '<circle cx=\"33.5\" cy=\"33.5\" r=\"1.9\"/>',
    '<circle cx=\"24\" cy=\"37.5\" r=\"1.9\"/>',
    '<circle cx=\"14.5\" cy=\"33.5\" r=\"1.9\"/>',
    '<circle cx=\"10.5\" cy=\"24\" r=\"1.9\"/>',
    '<circle cx=\"14.5\" cy=\"14.5\" r=\"1.9\"/>'
  ],
  bdPillarGlobe: [ /* 05 · Pan-African Unity — globe under a linking arc */
    '<circle cx=\"24\" cy=\"27\" r=\"11.5\"/>',
    '<ellipse cx=\"24\" cy=\"27\" rx=\"5.2\" ry=\"11.5\"/>',
    '<path d=\"M12.5 27h23\"/>',
    '<path d=\"M14.5 21.5h19\"/>',
    '<path d=\"M14.5 32.5h19\"/>',
    '<path d=\"M11 9.5a15 15 0 0 1 26 0\"/>',
    '<circle cx=\"11\" cy=\"9.5\" r=\"1.9\"/>',
    '<circle cx=\"37\" cy=\"9.5\" r=\"1.9\"/>'
  ]
};

/* ---- svg shell: 48x48, currentColor, decorative ---- */
function S(inner) {
  return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" focusable="false">' + inner + '</svg>';
}

/* ---- inject into [data-e5-ico] slots ---- */
function inject(root) {
  var scope = root || document;
  var slots;
  try { slots = scope.querySelectorAll('[data-e5-ico]'); } catch (e) { return; }
  for (var i = 0; i < slots.length; i++) {
    var frags = ICONS[slots[i].getAttribute('data-e5-ico')];
    if (frags) slots[i].innerHTML = S(frags.join(''));
  }
}

/* ---- draw-on entrances via DrawSVG ----
   opts.hosts: selector for draw trigger hosts (default below)
   opts.stagger / opts.duration: per-path timing (defaults 0.07 / 0.55)
   opts.triggerStart: ScrollTrigger start (default 'top 82%')
   Icons carrying data-e5-static never draw (form-adjacent doctrine). */
function drawOn(root, opts) {
  opts = opts || {};
  var stagger = typeof opts.stagger === 'number' ? opts.stagger : 0.07;
  var duration = typeof opts.duration === 'number' ? opts.duration : 0.55;
  var triggerStart = opts.triggerStart || 'top 82%';
  var hostSel = opts.hosts ||
    '[data-e5-draw-host], .e5-card, .p33-card, .p33-step, .p33-pillar, .p33-ledger-row, .p33-dl-card';
  var scope = root || document;
  try {
    var canDraw = !reduced &&
      typeof window.gsap !== 'undefined' &&
      typeof window.ScrollTrigger !== 'undefined' &&
      typeof window.DrawSVGPlugin !== 'undefined';
    if (!canDraw) return;
    gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
    var drawn = scope.querySelectorAll('[data-e5-ico] svg');
    for (var d = 0; d < drawn.length; d++) (function (svg) {
      var shapes = svg.querySelectorAll('path, circle, ellipse');
      if (!shapes.length) return;
      if (svg.closest('[data-e5-static]')) return;
      var host = svg.closest(hostSel) || svg;
      gsap.set(shapes, { drawSVG: '0%' });
      ScrollTrigger.create({
        trigger: host,
        start: triggerStart,
        once: true,
        onEnter: function () {
          gsap.to(shapes, {
            drawSVG: '100%',
            duration: duration,
            stagger: stagger,
            ease: 'power2.inOut',
            overwrite: true
          });
        }
      });
    })(drawn[d]);
  } catch (e) { /* draw-on is decorative; icons remain complete statically */ }
}

window.E5Icons = { ICONS: ICONS, inject: inject, drawOn: drawOn, version: '1.1.0' };

function boot() { inject(document); drawOn(document); }
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else { boot(); }

})();