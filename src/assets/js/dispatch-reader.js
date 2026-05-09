// Dispatch reader behaviors: TOC progress, citation tabs, copy + print.

(function () {
  // Progress thread on the apparatus rail
  var thread = document.querySelector('.vc-disp-rail .progress .thread');
  var body = document.querySelector('.vc-disp-body');
  if (thread && body) {
    function updateProgress() {
      var rect = body.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var seen = Math.max(0, -rect.top);
      var pct = Math.max(0, Math.min(100, (seen / Math.max(1, total)) * 100));
      thread.style.width = pct + '%';
    }
    document.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // Citation tab switching
  var citation = document.querySelector('.js-citation');
  if (citation) {
    var tabs = citation.querySelectorAll('.tabs button');
    var panes = citation.querySelectorAll('pre[data-fmt]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var fmt = tab.getAttribute('data-fmt');
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        panes.forEach(function (p) {
          var match = p.getAttribute('data-fmt') === fmt;
          p.hidden = !match;
        });
      });
    });
  }

  // Copy citation to clipboard
  var copyBtn = document.querySelector('.js-copy-cite');
  if (copyBtn && citation) {
    copyBtn.addEventListener('click', function () {
      var visible = citation.querySelector('pre:not([hidden])');
      if (!visible) return;
      var text = visible.textContent.trim();
      var cb = navigator.clipboard;
      var done = function () {
        copyBtn.classList.add('copied');
        copyBtn.textContent = 'Copied';
        setTimeout(function () {
          copyBtn.classList.remove('copied');
          copyBtn.textContent = 'Copy citation';
        }, 1500);
      };
      if (cb && cb.writeText) cb.writeText(text).then(done, done);
      else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (_) {} document.body.removeChild(ta); done(); }
    });
  }

  // Cite button (rail) — scroll to citation block
  var citeBtn = document.querySelector('.js-cite-btn');
  if (citeBtn) {
    citeBtn.addEventListener('click', function () {
      var el = document.querySelector('.vc-disp-citation');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Print button (rail)
  var printBtn = document.querySelector('.js-print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', function () { window.print(); });
  }
})();
