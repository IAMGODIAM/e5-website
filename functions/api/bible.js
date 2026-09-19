// Cloudflare Pages Function: same-origin Bible API backed ENTIRELY by E5-owned
// infrastructure. The legacy third-party proxy is gone — no external
// function-platform URL is referenced or called here.
//
// Primary path: the kingdom-journal worker (/bible/*), authenticated with the
// KINGDOM_TOKEN Pages secret (same value as that worker's KINGDOM_TOKEN secret).
// Fallback path (secret not configured): public-domain KJV/YLT text served
// straight from our own R2 bucket. AMP translation needs the worker path
// (it proxies bolls.life upstream, edge-cached 30d).
const WORKER = 'https://kingdom-journal.yisraelleemccartney.workers.dev';
const R2 = 'https://pub-0ec5a232d3d04885a72057990302c8fe.r2.dev';

const ACTIONS = new Set(['books', 'chapter']);
const TRANSLATIONS = new Set(['KJV', 'YLT', 'AMP']);

const bad = (msg, status = 400) =>
  Response.json({ ok: false, error: msg }, { status });

async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'e5-website-bible' } });
  if (!r.ok) throw new Error('upstream ' + r.status);
  return r.json();
}

export async function onRequestPost(context) {
  const token = context.env.KINGDOM_TOKEN || '';
  const body = await context.request.json().catch(() => ({}));

  const action = String(body.action || '');
  if (!ACTIONS.has(action)) return bad('unknown action');
  const tr = String(body.translation || 'KJV').toUpperCase();
  if (!TRANSLATIONS.has(tr)) return bad('unknown translation');

  try {
    // ---- Primary: owned worker (all translations, incl. AMP) ----
    if (token) {
      const k = `k=${encodeURIComponent(token)}`;
      if (action === 'books') {
        const d = await getJson(`${WORKER}/bible/books?${k}`);
        if (!d || !Array.isArray(d.books)) throw new Error('bad worker books');
        return Response.json({ books: d.books });
      }
      const book = Number(body.book), ch = Number(body.chapter);
      if (!(book >= 1 && book <= 66 && ch >= 1)) return bad('bad reference');
      const d = await getJson(
        `${WORKER}/bible/chapter?tr=${tr}&book=${book}&ch=${ch}&${k}`
      );
      if (!d || !Array.isArray(d.verses)) throw new Error('bad worker chapter');
      return Response.json({ verses: d.verses });
    }

    // ---- Fallback: owned R2, no secret needed (KJV/YLT only) ----
    if (action === 'books') {
      const d = await getJson(`${R2}/bible/books.json`);
      if (!d || !Array.isArray(d.books)) throw new Error('bad r2 books');
      return Response.json({ books: d.books });
    }
    if (tr === 'AMP') {
      return Response.json(
        { ok: false, error: 'AMP needs the worker path (KINGDOM_TOKEN not set)' },
        { status: 502 }
      );
    }
    const book = Number(body.book), ch = Number(body.chapter);
    if (!(book >= 1 && book <= 66 && ch >= 1)) return bad('bad reference');
    const d = await getJson(`${R2}/bible/${tr.toLowerCase()}/${book}.json`);
    const chap = d && Array.isArray(d.chapters) ? d.chapters[ch - 1] : null;
    if (!chap) return bad('chapter not found', 404);
    return Response.json({
      verses: chap.map((v) => ({
        verse: v.v,
        text: v.t,
        strong: v.s || [],
        w: v.w || [],
      })),
    });
  } catch (e) {
    return Response.json({ ok: false, error: 'bible unavailable' }, { status: 502 });
  }
}

export function onRequest(context) {
  return onRequestPost(context);
}
