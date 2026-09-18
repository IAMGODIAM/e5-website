(function(){
  var cv = document.getElementById('sv-hero-cv');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = (navigator.connection || {});
  var constrained = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || conn.saveData === true;

  var W = 0, H = 0, dpr = 1, nodes = [], t = 0, running = false, raf = 0;
  var GOLD = '201,162,74', PALE = '233,211,160', INK = '10,13,20';

  function seed(){
    nodes = [];
    var n = Math.max(36, Math.min(90, Math.floor(W * H / 26000)));
    for (var i = 0; i < n; i++){
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
        r: 1 + Math.random() * 2.2, ph: Math.random() * Math.PI * 2
      });
    }
  }
  function resize(){
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var r = cv.getBoundingClientRect();
    W = Math.max(320, r.width); H = Math.max(420, r.height);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    draw();
  }
  function linkDist(){ return Math.max(120, Math.min(190, W / 8)); }
  function draw(){
    ctx.clearRect(0, 0, W, H);
    var ld = linkDist(), pulse, i, j, dx, dy, d2;

    for (i = 0; i < nodes.length; i++){
      for (j = i + 1; j < nodes.length; j++){
        dx = nodes[i].x - nodes[j].x; dy = nodes[i].y - nodes[j].y; d2 = dx*dx + dy*dy;
        if (d2 < ld*ld){
          var a = (1 - Math.sqrt(d2) / ld) * 0.28;
          ctx.strokeStyle = 'rgba(' + GOLD + ',' + a.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
        }
      }
    }

    for (i = 0; i < nodes.length; i++){
      var n = nodes[i];
      pulse = .45 + .55 * (0.5 + 0.5 * Math.sin(t * .9 + n.ph));
      ctx.fillStyle = 'rgba(' + PALE + ',' + (pulse * .8).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(' + GOLD + ',' + (pulse * .25).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 5 + 3 * Math.sin(t * .9 + n.ph), 0, 6.2832); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(' + INK + ',.55)';
    ctx.fillRect(0, 0, W, H);
  }
  function step(){
    t += 1 / 60;
    for (var i = 0; i < nodes.length; i++){
      var n = nodes[i];
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    }
    draw();
    raf = requestAnimationFrame(step);
  }
  function start(){ if (!running && !reduced && !constrained){ running = true; step(); } }
  function stop(){ if (running){ running = false; cancelAnimationFrame(raf); } }

  resize();
  window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(en){
      en[0].isIntersecting ? start() : stop();
    }, {threshold: 0}).observe(cv);
  } else { start(); }

  var h = document.getElementById('sv-hero-h');
  if (h && !reduced && !constrained){
    var words = h.textContent.trim().split(/\s+/);
    h.innerHTML = words.map(function(w){ return '<span class="w" style="transition-delay:' + (words.indexOf(w) * 90) + 'ms">' + w + '</span>'; }).join(' ');
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ h.classList.add('sv-kin'); }); });
  } else if (h) { h.classList.add('sv-kin'); }
})();
