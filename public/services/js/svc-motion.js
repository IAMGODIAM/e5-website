/* svc-motion.js — shared motion primitives for the /services/ play-once films:
   rAF film scheduler (performance.now-anchored events), offscreen pause,
   reduced-motion gate, DPR clamp, seeded PRNG, easings. */
window.SvMotion = (function(){
  function mq(q){ return (window.matchMedia && window.matchMedia(q).matches) || false; }
  var reduced = mq('(prefers-reduced-motion: reduce)');
  var conn = navigator.connection || {};
  function constrained(){
    return conn.saveData === true ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  }
  function now(){ return performance.now(); }
  function dpr(max){ return Math.min(max || 2, window.devicePixelRatio || 1); }
  function easeInOut(p){ return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function easeOut(p){ return 1 - Math.pow(1 - p, 3); }
  function rng(seed){
    var a = seed >>> 0;
    return function(){
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* cfg: {dur, events:[{t, fn}], onFrame(el), onDone}. Events fire when
     elapsed >= timestamp on the shared clock. No frame counters, no
     uncorrected setTimeout chains. pause()/resume() shift the clock. */
  function film(cfg){
    var raf = 0, startT = 0, idx = 0, playing = false, pausedAt = 0;
    function dispatch(el){
      var evs = cfg.events;
      while (idx < evs.length && evs[idx].t <= el){
        try { evs[idx].fn(el); } catch (e) {}
        idx++;
      }
    }
    function step(){
      if (!playing) return;
      var el = now() - startT;
      dispatch(el);
      if (cfg.onFrame){ try { cfg.onFrame(el); } catch (e) {} }
      if (el < cfg.dur){ raf = requestAnimationFrame(step); }
      else { playing = false; raf = 0; if (cfg.onDone){ try { cfg.onDone(); } catch (e) {} } }
    }
    return {
      play: function(){
        if (playing) return;
        idx = 0; pausedAt = 0; startT = now(); playing = true;
        raf = requestAnimationFrame(step);
      },
      cancel: function(){
        playing = false; pausedAt = 0;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      },
      pause: function(){
        if (playing && !pausedAt){
          pausedAt = now(); playing = false;
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      resume: function(){
        if (pausedAt && !playing){
          startT += now() - pausedAt; pausedAt = 0; playing = true;
          raf = requestAnimationFrame(step);
        }
      },
      isPlaying: function(){ return playing; }
    };
  }
  function onceVisible(el, cb, thr){
    if (reduced || !('IntersectionObserver' in window) || !el) return false;
    var io = new IntersectionObserver(function(en){
      if (en[0].isIntersecting){ io.disconnect(); cb(); }
    }, {threshold: thr || 0.4});
    io.observe(el);
    return true;
  }
  function watchOffscreen(el, onHide, onShow){
    if (!('IntersectionObserver' in window) || !el) return null;
    var io = new IntersectionObserver(function(en){
      if (en[0].isIntersecting){ onShow(); } else { onHide(); }
    }, {threshold: 0.05});
    io.observe(el);
    return io;
  }
  return {
    reduced: reduced, constrained: constrained, now: now, dpr: dpr,
    easeInOut: easeInOut, easeOut: easeOut, rng: rng, film: film,
    onceVisible: onceVisible, watchOffscreen: watchOffscreen
  };
})();
