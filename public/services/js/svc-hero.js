/* sv-hero — "the field comes online."
   Play-once ignition on load: a dark node field, a diagnostic sweep traveling
   left to right with an eased profile (slow entry, decisive mid-travel, gentle
   settle), nodes igniting with a flare as it passes, flares decaying to a
   FROZEN final frame. No ambient loop — after ignition the rAF chain ends.
   Deterministic choreography (seeded PRNG): the page's "frozen choreography"
   claim is literal, identical field every load. Resize never rewinds the show:
   node positions are scaled, lit/flare state and the sweep position survive.
   Reduced-motion / low-power get the fully lit field rendered once, statically.
   No-JS gets a static SVG node-field poster painted under the canvas.
   The bug and the tick are plain HTML with animation:none; the visible tick is
   aria-hidden and a visually-hidden live region announces phase transitions
   only. Simulated — illustrative. */
(function(){
  var cv = document.getElementById('sv-hero-cv');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = (navigator.connection || {});
  var constrained = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || conn.saveData === true;
  var still = reduced || constrained; /* poster state: lit field, no motion */

  /* Deterministic PRNG (mulberry32). Fresh stream per initial seed so the
     first paint is identical on every load, everywhere. */
  var rngState = 0xE5E5;
  function rnd(){
    rngState |= 0; rngState = rngState + 0x6D2B79F5 | 0;
    var z = Math.imul(rngState ^ rngState >>> 15, 1 | rngState);
    z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z;
    return ((z ^ z >>> 14) >>> 0) / 4294967296;
  }

  var W = 0, H = 0, dpr = 1, nodes = [], t = 0;
  var running = false, raf = 0, lastTs = 0;
  var GOLD = '201,162,74', PALE = '233,211,160', INK = '10,13,20';
  var tick = document.getElementById('sv-hero-tick');
  var status = document.getElementById('sv-hero-status');
  var lastTick = '', lastStatus = '';
  var phase = 'poster';            /* poster | ignite | settle */
  var prog = 0, sweepX = -80, ignited = 0, played = false;
  var SWEEP_T = 2.6;               /* seconds of sweep travel */

  function pad(n){ return String(n).padStart(2, '0'); }
  function nodeTarget(){ return Math.max(40, Math.min(96, Math.floor(W * H / 24000))); }

  /* Eased sweep position: slow ceremonial entry, decisive mid-travel, gentle settle. */
  function sweepPos(p){
    var e = p * p * (3 - 2 * p);
    return -80 + (W + 160) * e;
  }

  function seed(oldW, oldH){
    /* Preserve the show across resizes: scale positions, keep lit/flare,
       keep the sweep position and the ignited count. Only top up the count. */
    var has = nodes.length > 0, i, n;
    var target = nodeTarget();
    if (has){
      var sx = oldW > 0 ? W / oldW : 1;
      var sy = oldH > 0 ? H / oldH : 1;
      sweepX = sweepX * sx;
      for (i = 0; i < nodes.length; i++){
        n = nodes[i];
        n.x = Math.min(W - 1, Math.max(1, n.x * sx));
        n.y = Math.min(H - 1, Math.max(1, n.y * sy));
      }
    } else {
      rngState = 0xE5E5; /* fresh deterministic stream for the initial field */
    }
    var added = 0;
    for (i = has ? nodes.length : 0; i < target; i++){
      var nx = rnd() * W, ny = rnd() * H;
      var litNow = still || played || phase === 'settle' || nx < sweepX;
      nodes.push({
        x: nx, y: ny,
        r: 1 + rnd() * 2.2, ph: rnd() * Math.PI * 2,
        lit: litNow, flare: 0
      });
      if (litNow) added++;
    }
    if (still || played || phase === 'settle'){ ignited = nodes.length; }
    else if (!has){ ignited = 0; }
    else { ignited += added; }
    if (ignited > nodes.length) ignited = nodes.length;
  }

  function resize(){
    var oldW = W, oldH = H;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var r = cv.getBoundingClientRect();
    W = Math.max(320, r.width); H = Math.max(420, r.height);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed(oldW, oldH);
    draw();
  }

  function linkDist(){ return Math.max(120, Math.min(190, W / 8)); }

  function draw(){
    ctx.clearRect(0, 0, W, H);
    /* Ink tint FIRST: nodes, links and the sweep render on top of it,
       so the ignition flare is never crushed under the overlay. */
    ctx.fillStyle = 'rgba(' + INK + ',.55)';
    ctx.fillRect(0, 0, W, H);
    var ld = linkDist(), i, j, dx, dy, d2;

    for (i = 0; i < nodes.length; i++){
      for (j = i + 1; j < nodes.length; j++){
        dx = nodes[i].x - nodes[j].x; dy = nodes[i].y - nodes[j].y; d2 = dx * dx + dy * dy;
        if (d2 < ld * ld){
          var both = nodes[i].lit && nodes[j].lit;
          var a = (1 - Math.sqrt(d2) / ld) * (both ? 0.28 : 0.05);
          ctx.strokeStyle = 'rgba(' + GOLD + ',' + a.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
        }
      }
    }

    for (i = 0; i < nodes.length; i++){
      var n = nodes[i];
      if (!n.lit){
        ctx.fillStyle = 'rgba(' + PALE + ',.07)';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill();
        continue;
      }
      var pulse = .45 + .55 * (0.5 + 0.5 * Math.sin(t * .9 + n.ph));
      var fl = n.flare > 0 ? n.flare : 0;
      ctx.fillStyle = 'rgba(' + PALE + ',' + Math.min(1, pulse * .8 + fl * .9).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + fl * 3, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(' + GOLD + ',' + Math.min(1, pulse * .25 + fl * .6).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 5 + 3 * Math.sin(t * .9 + n.ph) + fl * 14, 0, 6.2832); ctx.stroke();
    }

    if (phase === 'ignite' && prog < 1){
      var g = ctx.createLinearGradient(sweepX - 60, 0, sweepX + 60, 0);
      g.addColorStop(0, 'rgba(' + GOLD + ',0)');
      g.addColorStop(.5, 'rgba(' + GOLD + ',.32)');
      g.addColorStop(1, 'rgba(' + GOLD + ',0)');
      ctx.fillStyle = g; ctx.fillRect(sweepX - 60, 0, 120, H);
      ctx.strokeStyle = 'rgba(' + PALE + ',.75)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sweepX, 0); ctx.lineTo(sweepX, H); ctx.stroke();
    }
  }

  /* Tick: deduped DOM writes. Status: phase transitions only, never a flood. */
  function setTick(s){ if (s !== lastTick){ lastTick = s; if (tick) tick.textContent = s; } }
  function setStatus(s){ if (s !== lastStatus){ lastStatus = s; if (status) status.textContent = s; } }

  function step(ts){
    /* Delta time: identical choreography at 60Hz, 120Hz, and everything else. */
    var dt = Math.min(0.05, ((ts - lastTs) / 1000) || 1 / 60);
    lastTs = ts;
    t += dt;
    if (phase === 'ignite'){
      prog = Math.min(1, prog + dt / SWEEP_T);
      sweepX = sweepPos(prog);
      var i, n;
      for (i = 0; i < nodes.length; i++){
        n = nodes[i];
        if (!n.lit && n.x < sweepX){ n.lit = true; n.flare = 1; ignited++; }
        if (n.flare > 0) n.flare = Math.max(0, n.flare - dt * 0.85);
      }
      setTick('FIELD COMING ONLINE · ' + pad(ignited) + '/' + pad(nodes.length) + ' NODES · SIMULATED');
      if (prog >= 1){
        var cold = true;
        for (i = 0; i < nodes.length; i++){ if (nodes[i].flare > 0){ cold = false; break; } }
        if (cold){
          phase = 'settle'; played = true;
          setTick('FIELD ONLINE · ' + pad(nodes.length) + '/' + pad(nodes.length) + ' NODES · SIMULATED REPLAY');
          setStatus('Schematic complete. Simulated.');
          stop(); /* frozen final frame; the rAF chain ends here */
        }
      }
    }
    draw();
    if (running) raf = requestAnimationFrame(step);
  }

  function start(){
    if (running || still || played) return;
    running = true; lastTs = 0;
    phase = 'ignite';
    setStatus('Diagnostic sweep in progress. Simulated.');
    raf = requestAnimationFrame(step);
  }
  function stop(){ if (running){ running = false; cancelAnimationFrame(raf); } }

  resize();
  if (still){ setTick('FIELD ONLINE · SIMULATED'); setStatus('Schematic resolved. Simulated.'); }

  window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(en){
      en[0].isIntersecting ? start() : stop();
    }, {threshold: 0}).observe(cv);
  } else { start(); }

  var h = document.getElementById('sv-hero-h');
  if (h && !still){
    var words = h.textContent.trim().split(/\s+/);
    h.innerHTML = words.map(function(w, ix){
      return '<span class="w" style="transition-delay:' + (ix * 90 + 900) + 'ms">' + w + '</span>';
    }).join(' ');
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ h.classList.add('sv-kin'); }); });
  } else if (h) { h.classList.add('sv-kin'); }
})();
