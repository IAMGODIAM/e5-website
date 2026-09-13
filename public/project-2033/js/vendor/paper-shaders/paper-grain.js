/* paper-grain.js — GLSL noise chunks for the Project 2033 hero composite pass.
 *
 * Mechanically extracted 2026-09-12 from @paper-design/shaders@0.0.80
 * (npm tarball, pinned) — file dist/shader-utils.js, consts
 * `proceduralHash21` and `colorBandingFix`. No other changes.
 *
 * Source: https://github.com/paper-design/shaders
 * License: Apache License 2.0 (see LICENSE in this directory).
 * NOTICE: "Paper Shaders / Copyright 2026 Paper / Powered by Paper Shaders:
 * https://shaders.paper.design" (see NOTICE in this directory).
 * Used in p33-hero.js for the film-grain layer + banding fix.
 */
(function () {
'use strict';
window.__PAPER_GLSL = {
  proceduralHash21: '\n  float hash21(vec2 p) {\n    p = fract(p * vec2(0.3183099, 0.3678794)) + 0.1;\n    p += dot(p, p + 19.19);\n    return fract(p.x * p.y);\n  }\n',
  colorBandingFix: '\n  color += 1. / 256. * (fract(sin(dot(.014 * gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453123) - .5);\n'
};
})();
