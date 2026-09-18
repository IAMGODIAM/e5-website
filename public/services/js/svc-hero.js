/* sv-hero — living mesh.
   An ambient nodal network in electric blue + green on a dark field: nodes
   breathe, pulses route along links, circuit traces light as current passes,
   and every so often a node drops and the mesh reroutes around it — the page's
   failover story, taught gently in the hero itself. Continuous ambient loop;
   the IntersectionObserver pauses the rAF chain when the hero leaves the
   viewport and resumes on return.

   MOTION HONESTY — this build deliberately honors ONLY the explicit
   prefers-reduced-motion preference. The previous hero combined a play-once
   ignition (a ~4s show ending in a permanently frozen frame — anyone who
   missed the window saw a static hero) with a hardwareConcurrency/saveData
   heuristic that held the hero still on real iPhones whose owners never asked
   for stillness: Low Data Mode and low-power core reporting are not
   accessibility settings. Both failure modes are gone by design.

   Reduced-motion gets one composed frame (no loop); no-JS gets the SVG poster
   painted under the canvas in CSS. The bug and tick are plain HTML with
   animation:none; the visible tick is aria-hidden and a visually-hidden live
   region announces drop/restore events only. Simulated — illustrative. */
(function(){
  var cv = document.getElementById('sv-hero-cv');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var still = reduced; /* the explicit preference, and only it, freezes the hero */

  /* Deterministic PRNG (mulberry32) for the initial composed field. */
  var rngState = 0xE5E5;
  function rnd(){
    rngState |= 0; rngState = rngState + 0x6D2B79F5 | 0;
    var z = Math.imul(rngState ^ rngState >>> 15, 1 | rngState);
    z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z;
    return ((z ^ z >>> 14) >>> 0) / 4294967296;
  }

  var W = 0, H = 0, dpr = 1, t = 0;
  var nodes = [], links = [], pulses = [], traces = [];
  var running = false, raf = 0, lastTs = 0;
  var BLUE = '56,189,248', GREEN = '52,211,153', INK = '6,10,18';
  var tick = document.getElementById('sv-hero-tick');
  var status = document.getElementById('sv-hero-status');
  var lastTick = '', lastStatus = '';
  var dropNode = null, nextDropAt = 9, spawnT = 0;
  var PULSE_N = 9, PULSE_PX = 170;

  function pad(n){ return String(n).padStart(2, '0'); }
  function nodeTarget(){ return Math.max(40, Math.min(96, Math.floor(W * H / 24000))); }
  function linkDist(){ return Math.max(120, Math.min(190, W / 8)); }

  function seed(){
    nodes = []; links = []; pulses = []; traces = [];
    rngState = 0xE5E5;
    var n = nodeTarget(), i;
    for (i = 0; i < n; i++){
      nodes.push({
        x: rnd() * W, y: rnd() * H,
        r: 1.6 + rnd() * 2.4, ph: rnd() * 6.2832,
        blue: rnd() < 0.55,
        st: 'up', stT: 0, aS: 1, flare: 0, downFor: 0
      });
    }
    buildLinks();
    buildTraces(1 + rnd() * 4);
    nextDropAt = 8 + rnd() * 8;
  }

  function scaleTo(oldW, oldH){
    var sx = oldW > 0 ? W / oldW : 1, sy = oldH > 0 ? H / oldH : 1, i;
    for (i = 0; i < nodes.length; i++){
      nodes[i].x = Math.min(W - 1, Math.max(1, nodes[i].x * sx));
      nodes[i].y = Math.min(H - 1, Math.max(1, nodes[i].y * sy));
    }
    pulses = [];
    buildLinks();
    buildTraces(1 + Math.random() * 4);
  }

  function buildLinks(){
    links = [];
    var ld = linkDist(), i, j, dx, dy;
    for (i = 0; i < nodes.length; i++){
      for (j = i + 1; j < nodes.length; j++){
        dx = nodes[i].x - nodes[j].x; dy = nodes[i].y - nodes[j].y;
        if (dx * dx + dy * dy < ld * ld) links.push({a: nodes[i], b: nodes[j]});
      }
    }
  }

  function neighbors(nd){
    var out = [], i, L;
    for (i = 0; i < links.length; i++){
      L = links[i];
      if (L.a === nd){ if (L.b.st === 'up') out.push(L.b); }
      else if (L.b === nd){ if (L.a.st === 'up') out.push(L.a); }
    }
    return out;
  }

  /* Circuit traces: dim right-angle polylines; a current brightens each trace
     as it travels the full path. The circuit board coming to life. */
  function buildTraces(firstIn){
    traces = [];
    var k, s, x, y, horiz, segs, len, pts, cum, total, i;
    for (k = 0; k < 4; k++){
      x = rnd() * W; y = rnd() * H;
      pts = [{x: x, y: y}];
      horiz = rnd() < 0.5;
      segs = 4 + Math.floor(rnd() * 4);
      for (s = 0; s < segs; s++){
        len = 50 + rnd() * 130;
        if (horiz) x += (rnd() < 0.5 ? -1 : 1) * len;
        else y += (rnd() < 0.5 ? -1 : 1) * len;
        x = Math.max(8, Math.min(W - 8, x));
        y = Math.max(8, Math.min(H - 8, y));
        pts.push({x: x, y: y});
        horiz = !horiz;
      }
      cum = [0]; total = 0;
      for (i = 1; i < pts.length; i++){
        total += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
        cum.push(total);
      }
      traces.push({pts: pts, cum: cum, total: total,
        head: -1, speed: 240 + rnd() * 120, nextAt: firstIn + rnd() * 6});
    }
  }

  function tracePos(tr, d){
    var i = 1;
    while (i < tr.cum.length - 1 && tr.cum[i] < d) i++;
    var c0 = tr.cum[i-1], c1 = tr.cum[i];
    var f = (d - c0) / Math.max(1e-6, c1 - c0);
    var p0 = tr.pts[i-1], p1 = tr.pts[i];
    return {x: p0.x + (p1.x - p0.x) * f, y: p0.y + (p1.y - p0.y) * f};
  }

  function stepTraces(dt){
    var i, tr;
    for (i = 0; i < traces.length; i++){
      tr = traces[i];
      if (tr.head < 0){
        tr.nextAt -= dt;
        if (tr.nextAt <= 0) tr.head = 0;
      } else {
        tr.head += tr.speed * dt;
        if (tr.head > tr.total + 140){ tr.head = -1; tr.nextAt = 5 + Math.random() * 8; }
      }
    }
  }

  function spawnPulse(){
    var k, a, nb, b;
    for (k = 0; k < 12; k++){
      a = nodes[(Math.random() * nodes.length) | 0];
      if (!a || a.st !== 'up') continue;
      nb = neighbors(a);
      if (!nb.length) continue;
      b = nb[(Math.random() * nb.length) | 0];
      pulses.push({a: a, b: b, t: 0, green: Math.random() < 0.6});
      return;
    }
  }

  function stepPulses(dt){
    var i, p, dx, dy, d, nb, alt;
    spawnT -= dt;
    if (spawnT <= 0){ if (pulses.length < PULSE_N) spawnPulse(); spawnT = 0.5; }
    for (i = pulses.length - 1; i >= 0; i--){
      p = pulses[i];
      dx = p.b.x - p.a.x; dy = p.b.y - p.a.y;
      d = Math.hypot(dx, dy) || 1;
      p.t += dt * PULSE_PX / d;
      if (p.t >= 1){
        if (p.b.st !== 'up'){
          /* target went dark mid-flight: reroute off the other live edges */
          alt = neighbors(p.a);
          if (alt.length){ p.b = alt[(Math.random() * alt.length) | 0]; p.t = 0; }
          else pulses.splice(i, 1);
        } else {
          nb = neighbors(p.b);
          if (!nb.length){ pulses.splice(i, 1); }
          else { p.a = p.b; p.b = nb[(Math.random() * nb.length) | 0]; p.t = 0; }
        }
      }
    }
  }

  function stepDrop(dt){
    var n, k, c;
    if (dropNode){
      n = dropNode; n.stT += dt;
      if (n.st === 'dropping'){
        n.aS = Math.max(0.06, 1 - n.stT / 0.9);
        if (n.stT >= 0.9){
          n.st = 'down'; n.stT = 0; n.aS = 0.06;
          n.downFor = 2.6 + Math.random() * 2;
          setStatus('A node dropped. Traffic rerouted. Simulated.');
        }
      } else if (n.st === 'down'){
        if (n.stT >= n.downFor){ n.st = 'reviving'; n.stT = 0; n.flare = 1; }
      } else if (n.st === 'reviving'){
        n.aS = Math.min(1, 0.06 + n.stT / 0.7);
        n.flare = Math.max(0, 1 - n.stT / 1.1);
        if (n.stT >= 1.1){
          n.st = 'up'; n.stT = 0; n.aS = 1; n.flare = 0;
          dropNode = null;
          nextDropAt = t + 11 + Math.random() * 9;
          setStatus('Node restored. Mesh whole. Simulated.');
        }
      }
    } else if (t >= nextDropAt){
      for (k = 0; k < 20; k++){
        c = nodes[(Math.random() * nodes.length) | 0];
        if (c && c.st === 'up' && neighbors(c).length >= 2){
          c.st = 'dropping'; c.stT = 0; dropNode = c; break;
        }
      }
      if (!dropNode) nextDropAt = t + 6;
    }
  }

  function draw(){
    var i, j, L, n, p, tr, seg, m, boost, al, col;
    ctx.fillStyle = 'rgb(' + INK + ')';
    ctx.fillRect(0, 0, W, H);

    /* circuit traces, under the mesh */
    for (i = 0; i < traces.length; i++){
      tr = traces[i];
      for (j = 1; j < tr.pts.length; j++){
        m = (tr.cum[j-1] + tr.cum[j]) / 2;
        boost = tr.head >= 0 ? Math.exp(-((m - tr.head) * (m - tr.head)) / 9800) : 0;
        al = 0.08 + 0.55 * boost;
        ctx.strokeStyle = 'rgba(' + BLUE + ',' + al.toFixed(3) + ')';
        ctx.lineWidth = boost > 0.25 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(tr.pts[j-1].x, tr.pts[j-1].y);
        ctx.lineTo(tr.pts[j].x, tr.pts[j].y);
        ctx.stroke();
      }
      if (tr.head >= 0 && tr.head <= tr.total){
        var hp = tracePos(tr, tr.head);
        ctx.fillStyle = 'rgba(190,230,255,.95)';
        ctx.beginPath(); ctx.arc(hp.x, hp.y, 2.6, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(' + BLUE + ',.28)';
        ctx.beginPath(); ctx.arc(hp.x, hp.y, 7, 0, 6.2832); ctx.fill();
      }
    }
    ctx.lineWidth = 1;

    /* links */
    var ld = linkDist();
    for (i = 0; i < links.length; i++){
      L = links[i];
      var aS = Math.min(L.a.aS, L.b.aS);
      var dx = L.a.x - L.b.x, dy = L.a.y - L.b.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      al = (1 - d / ld) * (0.04 + 0.30 * aS);
      if (al <= 0.004) continue;
      ctx.strokeStyle = 'rgba(' + BLUE + ',' + al.toFixed(3) + ')';
      ctx.beginPath(); ctx.moveTo(L.a.x, L.a.y); ctx.lineTo(L.b.x, L.b.y); ctx.stroke();
    }

    /* nodes, breathing */
    for (i = 0; i < nodes.length; i++){
      n = nodes[i];
      var br = 0.5 + 0.5 * Math.sin(t * 0.9 + n.ph);
      var pulse = 0.45 + 0.55 * br;
      col = n.blue ? BLUE : GREEN;
      ctx.fillStyle = 'rgba(' + col + ',' + ((0.25 + 0.65 * pulse) * n.aS).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r * (0.8 + 0.4 * br), 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(' + col + ',' + (0.26 * n.aS * pulse).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 5 + 2 * Math.sin(t * 0.9 + n.ph), 0, 6.2832); ctx.stroke();
      if (n.flare > 0){
        ctx.strokeStyle = 'rgba(235,242,255,' + (n.flare * 0.8).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 6 + (1 - n.flare) * 26, 0, 6.2832); ctx.stroke();
      }
    }

    /* pulses with short trails */
    for (i = 0; i < pulses.length; i++){
      p = pulses[i];
      var t0 = Math.max(0, p.t - 0.07);
      var x0 = p.a.x + (p.b.x - p.a.x) * t0, y0 = p.a.y + (p.b.y - p.a.y) * t0;
      var x1 = p.a.x + (p.b.x - p.a.x) * p.t, y1 = p.a.y + (p.b.y - p.a.y) * p.t;
      var pc = p.green ? GREEN : '190,230,255';
      ctx.strokeStyle = 'rgba(' + pc + ',.35)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.fillStyle = 'rgba(' + pc + ',.95)';
      ctx.beginPath(); ctx.arc(x1, y1, 2.2, 0, 6.2832); ctx.fill();
      ctx.lineWidth = 1;
    }
  }

  function setTick(s){ if (s !== lastTick){ lastTick = s; if (tick) tick.textContent = s; } }
  function setStatus(s){ if (s !== lastStatus){ lastStatus = s; if (status) status.textContent = s; } }

  function stepTick(){
    setTick(dropNode
      ? 'SIMULATED MESH · NODE DOWN · REROUTING · DESIGNED BEHAVIOR'
      : 'SIMULATED MESH · ' + pad(nodes.length) + ' NODES · DESIGNED BEHAVIOR');
  }

  function step(ts){
    var dt = Math.min(0.05, ((ts - lastTs) / 1000) || 1 / 60);
    lastTs = ts;
    t += dt;
    stepDrop(dt);
    stepPulses(dt);
    stepTraces(dt);
    stepTick();
    draw();
    if (running) raf = requestAnimationFrame(step);
  }

  function start(){
    if (running || still) return;
    running = true; lastTs = 0;
    raf = requestAnimationFrame(step);
  }
  function stop(){ if (running){ running = false; cancelAnimationFrame(raf); } }

  function resize(){
    var oldW = W, oldH = H;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var r = cv.getBoundingClientRect();
    W = Math.max(320, r.width); H = Math.max(420, r.height);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (nodes.length) scaleTo(oldW, oldH); else seed();
    if (still){ t = 1.7; draw(); }
  }

  resize();
  if (still){
    setTick('SIMULATED MESH · DESIGNED BEHAVIOR');
    setStatus('Mesh schematic. Motion off. Simulated.');
  }

  window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(en){
      en[0].isIntersecting ? start() : stop();
    }, {threshold: 0}).observe(cv);
  } else { start(); }

  /* Kinetic H1 word-ramp (unchanged): words arrive staggered after load. */
  var h = document.getElementById('sv-hero-h');
  if (h && !still){
    var words = h.textContent.trim().split(/\s+/);
    h.innerHTML = words.map(function(w, ix){
      return '<span class="w" style="transition-delay:' + (ix * 90 + 900) + 'ms">' + w + '</span>';
    }).join(' ');
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ h.classList.add('sv-kin'); }); });
  } else if (h) { h.classList.add('sv-kin'); }
})();
