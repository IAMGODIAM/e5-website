/* np-reveal.js — fail-open scroll reveals for /nonprofits/.
   No JS, no IntersectionObserver, or reduced-motion: everything stays visible. */
(function(){
  var html = document.documentElement;
  html.classList.add('np-js');
  var els = Array.prototype.slice.call(document.querySelectorAll('.np-reveal'));
  if (!els.length) return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduced) {
    els.forEach(function(e){ e.classList.add('np-revealed'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting) { en.target.classList.add('np-revealed'); io.unobserve(en.target); }
    });
  }, {rootMargin: '0px 0px -8% 0px', threshold: 0.08});
  els.forEach(function(e){ io.observe(e); });
})();
