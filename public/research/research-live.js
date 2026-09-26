/* research-live.js — progressive enhancement for E5 Research paper pages.
 *
 * If the visitor's browser can reach the Zenodo API, this refreshes the
 * Zenodo-synced fields (version, DOI, published date, license, citation)
 * live, so a newly published Zenodo version is reflected immediately —
 * even before the next scheduled site sync. Fails silently: the
 * server-rendered values always remain as the fallback.
 */
(function () {
  'use strict';
  // Each host carries its own concept ID: the paper page's <main>, or an
  // individual row on the research index.
  var hosts = document.querySelectorAll('[data-zenodo-concept]');
  if (!hosts.length) return;

  var LICENSE_LABELS = {
    'cc-zero': 'CC0 1.0', 'cc-by': 'CC BY 4.0', 'cc-by-4.0': 'CC BY 4.0',
    'cc-by-sa': 'CC BY-SA 4.0', 'cc-by-sa-4.0': 'CC BY-SA 4.0',
    'cc-by-nc-4.0': 'CC BY-NC 4.0', 'mit': 'MIT', 'apache-2.0': 'Apache 2.0'
  };
  var MONTHS = ['January','February','March','April','May','June','July',
                'August','September','October','November','December'];
  function fmtDate(iso) {
    var p = iso.split('-');
    return MONTHS[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
  }
  function fmtMonth(iso) {
    var p = iso.split('-');
    return MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function setText(scope, key, value) {
    var els = scope.querySelectorAll('[data-zsync="' + key + '"]');
    for (var i = 0; i < els.length; i++) {
      if (els[i].tagName !== 'A') els[i].textContent = value;
    }
  }

  function refresh(host) {
    var conceptId = host.getAttribute('data-zenodo-concept');
    fetch('https://zenodo.org/api/records/' + encodeURIComponent(conceptId), {
      headers: { 'Accept': 'application/json' }
    })
    .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(function (d) {
      var m = d.metadata || {};
      var version = String(m.version || '');
      var doi = d.doi || m.doi || '';
      var conceptDoi = d.conceptdoi || '';
      var published = m.publication_date || '';
      var licId = (m.license && m.license.id) || '';
      var licenseLabel = LICENSE_LABELS[licId] || licId;
      var doiUrl = doi ? 'https://doi.org/' + doi : '';
      var conceptDoiUrl = conceptDoi ? 'https://doi.org/' + conceptDoi : '';

      // Nothing to do if the page already shows this version.
      var cur = host.querySelector('[data-zsync="version"]');
      if (cur && cur.textContent.trim() === version) return;

      setText(host, 'version', version);
      setText(host, 'published', published ? fmtDate(published) : '');
      setText(host, 'published-month', published ? fmtMonth(published) : '');
      setText(host, 'doi', doi ? 'doi:' + doi : '');
      setText(host, 'license', licenseLabel);
      var links = host.querySelectorAll('a[data-zsync="doi-link"]');
      for (var i = 0; i < links.length; i++) {
        links[i].href = doiUrl;
        links[i].textContent = 'doi:' + doi;
      }
      var clinks = host.querySelectorAll('a[data-zsync="concept-doi-link"]');
      for (var j = 0; j < clinks.length; j++) {
        clinks[j].href = conceptDoiUrl;
        clinks[j].textContent = 'doi:' + conceptDoi;
      }
      var dls = host.querySelectorAll('a[data-zsync="download"]');
      for (var k = 0; k < dls.length; k++) dls[k].href = conceptDoiUrl;
      var cites = host.querySelectorAll('[data-zsync="citation"]');
      for (var c = 0; c < cites.length; c++) {
        var el = cites[c];
        var author = el.getAttribute('data-cite-author') || '';
        var title = el.getAttribute('data-cite-title') || '';
        var no = el.getAttribute('data-cite-no') || '';
        el.innerHTML = '';
        el.appendChild(document.createTextNode(author + '. \u201c' + title + '.\u201d '));
        var em = document.createElement('i');
        em.textContent = 'E5 Research Paper No. ' + no + '.';
        el.appendChild(em);
        el.appendChild(document.createTextNode(' E5 Enclave Inc., ' + published.slice(0, 4) +
          '. Zenodo. ' + doiUrl + '. ' + licenseLabel + '.'));
      }
    })
    .catch(function () { /* keep the server-rendered values */ });
  }

  for (var h = 0; h < hosts.length; h++) refresh(hosts[h]);
})();
