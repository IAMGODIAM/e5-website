/* np-hero.js — the commons waking: a FINITE play-once canvas sequence.
   Five organizations light in order as verification pulses travel between them,
   then the frame settles and the loop stops. Motion teaches the "commons" idea;
   decorative ambient loops do not ship. Reduced-motion: final frame, no loop. */
(function(){
  var cv = document.getElementById('np-hero-cv');
  if (!cv) return;
  var tick = document.getElementById('np-hero-tick');
  var status = document.getElementById('np-hero-status');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Hand-placed constellation (P17): node coords in a 1200x700 design space. */
  var NODES = [
    {x:240,  y:180, label:'NONPROFIT'},
    {x:480,  y:120, label:'HOUSE OF WORSHIP'},
    {x:720,  y:240, label:'COMMUNITY CLINIC'},
    {x:960,  y:160, label:'MUTUAL-AID GROUP'},
    {x:600,  y:460, label:'CHAPTER · COALITION'}
  ];
  var EDGES = [[0,1],[1,2],[2,3],[0,4],[2,4],[3,4]];
  /* Choreography: [nodeIdx lights at ms, [from,to] pulse at ms] — frozen, replayable. */
  var LIGHTS = [500, 1400, 2400, 3400, 4500];
  var PULSES = [[800,0,1],[1800,1,2],[2800,2,3],[3900,2,4],[3900,3,4],[3900,0,4]];
  var PULSE_MS = 900, END = 6200;

  var ctx = cv.getContext('2d');
  var W = 0, H = 0, dpr = 1, raf = 0, t0 = 0, playing = false, done = false, started = false;

  function size(){
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.max(1, Math.round(W * dpr));
    cv.height = Math.max(1, Math.round(H * dpr));
  }
  function X(x){ return x / 1200 * W; }
  function Y(y){ return y / 700 * H; }
  function ease(p){ return p < .5 ? 2*p*p : 1 - Math.pow(-2*p+2, 2)/2; }

  function draw(el){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var s = Math.min(W/1200, H/700) * 1.15; /* label scale */
    /* edges */
    EDGES.forEach(function(e){
      var a = NODES[e[0]], b = NODES[e[1]];
      ctx.strokeStyle = 'rgba(201,162,74,.16)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(a.x), Y(a.y)); ctx.lineTo(X(b.x), Y(b.y)); ctx.stroke();
    });
    /* pulses */
    PULSES.forEach(function(p){
      var t = p[0], a = NODES[p[1]], b = NODES[p[2]];
      var pr = (el - t) / PULSE_MS;
      if (pr < 0 || pr > 1) return;
      var px = X(a.x) + (X(b.x)-X(a.x)) * pr, py = Y(a.y) + (Y(b.y)-Y(a.y)) * pr;
      var g = ctx.createRadialGradient(px, py, 0, px, py, 26);
      g.addColorStop(0, 'rgba(233,211,160,.95)'); g.addColorStop(1, 'rgba(233,211,160,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 26, 0, 7); ctx.fill();
    });
    /* nodes */
    NODES.forEach(function(n, i){
      var lr = Math.max(0, Math.min(1, (el - LIGHTS[i]) / 700));
      var e = ease(lr);
      var px = X(n.x), py = Y(n.y);
      if (e > 0) {
        var g = ctx.createRadialGradient(px, py, 0, px, py, 44);
        g.addColorStop(0, 'rgba(201,162,74,' + (0.55*e).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(201,162,74,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 44, 0, 7); ctx.fill();
      }
      ctx.fillStyle = 'rgba(201,162,74,' + (0.25 + 0.75*e).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(px, py, 3 + 2*e, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(201,162,74,' + (0.3 + 0.5*e).toFixed(3) + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(px, py, 12 + 4*e, 0, 7); ctx.stroke();
      ctx.font = '500 ' + Math.round(11*s) + 'px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgba(154,161,180,' + (0.35 + 0.65*e).toFixed(3) + ')';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, px, py + 34);
    });
  }

  function finish(){
    playing = false; done = true;
    if (raf) cancelAnimationFrame(raf);
    draw(END);
    if (tick) tick.textContent = 'COMMONS LIT · SIMULATED';
    if (status) status.textContent = 'Commons lit. Simulated replay complete.';
  }
  function step(now){
    if (!playing) return;
    var el = now - t0;
    if (el >= END) { finish(); return; }
    draw(el);
    raf = requestAnimationFrame(step);
  }
  function start(){
    if (started) return; started = true;
    size();
    if (reduced) { draw(END); finish(); return; }
    t0 = performance.now(); playing = true;
    raf = requestAnimationFrame(step);
  }

  size();
  window.addEventListener('resize', function(){
    size();
    draw(done ? END : (playing ? (performance.now() - t0) : 0));
  });

  /* Offscreen pause: play once, only while visible. */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting && !started) { start(); io.disconnect(); }
      });
    }, {threshold: 0.25});
    io.observe(cv);
  } else { start(); }
})();
