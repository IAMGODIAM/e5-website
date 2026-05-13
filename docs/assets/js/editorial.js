// Palette toggle (editorial ↔ original)
// Persists via localStorage under key 'e5-palette'.
// NOTE: a small inline script in <head> sets data-palette before paint to avoid FOUC.
(function () {
  var KEY = 'e5-palette';
  var html = document.documentElement;
  var btn = document.getElementById('vc-palette-toggle');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var cur = html.getAttribute('data-palette') === 'original' ? 'original' : 'editorial';
    var next = cur === 'editorial' ? 'original' : 'editorial';
    html.setAttribute('data-palette', next);
    try { localStorage.setItem(KEY, next); } catch (_) {}
  });
})();

// Rolling counters — institutional accounting, not slot-machine roll
(function () {
  var nodes = document.querySelectorAll('[data-counter-target]');
  if (!nodes.length) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function format(n) { return n.toLocaleString('en-US'); }
  function run(node) {
    var target = parseInt(node.getAttribute('data-counter-target'), 10) || 0;
    if (reduced) { node.textContent = format(target); return; }
    var dur = Math.min(2200, 600 + target * 1.2);
    var start = performance.now();
    function tick(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      var v = Math.round(target * eased);
      node.textContent = format(v);
      if (t < 1) requestAnimationFrame(tick);
      else {
        node.classList.add('tick');
        setTimeout(function () { node.classList.remove('tick'); }, 700);
      }
    }
    requestAnimationFrame(tick);
  }
  if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }
  var io2 = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { run(e.target); io2.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  nodes.forEach(function (n) { io2.observe(n); });
})();

// Reveal-on-scroll
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (e) { e.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  els.forEach(function (e) { io.observe(e); });
})();

// Pointer-aware gold gleam on the foundation slab
(function () {
  var slab = document.querySelector('.vc-foundation');
  if (!slab || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var raf = 0;
  slab.addEventListener('mousemove', function (e) {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      var rect = slab.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      slab.style.setProperty('--gleam-x', Math.max(0, Math.min(100, x)) + '%');
    });
  });
  slab.addEventListener('mouseleave', function () {
    slab.style.setProperty('--gleam-x', '50%');
  });
})();

// Smooth scroll for in-page anchors
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a) return;
  var id = a.getAttribute('href').slice(1);
  if (!id) return;
  var t = document.getElementById(id);
  if (t) {
    e.preventDefault();
    t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + id);
  }
});
