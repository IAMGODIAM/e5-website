(() => {
  const API = 'https://vault.e5enclave.com/entities/Chapter?limit=200&sort=galaxy,title';
  const PUBLISHED = {
    "The Keeper's Commission": '/books/genesis/the-keepers-commission/'
  };
  const root = document.getElementById('vault-gallery');

  const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeGradient = value => /^linear-gradient\([^;{}]+\)$/i.test(value || '') ? value : '#0f1c3d';
  const niceDate = value => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
  };
  const statusLabel = status => ({drafting:'Drafting',in_review:'In Review',dispatched:'Dispatched'}[status] || status || 'Drafting');
  const statusClass = status => status === 'drafting' ? 'draft' : 'published';

  function card(chapter) {
    const route = PUBLISHED[chapter.title];
    const cover = `<div class="book-card-cover" style="background:${safeGradient(chapter.cover_gradient)}"><div class="cover-title">${esc(chapter.title)}</div></div>`;
    const body = `<div class="book-card-body">
      <div class="galaxy">${esc(chapter.galaxy || 'Unfiled')}</div>
      <div class="title">${esc(chapter.title)}</div>
      <div class="subtitle">${esc(chapter.subtitle || (chapter.content || '').slice(0, 140) || 'Awaiting manuscript.')}</div>
      <div class="meta"><span class="status ${statusClass(chapter.status)}">${esc(statusLabel(chapter.status))}</span><span>${esc(niceDate(chapter.updated_date))}</span></div>
      ${route ? `<div class="link">Read the chapter →</div>` : `<div style="margin-top:1rem;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:.75rem;color:#8b7e65">${chapter.content ? 'In the sovereign vault' : 'Awaiting manuscript'}</div>`}
    </div>`;
    return route ? `<a href="${route}" class="book-card" style="display:block">${cover}${body}</a>` : `<article class="book-card">${cover}${body}</article>`;
  }

  function render(chapters) {
    const groups = new Map();
    chapters.filter(ch => ch.title && ch.title !== '__perm_probe__').forEach(ch => {
      const galaxy = ch.galaxy || 'Unfiled';
      if (!groups.has(galaxy)) groups.set(galaxy, []);
      groups.get(galaxy).push(ch);
    });
    root.innerHTML = [...groups.entries()].map(([galaxy, items]) => `<div class="gallery-section">
      <div class="gallery-section-head"><h3>${esc(galaxy)}</h3><span class="count">${items.length} chapter${items.length === 1 ? '' : 's'}</span></div>
      <div class="grid">${items.map(card).join('')}</div>
    </div>`).join('') + `<div class="empty-state" style="grid-column:1/-1;margin-top:2rem">
      <div class="key">Sovereign vault online.</div>
      <p style="margin:0 0 .5rem">Live from <a href="https://vault.e5enclave.com/entities/Chapter?limit=200" target="_blank" rel="noopener noreferrer">vault.e5enclave.com</a> — Cloudflare D1, no Base44.</p>
      <p style="margin:0;font-size:.875rem">Published chapters link to their DC-register pages. Other chapters remain visible through drafting and review.</p>
    </div>`;
  }

  fetch(API, {headers:{Accept:'application/json'}})
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(render)
    .catch(err => { root.innerHTML = `<div class="empty-state"><div class="key">Vault temporarily unavailable.</div><p>${esc(err.message)}</p></div>`; });
})();
