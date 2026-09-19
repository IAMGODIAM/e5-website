/* svc-filmbreak.js — "The cutover weekend": user-driven console, NO autoplay.
   Native range scrubber (keyboard + screen-reader operable); 12 site markers
   flip queued→cut as the scrub head passes their cut points; site 09 faults
   at its point and resolves on retry; the reroute window is a labeled band.
   PLAY WEEKEND runs the 8s choreography once, user-initiated, on the shared
   clock (t = elapsed/8000, timestamped events). Scrubbing during PLAY cancels
   the loop and reverts to manual. No scroll linkage: the old scroll-linked +
   manualUntil mechanism is deleted entirely — this console never auto-advances
   on scroll. Replaces the canvas svc-filmbreak.js (replacement, not addition).
   Honesty: SIMULATED REPLAY rail header fences the readout; every value
   illustrative, invented for the visualization. */
(function(){
  var M = window.SvMotion;
  var fig = document.getElementById('sv-film-fig');
  if (!fig || !M) return; /* fail-closed: markup default is the end frame */
  var head = document.getElementById('sv-film-head');
  var arc = document.getElementById('sv-film-arc');
  var gapband = document.getElementById('sv-film-gapband');
  var markers = Array.prototype.slice.call(fig.querySelectorAll('.sv-mk'));
  var scrub = document.getElementById('sv-film-scrub');
  var tick = document.getElementById('sv-film-tick');
  var live = document.getElementById('sv-film-live');
  var playBtn = document.getElementById('sv-film-play');
  if (markers.length !== 12 || !scrub) return;

  /* Scenario coordinates on the shared weekend timeline (t in [0,1]).
     Sites 01–08 cut in order; site 09 faults at FAULT_T and resolves on
     retry at RETRY_T; sites 10–12 cut after the reroute window. */
  var CUT_T = [1/12, 2/12, 3/12, 4/12, 5/12, 6/12, 7/12, 8/12, 2, 10/12, 11/12, 12/12];
  var FAULT_T = 0.75, RETRY_T = 0.96, ARC_T = 0.78;

  function clock(t){
    var mins = Math.round(t * 62 * 60); /* FRI 6:00 PM -> MON 8:00 AM */
    var names = ['FRI', 'SAT', 'SUN', 'MON'];
    var m = 18 * 60 + mins, day = 0;
    while (m >= 24 * 60){ m -= 24 * 60; day++; }
    var hh = Math.floor(m / 60), mm = m % 60, ap = hh >= 12 ? 'PM' : 'AM', h12 = hh % 12 || 12;
    return names[Math.min(3, day)] + ' ' + h12 + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap;
  }

  /* Writes only — no layout reads (no getBoundingClientRect etc.) here. */
  function render(t){
    if (head) head.style.left = (t * 100).toFixed(2) + '%';
    var done = 0;
    for (var i = 0; i < 12; i++){
      var mk = markers[i], st;
      if (i === 8){
        if (t >= RETRY_T){ st = 'cut-hist'; done++; }
        else if (t >= FAULT_T){ st = 'fault'; }
        else { st = 'q'; }
      } else if (t >= CUT_T[i]){ st = 'cut'; done++; }
      else { st = 'q'; }
      if (mk.getAttribute('data-mk') !== st) mk.setAttribute('data-mk', st);
    }
    if (arc){
      var ao = t >= ARC_T ? '1' : '0';
      if (arc.getAttribute('data-on') !== ao){
        arc.setAttribute('data-on', ao);
        arc.style.opacity = ao;
      }
    }
    if (tick) tick.textContent = clock(t) + ' · ' + done + '/12 SITES CUT OVER';
  }

  var ctl = null;
  function stopPlay(silent){
    if (ctl && ctl.isPlaying()){
      ctl.cancel();
      ctl = null;
      if (playBtn){ playBtn.disabled = false; playBtn.textContent = '▶ PLAY WEEKEND'; }
      if (tick) tick.setAttribute('aria-live', 'polite');
      if (!silent && live) live.textContent = 'Simulated replay stopped. Scrubber is manual.';
    }
  }

  scrub.addEventListener('input', function(){
    stopPlay(true); /* scrubbing during PLAY cancels the loop: back to manual */
    render(scrub.value / 1000);
  });

  if (playBtn) playBtn.addEventListener('click', function(){
    if (ctl && ctl.isPlaying()) return;
    stopPlay(true);
    if (tick) tick.setAttribute('aria-live', 'off'); /* no 8s live-region spam */
    playBtn.disabled = true;
    playBtn.textContent = 'PLAYING';
    render(0);
    scrub.value = 0;
    ctl = M.film({
      dur: 8000,
      events: [],
      onFrame: function(el){
        var t = Math.min(1, el / 8000);
        render(t);
        if (document.activeElement !== scrub) scrub.value = Math.round(t * 1000);
      },
      onDone: function(){
        render(1);
        scrub.value = 1000;
        ctl = null;
        playBtn.disabled = false;
        playBtn.textContent = '▶ PLAY WEEKEND';
        if (tick) tick.setAttribute('aria-live', 'polite');
        if (live) live.textContent = 'Simulated replay complete, 12 of 12 sites';
      }
    });
    ctl.play();
  });

  /* Offscreen pause during PLAY: the shared clock shifts, t stays honest. */
  var autoPaused = false;
  M.watchOffscreen(fig,
    function(){ if (ctl && ctl.isPlaying()){ ctl.pause(); autoPaused = true; } },
    function(){ if (autoPaused){ autoPaused = false; if (ctl) ctl.resume(); } });

  if (M.reduced){
    /* End state: fault marker resolved-to-cut, gap band labeled, head parked
       at MON 8:00 AM — the honest-gap story survives reduced motion. */
    render(1);
    scrub.value = 1000;
    if (playBtn) playBtn.hidden = true;
    return;
  }
  render(0);
  scrub.value = 0;
})();
