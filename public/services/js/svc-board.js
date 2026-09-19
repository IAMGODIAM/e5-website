/* svc-board.js — FIG.C "The rollout board": DOM play-once film (~10s).
   16 nodes: 12 site tiles + reroute arc + gap label + crew token + stamp.
   Frozen choreography, timestamped on SvMotion's shared clock; the 600ms
   honest gap is the interval between two events (t=4500, t=5100) — no frame
   counters, no uncorrected setTimeout chains. Animated properties are
   transform + opacity only (tile state swaps are instantaneous flips;
   the blink/pulse keyframes use opacity/transform only).
   Replaces the canvas svc-board.js (replacement, not addition).
   Honesty: SIMULATED · DESIGNED BEHAVIOR bug in-frame; OPS REPLAY adjacent;
   every value illustrative, invented for the visualization. */
(function(){
  var M = window.SvMotion;
  var stage = document.getElementById('sv-board-stage');
  if (!stage || !M) return; /* fail-closed: markup default is the end frame */
  var tiles = Array.prototype.slice.call(stage.querySelectorAll('.sv-tile'));
  if (tiles.length !== 12) return;
  var tick = document.getElementById('sv-board-tick');
  var live = document.getElementById('sv-board-live');
  var playBtn = document.getElementById('sv-board-play');
  var gap = document.getElementById('sv-board-gap');
  var DUR = 10000, GAP_T0 = 4500, GAP_T1 = 5100;

  function stamp(s){ if (tick) tick.textContent = s; }
  function say(s){ if (live) live.textContent = s; }
  function setState(n, st){ tiles[n - 1].setAttribute('data-state', st); }
  function hist9(on){
    if (on) tiles[8].setAttribute('data-hist', 'fault');
    else tiles[8].removeAttribute('data-hist');
  }

  /* Frozen choreography. NOTE: no events may be scheduled with
     GAP_T0 < t < GAP_T1 — the gap label's own fade-in at t=4500 is the
     only transition inside the window, and it is part of the gap. */
  var EV = [
    {t: 0,    fn: function(){ stamp('WAVE 01/03 · CUTOVER IN SEQUENCE'); }},
    {t: 300,  fn: function(){ setState(1, 'cut'); }},
    {t: 600,  fn: function(){ setState(2, 'cut'); }},
    {t: 900,  fn: function(){ setState(3, 'cut'); }},
    {t: 1200, fn: function(){ setState(4, 'cut'); }},
    {t: 1500, fn: function(){ stamp('WAVE 02/03 · CUTOVER IN SEQUENCE'); setState(5, 'cut'); }},
    {t: 1800, fn: function(){ setState(6, 'cut'); }},
    {t: 2200, fn: function(){ stamp('WAVES 01–02 · 6/12 CUT'); }},
    {t: 2600, fn: function(){ stamp('WAVE 03/03 · CUTOVER IN SEQUENCE'); setState(7, 'cut'); }},
    {t: 3000, fn: function(){ setState(8, 'cut'); }},
    {t: 3400, fn: function(){
      setState(9, 'fault');
      stamp('SITE 09 · FAULT');
      say('Simulated replay: site 09 fault. Crew rerouting.');
    }},
    /* 3400–4500: fault hold. 4500–5100: THE HONEST GAP — no events. */
    {t: GAP_T0, fn: function(){
      gap.classList.add('on');
      stamp('CREW REROUTING · DETECTION TAKES TIME');
    }},
    {t: GAP_T1, fn: function(){
      stage.setAttribute('data-arc', '1');
      stage.setAttribute('data-crew', '1');
      setState(9, 'held');
      stamp('REROUTED AROUND SITE 09 · WAVE 03 RE-SEQUENCED');
    }},
    {t: 5400, fn: function(){ setState(10, 'cut'); }},
    {t: 5800, fn: function(){ setState(11, 'cut'); }},
    {t: 6200, fn: function(){ setState(12, 'cut'); }},
    {t: 6600, fn: function(){ stamp('REROUTED · 11/12 CUT'); }},
    {t: 7500, fn: function(){ setState(9, 'retry'); stamp('SITE 09 · RETRY'); }},
    {t: 8300, fn: function(){
      setState(9, 'cut'); hist9(true);
      gap.classList.remove('on');
      stamp('12/12 · NONE LEFT BEHIND');
      say('Simulated replay: site 09 restored. 12 of 12 sites cut over.');
    }},
    {t: 8800, fn: function(){ armReplay(); }}
  ];

  /* startFrame: rewind all 16 nodes to the armed state. */
  function startFrame(){
    for (var n = 1; n <= 12; n++) setState(n, 'queued');
    hist9(false);
    stage.removeAttribute('data-arc');
    stage.removeAttribute('data-crew');
    gap.classList.remove('on');
    stamp('BOARD ARMED · 12 SITES QUEUED');
    if (playBtn){ playBtn.hidden = false; playBtn.disabled = false; playBtn.textContent = '▶ PLAY'; }
  }
  /* endFrame: the composed end state (also the no-JS / reduced-motion frame). */
  function endFrame(){
    for (var n = 1; n <= 12; n++) setState(n, 'cut');
    hist9(true);
    stage.setAttribute('data-arc', '1');
    stage.setAttribute('data-crew', '1');
    gap.classList.remove('on');
    stamp('12/12 · NONE LEFT BEHIND');
  }
  function armReplay(){
    if (!playBtn) return;
    playBtn.hidden = false; playBtn.disabled = false; playBtn.textContent = '↻ REPLAY';
  }

  var ctl = M.film({dur: DUR, events: EV, onDone: function(){
    begun = false; /* re-arm: the visible REPLAY control must start a second run */
    endFrame();
    armReplay();
  }});
  var begun = false;
  function begin(){
    if (begun || ctl.isPlaying()) return;
    begun = true;
    ctl.cancel();
    startFrame();
    if (playBtn){ playBtn.disabled = true; playBtn.textContent = 'PLAYING'; }
    ctl.play();
  }
  function reset(){
    ctl.cancel();
    begun = false;
    startFrame();
  }

  /* Offscreen pause: the shared clock shifts, the choreography survives. */
  var autoPaused = false;
  M.watchOffscreen(stage,
    function(){ if (ctl.isPlaying()){ ctl.pause(); autoPaused = true; } },
    function(){ if (autoPaused){ autoPaused = false; ctl.resume(); } });

  if (playBtn) playBtn.addEventListener('click', begin);

  if (M.reduced){
    endFrame();
    if (playBtn) playBtn.hidden = true;
    return;
  }
  if (M.constrained() || !('IntersectionObserver' in window)){
    /* Skip autoplay: the end frame IS the fallback; the replay control
       is visible and the user can press play. */
    endFrame();
    armReplay();
    return;
  }
  reset();
  M.onceVisible(stage, begin, 0.35);
})();
