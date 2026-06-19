/* E5 A/B/C VARIANT BEHAVIOR — DAG warroom-website-overhaul-abc-2026-0619
   Funnel war-room deepening (SOP 13 Nudge + SOP 14 conversion copy).
   Alpha: control (no-op). Beta "The Funnel": real social proof + single dominant nudge + exit-intent
   RECOVERY MODAL (was an empty event). Charlie "The Reckoning": kinetic moral banner + scroll-reveal. */
(function(){
  var V = (window.__E5_VARIANT) || document.documentElement.getAttribute('data-variant') || 'alpha';
  function g(ev,p){ try{ if(typeof gtag==='function'){ p=p||{}; p.site_variant=V; gtag('event',ev,p); } }catch(e){} }
  function conv(){ try{ if(typeof gtag==='function'){ gtag('event','conversion',{'send_to':'AW-16672489240/NY9oCP6noawcEJj-h44-'}); gtag('event','generate_lead',{event_label:'variant_'+V}); } }catch(e){} }
  g('variant_view', { page: location.pathname });

  var KARM = '/justice/karmelo-anthony/';

  if (V === 'beta') {
    var bar = document.createElement('div'); bar.id='e5-sticky-cta';
    bar.innerHTML = '<span id="e5-proof">Counting supporters…</span>'
      + '<a href="'+KARM+'" data-e5cta="add_name">Add your name to the record &rarr;</a>';
    document.body.appendChild(bar);
    bar.querySelector('a').addEventListener('click', function(){ g('cta_click',{location:'sticky_bar'}); });
    fetch('https://sue-45c3e283.base44.app/functions/karmeloTimelineFeed?mode=count')
      .then(function(r){return r.json();}).then(function(d){
        var n = (d && (d.count!=null ? d.count : d.total)) || null;
        document.getElementById('e5-proof').innerHTML = n
          ? ('<b>'+n+'</b> have stood on the record. Join them.')
          : 'Stand on the record with Karmelo.';
      }).catch(function(){ document.getElementById('e5-proof').textContent='Stand on the record with Karmelo.'; });

    function showExit(){
      if(sessionStorage.getItem('e5_exit')) return;
      sessionStorage.setItem('e5_exit','1'); g('exit_intent_shown');
      var ov = document.createElement('div'); ov.id='e5-exit-ov';
      ov.innerHTML =
        '<div id="e5-exit-card" role="dialog" aria-modal="true" aria-label="Before you go">'
        + '<button id="e5-exit-x" aria-label="Close">&times;</button>'
        + '<p class="e5-exit-eyebrow">Before you go</p>'
        + '<h3>One signature is on the record. Make it yours.</h3>'
        + '<p class="e5-exit-body">Karmelo Anthony has a 35-year sentence and an active appeal. The wall of names tells a court &mdash; and a country &mdash; that people are watching. It takes ten seconds.</p>'
        + '<a href="'+KARM+'" id="e5-exit-cta" data-e5cta="exit_modal">Add your name &rarr;</a>'
        + '<button id="e5-exit-dismiss">Not right now</button>'
        + '</div>';
      document.body.appendChild(ov);
      function close(){ ov.parentNode && ov.parentNode.removeChild(ov); }
      ov.addEventListener('click', function(e){ if(e.target===ov){ g('exit_dismiss'); close(); } });
      document.getElementById('e5-exit-x').addEventListener('click', function(){ g('exit_dismiss'); close(); });
      document.getElementById('e5-exit-dismiss').addEventListener('click', function(){ g('exit_dismiss'); close(); });
      document.getElementById('e5-exit-cta').addEventListener('click', function(){ g('cta_click',{location:'exit_modal'}); conv(); });
    }
    if(!sessionStorage.getItem('e5_exit')){
      document.addEventListener('mouseout', function(e){ if(e.clientY<=0) showExit(); });
      var lastY = window.scrollY, armed=false;
      setTimeout(function(){ armed=true; }, 12000);
      window.addEventListener('scroll', function(){
        var y=window.scrollY; if(armed && y<lastY-40 && y<200) showExit(); lastY=y;
      }, {passive:true});
    }
  }

  if (V === 'charlie') {
    var ban = document.createElement('div'); ban.id='e5-char-banner';
    ban.innerHTML = '<span class="e5-char-kick">THE RECKONING</span>'
      + '<span class="e5-char-line">Four years for one teen. Thirty-five for another. Same plea. One county line apart.</span>'
      + '<a href="'+KARM+'" data-e5cta="reckoning_banner">See the record &rarr;</a>';
    document.body.insertBefore(ban, document.body.firstChild);
    ban.querySelector('a').addEventListener('click', function(){ g('cta_click',{location:'reckoning_banner'}); });

    var els = document.querySelectorAll('section, .card, article, h2, [data-reveal]');
    els.forEach(function(el){ el.setAttribute('data-reveal',''); });
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(en){
        en.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target);} });
      }, {threshold:.12});
      els.forEach(function(el){ io.observe(el); });
    } else { els.forEach(function(el){ el.classList.add('in'); }); }
    g('charlie_engaged');
  }
})();
