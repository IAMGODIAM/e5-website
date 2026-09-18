#!/usr/bin/env node
/*
 * sync-zenodo.mjs — build-time sync of E5 Research paper pages with live
 * Zenodo record metadata.
 *
 * READ-ONLY by design: it performs unauthenticated GETs against the public
 * Zenodo API and never modifies any record, draft, or deposit. Only records
 * listed in zenodo-sources.json (public records only) are touched.
 *
 * What it updates on each paper page (elements carrying data-zsync markers):
 *   version, published date, DOI links, download URL, license label, citation.
 * Editorial copy — abstracts, findings quotes, version-history notes — is
 * never rewritten.
 *
 * Idempotent: files are only written when content actually changes, so a
 * scheduled run can use `git status` to detect a new Zenodo version.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const SOURCES = JSON.parse(readFileSync(join(HERE, 'zenodo-sources.json'), 'utf8'));
const DATA_DIR = join(ROOT, 'public', 'research', 'data');
const DATA_FILE = join(DATA_DIR, 'zenodo.json');

const LICENSE_LABELS = {
  'cc-zero': 'CC0 1.0',
  'cc-by': 'CC BY 4.0',
  'cc-by-4.0': 'CC BY 4.0',
  'cc-by-sa': 'CC BY-SA 4.0',
  'cc-by-sa-4.0': 'CC BY-SA 4.0',
  'cc-by-nc-4.0': 'CC BY-NC 4.0',
  'mit': 'MIT',
  'apache-2.0': 'Apache 2.0',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
function fmtMonth(iso) {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  const u = ['B', 'KB', 'MB', 'GB'];
  let n = bytes, i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n >= 100 ? Math.round(n) : n.toFixed(1)} ${u[i]}`;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function fetchLatest(conceptId) {
  // The concept record redirects to the latest published version record.
  const res = await fetch(`https://zenodo.org/api/records/${conceptId}`, {
    redirect: 'follow',
    headers: { Accept: 'application/json', 'User-Agent': 'E5-Research-Sync/1.0' },
  });
  if (!res.ok) throw new Error(`Zenodo API responded ${res.status} for concept ${conceptId}`);
  return res.json();
}

function extract(rec) {
  const m = rec.metadata || {};
  const doi = rec.doi || m.doi || '';
  const conceptDoi = rec.conceptdoi || '';
  const published = m.publication_date || '';
  const licId = (m.license && m.license.id) || '';
  const files = (rec.files || []).map(f => ({
    name: f.key, size: f.size, size_display: fmtSize(f.size),
  }));
  return {
    concept_id: rec.conceptrecid,
    record_id: rec.id,
    version: String(m.version || ''),
    doi,
    doi_url: doi ? `https://doi.org/${doi}` : '',
    concept_doi: conceptDoi,
    concept_doi_url: conceptDoi ? `https://doi.org/${conceptDoi}` : '',
    record_url: rec.links && rec.links.self_html ? rec.links.self_html : '',
    published,
    published_display: published ? fmtDate(published) : '',
    published_month: published ? fmtMonth(published) : '',
    year: published ? published.slice(0, 4) : '',
    license_id: licId,
    license_label: LICENSE_LABELS[licId] || licId,
    files,
  };
}

function buildCitation(data, cite) {
  // cite: {author, title, no}
  return `${esc(cite.author)}. \u201c${esc(cite.title)}.\u201d <i>E5 Research Paper No. ${esc(cite.no)}.</i> E5 Enclave Inc., ${esc(data.year)}. Zenodo. ${esc(data.doi_url)}. ${esc(data.license_label)}.`;
}

function patchPage(html, data) {
  let out = html;
  const sub = (re, fn) => { out = out.replace(re, fn); };
  // Text spans
  sub(/<span data-zsync="version">[^<]*<\/span>/g, () => `<span data-zsync="version">${esc(data.version)}</span>`);
  sub(/<span data-zsync="published">[^<]*<\/span>/g, () => `<span data-zsync="published">${esc(data.published_display)}</span>`);
  sub(/<span data-zsync="published-month">[^<]*<\/span>/g, () => `<span data-zsync="published-month">${esc(data.published_month)}</span>`);
  sub(/<span data-zsync="doi">[^<]*<\/span>/g, () => `<span data-zsync="doi">doi:${esc(data.doi)}</span>`);
  sub(/<span data-zsync="license">[^<]*<\/span>/g, () => `<span data-zsync="license">${esc(data.license_label)}</span>`);
  // DOI links (href + label)
  sub(/<a data-zsync="doi-link" href="[^"]*">[^<]*<\/a>/g,
    () => `<a data-zsync="doi-link" href="${esc(data.doi_url)}">doi:${esc(data.doi)}</a>`);
  sub(/<a data-zsync="concept-doi-link" href="[^"]*">[^<]*<\/a>/g,
    () => `<a data-zsync="concept-doi-link" href="${esc(data.concept_doi_url)}">doi:${esc(data.concept_doi)}</a>`);
  // Download button: point at the concept DOI so it always resolves to latest
  sub(/(<a data-zsync="download" href=")[^"]*(")/g, () => `$1${esc(data.concept_doi_url)}$2`);
  // Citation paragraph (authored bits come from data-cite-* attributes)
  sub(/<p data-zsync="citation" data-cite-author="([^"]*)" data-cite-title="([^"]*)" data-cite-no="([^"]*)">[\s\S]*?<\/p>/g,
    (mm, author, title, no) => `<p data-zsync="citation" data-cite-author="${author}" data-cite-title="${title}" data-cite-no="${no}">${buildCitation(data, { author, title, no })}</p>`);
  return out;
}

function writeIfChanged(path, content) {
  let prev = null;
  try { prev = readFileSync(path, 'utf8'); } catch { /* new file */ }
  if (prev === content) return false;
  writeFileSync(path, content);
  return true;
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });
  let prevData = {};
  try { prevData = JSON.parse(readFileSync(DATA_FILE, 'utf8')); } catch { /* first run */ }

  const nextData = { ...prevData };
  const failures = [];

  for (const [slug, src] of Object.entries(SOURCES.papers || {})) {
    try {
      const rec = await fetchLatest(src.concept_id);
      const entry = extract(rec);
      const prevEntry = prevData[slug] || {};
      const { synced_at: _prev, ...prevRest } = prevEntry;
      if (JSON.stringify(prevRest) === JSON.stringify(entry)) {
        nextData[slug] = prevEntry; // unchanged: keep the original sync stamp
        console.log(`ok  ${slug}: v${entry.version} (record ${entry.record_id}) — no change`);
      } else {
        nextData[slug] = { ...entry, synced_at: new Date().toISOString() };
        console.log(`ok  ${slug}: v${nextData[slug].version} (record ${nextData[slug].record_id}) — UPDATED`);
      }
    } catch (err) {
      failures.push(slug);
      console.error(`warn ${slug}: ${err.message} — keeping previous data`);
    }
  }

  let changed = writeIfChanged(DATA_FILE, JSON.stringify(nextData, null, 2) + '\n');
  if (changed) console.log('wrote public/research/data/zenodo.json');

  const pages = new Set([SOURCES.index_page, ...Object.values(SOURCES.papers || {}).map(s => s.page)]);
  for (const page of pages) {
    const path = join(ROOT, page);
    let html;
    try { html = readFileSync(path, 'utf8'); } catch { console.error(`warn: page not found: ${page}`); continue; }
    let patched = html;
    for (const [slug, src] of Object.entries(SOURCES.papers || {})) {
      if (!nextData[slug] || failures.includes(slug)) continue;
      if (page === src.page) {
        patched = patchPage(patched, nextData[slug]);
      } else if (page === SOURCES.index_page) {
        // Index rows are scoped: markers live inside [data-zsync-paper="slug"].
        const scopeRe = new RegExp(`(<[^>]*data-zsync-paper="${slug}"[^>]*>)([\\s\\S]*?)(</a>)`, 'g');
        patched = patched.replace(scopeRe, (mm, open, inner, close) => open + patchPage(inner, nextData[slug]) + close);
      }
    }
    if (writeIfChanged(path, patched)) { console.log(`patched ${page}`); changed = true; }
  }

  if (failures.length === Object.keys(SOURCES.papers || {}).length) {
    console.error('error: all Zenodo fetches failed');
    process.exit(1);
  }
  console.log(changed ? 'CHANGED' : 'NO CHANGE');
}

main();
