(function(){
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var figs = Array.prototype.slice.call(document.querySelectorAll('svg[data-fig]'));
  if (!figs.length) return;

  function prep(fig){
    fig.querySelectorAll('[data-draw]').forEach(function(p){
      try {
        var L = p.getTotalLength();
        p.style.strokeDasharray = L;
        p.style.strokeDashoffset = reduced ? 0 : L;
        if (!reduced) p.style.transition = 'stroke-dashoffset 1.3s ease .15s';
      } catch(e){}
    });
    if (reduced) return;
    fig.querySelectorAll('[data-seq]').forEach(function(seq){
      Array.prototype.forEach.call(seq.children, function(c){ c.style.opacity = 0; });
    });
    fig.querySelectorAll('.lamp').forEach(function(l){ l.style.fill = ''; });
  }
  function settle(fig){
    if (!reduced){
      fig.querySelectorAll('[data-draw]').forEach(function(p){ p.style.strokeDashoffset = 0; });
      fig.querySelectorAll('[data-seq]').forEach(function(seq){
        Array.prototype.forEach.call(seq.children, function(c, i){
          c.style.transition = 'opacity .55s ease ' + (0.25 + i * 0.22) + 's';
          c.style.opacity = 1;
        });
      });
    }
    fig.classList.add('fig-settled');
  }
  figs.forEach(prep);
  if (reduced || !('IntersectionObserver' in window)){ figs.forEach(settle); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){ settle(en.target); io.unobserve(en.target); }
    });
  }, {threshold: 0.35});
  figs.forEach(function(f){ io.observe(f); });
})();
