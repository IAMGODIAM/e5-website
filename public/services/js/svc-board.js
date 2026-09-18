(function(){
  var cv = document.getElementById('sv-board-cv');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = (navigator.connection || {});
  var constrained = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || conn.saveData === true;
  var playBtn = document.getElementById('sv-board-play');
  var tick = document.getElementById('sv-board-tick');
  var W = 1200, H = 560, ROW_Y = 104, ROW_H = 35;
  var N = 12;
  var C = {gold:'201,162,74', pale:'233,211,160', green:'127,201,143', amber:'217,164,65',
           red:'217,106,91', dim:'107,114,132', mut:'154,161,180'};

  var REPLAY = {
    replay_id: 'rollout-board-v1', version: 1,
    description: 'Frozen simulated replay dataset for the rollout-board centerpiece. ' +
      'Every value is illustrative and invented for the visualization — no measured telemetry. ' +
      "Choreography is frozen; 'replayed' is literally true.",
    watermark: 'SIMULATED · DESIGNED BEHAVIOR',
    events: [
      {t:0,    type:'wave', wave:1, of:4},
      {t:600,  site:1, state:'cut'}, {t:1100, site:2, state:'cut'}, {t:1600, site:3, state:'cut'},
      {t:2300, type:'wave', wave:2, of:4},
      {t:2900, site:4, state:'cut'}, {t:3400, site:5, state:'cut'}, {t:3900, site:6, state:'cut'},
      {t:4600, type:'wave', wave:3, of:4},
      {t:5200, site:7, state:'cut'}, {t:5700, site:8, state:'cut'},
      {t:6400, site:9, state:'failed', note:'WAVE 03/04 · SITE 09 FAILED'},
      {t:6400, type:'gap', ms:600, note:'CREW REROUTING · HELD 600MS'},
      {t:7000, site:9, state:'held', note:'WAVE RE-SEQUENCED AROUND SITE 09'},
      {t:7600, type:'wave', wave:4, of:4},
      {t:8200, site:10, state:'cut'}, {t:8700, site:11, state:'cut'}, {t:9200, site:12, state:'cut'},
      {t:10000, site:9, state:'cut', note:'SITE 09 RETRY — CUT'},
      {t:10800, type:'done', note:'12/12 CUT OVER · NONE LEFT BEHIND'}
    ]
  };

  var states = {}, wave = 0, waveOf = 4, stamp = 'BOARD ARMED · 12 SITES QUEUED', stampFlash = 0,
      playing = false, startT = 0, evIdx = 0, raf = 0, donePlayed = false;
  for (var s = 1; s <= N; s++) states[s] = 'queued';

  function dprSetup(){
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(0);
  }
  function lampColor(st, tt){
    if (st === 'cut') return 'rgba(' + C.green + ',.95)';
    if (st === 'failed') return 'rgba(' + C.red + ',.95)';
    if (st === 'held') return 'rgba(' + C.amber + ',.95)';
    if (st === 'cutting') return 'rgba(' + C.amber + ',' + (0.5 + 0.5 * Math.sin(tt / 160)).toFixed(2) + ')';
    return 'rgba(' + C.dim + ',.4)';
  }
  function statusText(st){
    return {queued:'QUEUED', cutting:'CUTTING…', cut:'CUT', failed:'FAILED', held:'HELD — REROUTED'}[st] || st;
  }
  function draw(tt){
    ctx.clearRect(0, 0, W, H);

    ctx.font = '600 21px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(' + C.pale + ',.92)';
    ctx.fillText('ROLLOUT BOARD', 48, 52);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(' + C.gold + ',.9)';
    ctx.fillText(wave ? ('WAVE ' + String(wave).padStart(2,'0') + '/' + String(waveOf).padStart(2,'0')) : 'WAVE —/04', 1152, 52);
    ctx.strokeStyle = 'rgba(201,162,74,.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(48, 70); ctx.lineTo(1152, 70); ctx.stroke();

    var cut = 0;
    for (var i = 1; i <= N; i++){
      var st = states[i], y = ROW_Y + (i - 1) * ROW_H;
      if (st === 'cut') cut++;
      ctx.strokeStyle = 'rgba(201,162,74,.10)';
      ctx.beginPath(); ctx.moveTo(48, y + ROW_H - 6); ctx.lineTo(1152, y + ROW_H - 6); ctx.stroke();

      ctx.beginPath(); ctx.arc(84, y + 10, 9, 0, 6.2832);
      ctx.fillStyle = lampColor(st, tt); ctx.fill();
      if (st === 'cut'){ ctx.strokeStyle = 'rgba(' + C.green + ',.9)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(84, y + 10, 13, 0, 6.2832); ctx.stroke(); }

      ctx.font = '20px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
      ctx.fillStyle = st === 'queued' ? 'rgba(' + C.mut + ',.55)' : 'rgba(237,239,244,.92)';
      ctx.fillText('SITE ' + (i < 10 ? '0' : '') + i, 116, y + 17);
      ctx.textAlign = 'right';
      var col = st === 'cut' ? C.green : st === 'failed' ? C.red : st === 'held' ? C.amber : C.dim;
      ctx.fillStyle = 'rgba(' + col + ',' + (st === 'queued' ? '.55' : '.95') + ')';
      ctx.fillText(statusText(st), 1152, y + 17);
    }

    ctx.textAlign = 'left'; ctx.font = '20px "IBM Plex Mono", monospace';
    var sa = stampFlash > 0 ? 1 : 0.85;
    ctx.fillStyle = 'rgba(' + C.amber + ',' + sa.toFixed(2) + ')';
    ctx.fillText(stamp, 48, H - 56);
    ctx.fillStyle = 'rgba(' + C.mut + ',.6)';
    ctx.font = '18px "IBM Plex Mono", monospace';
    ctx.fillText(cut + '/12 CUT OVER', 48, H - 26);

    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(' + C.amber + ',.75)';
    ctx.font = '17px "IBM Plex Mono", monospace';
    ctx.fillText(REPLAY.watermark, 1152, H - 26);
    if (tick) tick.textContent = stamp;
  }
  function narrate(msg){ if (tick) tick.textContent = msg; }
  function applyEvent(e){
    if (e.type === 'wave'){ wave = e.wave; waveOf = e.of || 4; stamp = 'WAVE ' + String(wave).padStart(2,'0') + '/' + String(waveOf).padStart(2,'0') + ' · CUTOVER IN SEQUENCE'; narrate(stamp); }
    else if (e.type === 'gap'){ stamp = e.note; stampFlash = 3; narrate('Honest gap: the crew reroutes. ' + e.note); }
    else if (e.type === 'done'){ stamp = e.note; narrate(e.note + '. Simulated replay complete.'); finish(); }
    else if (e.site){ states[e.site] = e.state; stamp = e.note || ('SITE ' + String(e.site).padStart(2,'0') + ' ' + statusText(e.state)); narrate(stamp); }
  }
  function step(){
    var el = performance.now() - startT;
    while (evIdx < REPLAY.events.length && REPLAY.events[evIdx].t <= el){ applyEvent(REPLAY.events[evIdx]); evIdx++; }
    if (stampFlash > 0) stampFlash -= 1 / 60;
    draw(el);
    if (evIdx < REPLAY.events.length){ raf = requestAnimationFrame(step); }
    else { playing = false; }
  }
  function reset(){
    for (var s = 1; s <= N; s++) states[s] = 'queued';
    wave = 0; stamp = 'BOARD ARMED · 12 SITES QUEUED'; evIdx = 0; donePlayed = false;
    playBtn.textContent = '▶ PLAY'; playBtn.hidden = false;
  }
  function play(){
    reset(); playing = true; startT = performance.now(); playBtn.hidden = true;
    raf = requestAnimationFrame(step);
  }
  function finish(){
    playing = false; donePlayed = true;
    playBtn.textContent = '↻ REPLAY'; playBtn.hidden = false;
  }
  if (playBtn) playBtn.addEventListener('click', play);

  dprSetup();
  window.addEventListener('resize', dprSetup);
  if (reduced || constrained){
    for (var s2 = 1; s2 <= N; s2++) states[s2] = 'cut';
    wave = 4; stamp = '12/12 CUT OVER · NONE LEFT BEHIND';
    draw(0);
    if (playBtn) playBtn.hidden = reduced;
  } else if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(en){
      if (en[0].isIntersecting && !playing && !donePlayed){ play(); io.disconnect(); }
    }, {threshold: 0.4});
    io.observe(cv);
  }
})();
