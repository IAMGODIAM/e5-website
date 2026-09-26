/* np-motion.js — play-once figures for /nonprofits/:
   (a) the verification-pipeline replay: five gates light in sequence while a
       mono event log narrates; (b) the readiness-audit progress counter.
   Reduced-motion or no IntersectionObserver: everything lands lit instantly.
   The noscript DOM already carries the complete static reading. */
(function(){
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- verification pipeline ---------- */
  var rail = document.getElementById('np-pipe');
  var log = document.getElementById('np-log');
  var verdict = document.getElementById('np-verdict');
  var LOG = [
    ['00:00.6', 'EIN received — application opened.'],
    ['00:01.7', 'IRS exempt status — determination on file, no revocation … <span class="ok">CLEAR</span>'],
    ['00:02.8', '990 profile — filings found, mission matches … <span class="ok">CLEAR</span>'],
    ['00:03.9', 'SAM.gov — registration active, no exclusions … <span class="ok">CLEAR</span>'],
    ['00:05.0', 'Sanctions screen — no matches … <span class="ok">CLEAR</span>'],
    ['00:06.2', '<span class="hl">VERIFIED</span> — service unlocked. Re-verification in 12 months.']
  ];
  var gates = rail ? Array.prototype.slice.call(rail.querySelectorAll('.np-gate')) : [];

  function addLog(i){
    if (!log) return;
    var p = document.createElement('p');
    p.className = 'np-log-line';
    p.innerHTML = '<span class="t">[' + LOG[i][0] + ']</span> ' + LOG[i][1];
    log.appendChild(p);
    while (log.children.length > 8) log.removeChild(log.firstChild);
  }
  function landAll(){
    gates.forEach(function(g){ g.classList.add('np-on'); });
    for (var i = 0; i < LOG.length; i++) addLog(i);
    if (verdict) verdict.classList.add('np-on');
    rail && rail.classList.add('np-static');
  }
  var fired = false;
  function play(){
    if (fired) return; fired = true;
    if (reduced || !hasIO) { landAll(); return; }
    var timers = [];
    gates.forEach(function(g, i){
      timers.push(setTimeout(function(){
        g.classList.add('np-on'); addLog(i);
      }, 600 + i * 1100));
    });
    timers.push(setTimeout(function(){
      addLog(5);
      if (verdict) verdict.classList.add('np-on');
    }, 600 + gates.length * 1100));
  }
  if (rail) {
    if (reduced || !hasIO) { landAll(); }
    else {
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if (en.isIntersecting) { play(); io.disconnect(); }
        });
      }, {threshold: 0.3});
      io.observe(rail);
    }
  }

  /* ---------- readiness audit progress ---------- */
  var count = document.getElementById('np-audit-count');
  var fill = document.getElementById('np-audit-fill');
  var live = document.getElementById('np-audit-status');
  var boxes = Array.prototype.slice.call(document.querySelectorAll('.np-check input[type="checkbox"]'));
  function recount(){
    var n = boxes.filter(function(b){ return b.checked; }).length;
    if (count) count.textContent = n;
    if (fill) fill.style.width = (n / boxes.length * 100) + '%';
    if (live) live.textContent = n + ' of ' + boxes.length + ' checked.';
    boxes.forEach(function(b){
      var lbl = b.closest('.np-check');
      if (lbl) lbl.classList.toggle('done', b.checked);
    });
  }
  boxes.forEach(function(b){ b.addEventListener('change', recount); });
  recount();
})();
