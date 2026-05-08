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
