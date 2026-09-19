/* svc-figs.js — settle animations for the /services/ SVG figures, plus the
   Fig.07 "Two paths" failover mini-film (~7s, play-once).
   Conventions reused: [data-draw] for the backup path light, [data-seq]
   marks the packet group. Markup default is the composed end state (the
   no-JS / reduced-motion frame); the film rewinds to start, then plays once
   on SvMotion's shared clock. The 600ms honest gap is sever (t=2800) to
   backup-light (t=3400) — no events inside the window.
   STILL_TAKING is one inseparable string constant in every render path. */
(function(){
  var M = window.SvMotion;
  var reduced = (M && M.reduced) ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var figs = Array.prototype.slice.call(document.querySelectorAll('svg[data-fig]'));
  if (!figs.length) return;

  /* One inseparable constant — never rendered as "STILL TAKING PAYMENTS" alone. */
  var STILL_TAKING = 'STILL TAKING PAYMENTS · SIMULATED';

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

  /* Fig.07 failover mini-film. ~11 nodes: 2 paths, 6 packets, cut mark,
     mid label, gap label, end stamp. Packets travel on precomputed
     coordinates via transform; the flow clock freezes during the gap. */
  function failoverFilm(fig){
    if (!M) return; /* fail-closed: markup default is the end state */
    function q(s){ return fig.querySelector(s); }
    var primary = q('#f7-primary'), backup = q('#f7-backup'), cut = q('#f7-cut'),
        mid = q('#f7-midlabel'), gap = q('#f7-gaplabel'), end = q('#f7-endstamp'),
        pkts = Array.prototype.slice.call(fig.querySelectorAll('.f7-pkt'));
    if (!primary || !backup || !cut || pkts.length !== 6) return;
    if (end) end.textContent = STILL_TAKING; /* one constant, every render path */

    /* Rewind to the start state (markup default is the end state). */
    var L = 0;
    try { L = backup.getTotalLength(); } catch(e){}
    if (L){
      backup.style.strokeDasharray = L;
      backup.style.strokeDashoffset = L;
    }
    backup.style.opacity = 0.2;
    primary.style.opacity = 1;
    [cut, mid, gap, end].forEach(function(el){ if (el){ el.style.opacity = 0; } });

    var PX0 = 130, PX1 = 510, PY = 122; /* primary: straight, precomputed */
    var BPTS = []; /* backup: quadratic samples, precomputed */
    for (var i = 0; i <= 48; i++){
      var p = i / 48, u = 1 - p;
      BPTS.push([u*u*130 + 2*u*p*320 + p*p*510, u*u*250 + 2*u*p*300 + p*p*250]);
    }
    function bpos(pp){
      var f = Math.min(1, Math.max(0, pp)) * 48, i0 = Math.floor(f), i1 = Math.min(48, i0 + 1), fr = f - i0;
      var a = BPTS[i0], b = BPTS[i1];
      return [a[0] + (b[0] - a[0]) * fr, a[1] + (b[1] - a[1]) * fr];
    }
    var launches = [0, 450, 900, 1350, 3600, 4050], DURP = 2400;
    var SEVER = 2800, RELIGHT = 3400; /* the honest gap: 600ms, no events inside */
    function flowTime(el){
      return el < SEVER ? el : (el < RELIGHT ? SEVER : el - (RELIGHT - SEVER));
    }
    function place(el){
      var ft = flowTime(el);
      for (var k = 0; k < pkts.length; k++){
        var pr = (ft - launches[k]) / DURP, pkt = pkts[k], pos;
        if (pr <= 0){ pkt.style.opacity = 0; pos = [PX0, PY]; }
        else if (pr >= 1){ pkt.style.opacity = 1; pos = [PX1, 250]; }
        else {
          pkt.style.opacity = 1;
          pos = ft < SEVER ? [PX0 + (PX1 - PX0) * pr, PY] : bpos(pr);
        }
        pkt.setAttribute('transform', 'translate(' + pos[0].toFixed(1) + ',' + pos[1].toFixed(1) + ')');
      }
    }
    function fade(el, to){
      if (!el) return;
      el.style.transition = 'opacity .5s ease';
      el.style.opacity = to;
    }
    var ctl = M.film({
      dur: 7000,
      events: [
        {t: 0, fn: function(){ place(0); }},
        {t: SEVER, fn: function(){
          cut.style.transition = 'opacity .3s ease'; cut.style.opacity = 1;
          primary.style.transition = 'opacity .4s ease'; primary.style.opacity = 0.28;
          fade(mid, 1); fade(gap, 1);
        }},
        /* SEVER–RELIGHT: THE HONEST GAP — no events. */
        {t: RELIGHT, fn: function(){
          backup.style.transition = 'stroke-dashoffset 1.2s ease, opacity .6s ease';
          backup.style.strokeDashoffset = 0;
          backup.style.opacity = 1;
        }},
        {t: 6600, fn: function(){ fade(end, 1); }}
      ],
      onFrame: place,
      onDone: function(){ place(7000); }
    });
    var autoPaused = false;
    M.watchOffscreen(fig,
      function(){ if (ctl.isPlaying()){ ctl.pause(); autoPaused = true; } },
      function(){ if (autoPaused){ autoPaused = false; ctl.resume(); } });
    M.onceVisible(fig, function(){ ctl.play(); }, 0.35);
  }

  figs.forEach(function(fig){
    if (fig.getAttribute('data-film') === 'failover'){
      if (!reduced && M) failoverFilm(fig);
      else fig.classList.add('fig-settled');
      return;
    }
    prep(fig);
  });
  var staticFigs = figs.filter(function(f){ return f.getAttribute('data-film') !== 'failover'; });
  if (reduced || !('IntersectionObserver' in window)){ staticFigs.forEach(settle); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){ settle(en.target); io.unobserve(en.target); }
    });
  }, {threshold: 0.35});
  staticFigs.forEach(function(f){ io.observe(f); });
})();
