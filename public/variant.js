/* E5 A/B/C VARIANT BEHAVIOR — DAG warroom-website-overhaul-abc-2026-0619
   Alpha: no-op. Beta: supporter counter + sticky CTA + exit-intent. Charlie: scroll-reveal. */
(function(){
  var V = (window.__E5_VARIANT) || document.documentElement.getAttribute('data-variant') || 'alpha';
  function g(ev,p){ try{ if(typeof gtag==='function'){ p=p||{}; p.site_variant=V; gtag('event',ev,p); } }catch(e){} }
  g('variant_view', { page: location.pathname });

  if (V === 'beta') {
    // Sticky bottom CTA (whole-site)
    var bar = document.createElement('div'); bar.id='e5-sticky-cta';
    bar.innerHTML = '<span id="e5-proof">Loading supporters…</span>'
      + '<a href="/donate/" data-e5cta="donate">Stand With Us →</a>';
    document.body.appendChild(bar);
    bar.querySelector('a').addEventListener('click', function(){ g('cta_click',{location:'sticky_bar'}); });
    // Live supporter counter from the Karmelo feed (public count)
    fetch('https://sue-45c3e283.base44.app/functions/karmeloTimelineFeed?mode=count')
      .then(function(r){return r.json();}).then(function(d){
        var n = (d && (d.count||d.total)) || null;
        document.getElementById('e5-proof').textContent = n ? (n + ' standing on the record') : 'Add your name to the record';
      }).catch(function(){ document.getElementById('e5-proof').textContent='Add your name to the record'; });
    // Exit-intent (once per session)
    if(!sessionStorage.getItem('e5_exit')){
      document.addEventListener('mouseout', function(e){
        if(e.clientY<=0 && !sessionStorage.getItem('e5_exit')){
          sessionStorage.setItem('e5_exit','1'); g('exit_intent_shown');
        }
      });
    }
  }

  if (V === 'charlie') {
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
