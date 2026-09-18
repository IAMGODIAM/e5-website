(function(){
  var cv = document.getElementById('sv-film-cv');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scrub = document.getElementById('sv-film-scrub');
  var tick = document.getElementById('sv-film-tick');

  var W = 1200, H = 400, t = 1, manualUntil = 0, filmEl = document.getElementById('sv-film');
  var N = 12, X0 = 90, X1 = 1110, CY = 210;
  var GOLD = '201,162,74', GREEN = '127,201,143', DIM = '107,114,132';

  function dprSetup(){
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = 1200 * dpr; cv.height = 400 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function clock(tt){

    var mins = Math.round(tt * 62 * 60);
    var names = ['FRI','SAT','SUN','MON'];
    var day = 0, m = 18 * 60 + mins;
    while (m >= 24 * 60){ m -= 24 * 60; day++; }
    var hh = Math.floor(m / 60), mm = m % 60, ap = hh >= 12 ? 'PM' : 'AM', h12 = hh % 12 || 12;
    return names[Math.min(3, day)] + ' ' + h12 + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap;
  }
  function siteX(i){ return X0 + (X1 - X0) * (i / (N - 1)); }
  function draw(){
    ctx.clearRect(0, 0, W, H);
    var sx = X0 + (X1 - X0) * t, i, x, cut;

    ctx.strokeStyle = 'rgba(201,162,74,.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X0, 330); ctx.lineTo(X1, 330); ctx.stroke();
    ctx.font = '20px "IBM Plex Mono", monospace'; ctx.fillStyle = 'rgba(154,161,180,.9)';
    ctx.textAlign = 'center';
    var marks = [[0,'FRI 6:00 PM'],[0.387,'SAT 6:00 PM'],[0.774,'SUN 6:00 PM'],[1,'MON 8:00 AM']];
    marks.forEach(function(m){
      var mx = X0 + (X1 - X0) * m[0];
      ctx.fillStyle = 'rgba(201,162,74,.5)';
      ctx.fillRect(mx - .5, 322, 1, 16);
      ctx.fillStyle = 'rgba(154,161,180,.9)';
      ctx.fillText(m[1], mx, 362);
    });

    var g = ctx.createLinearGradient(sx - 90, 0, sx, 0);
    g.addColorStop(0, 'rgba(201,162,74,0)'); g.addColorStop(1, 'rgba(201,162,74,.14)');
    ctx.fillStyle = g; ctx.fillRect(X0, 90, Math.max(0, sx - X0), 200);
    ctx.strokeStyle = 'rgba(233,211,160,.95)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(sx, 90); ctx.lineTo(sx, 300); ctx.stroke();

    ctx.font = '19px "IBM Plex Mono", monospace';
    var done = 0;
    for (i = 0; i < N; i++){
      x = siteX(i); cut = x <= sx;
      if (cut) done++;
      ctx.beginPath(); ctx.arc(x, CY, 15, 0, 6.2832);
      if (cut){
        ctx.fillStyle = 'rgba(127,201,143,.16)'; ctx.fill();
        ctx.strokeStyle = 'rgba(' + GREEN + ',.95)'; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.strokeStyle = 'rgba(' + GREEN + ',.95)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - 6.5, CY); ctx.lineTo(x - 1.5, CY + 5); ctx.lineTo(x + 7, CY - 6); ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(' + DIM + ',.55)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(217,164,65,.85)';
        ctx.beginPath(); ctx.arc(x, CY, 4, 0, 6.2832); ctx.fill();
      }
      ctx.fillStyle = cut ? 'rgba(233,211,160,.95)' : 'rgba(154,161,180,.75)';
      ctx.fillText('S' + (i < 9 ? '0' : '') + (i + 1), x, CY + 44);
    }
    if (tick) tick.textContent = clock(t) + ' · ' + done + '/12 SITES CUT OVER';
    if (scrub && document.activeElement !== scrub) scrub.value = Math.round(t * 1000);
  }
  function scrollDrive(){
    if (!filmEl || reduced || Date.now() < manualUntil) return;
    var r = filmEl.getBoundingClientRect(), vh = window.innerHeight;

    var p = 1 - (r.top + r.height * 0.5) / (vh + r.height * 0.5);
    p = Math.max(0, Math.min(1, p));

    t = p; draw();
  }
  if (scrub){
    scrub.addEventListener('input', function(){
      t = scrub.value / 1000;
      manualUntil = Date.now() + 6000;
      draw();
    });
  }
  dprSetup();
  window.addEventListener('resize', dprSetup);
  if (!reduced && 'IntersectionObserver' in window){
    var ticking = false;
    window.addEventListener('scroll', function(){
      if (ticking) return; ticking = true;
      requestAnimationFrame(function(){ scrollDrive(); ticking = false; });
    }, {passive: true});
    scrollDrive();
  } else { t = 1; draw(); } // reduced-motion: the labeled end state
})();
