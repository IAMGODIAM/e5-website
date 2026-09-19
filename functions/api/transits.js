// Cloudflare Pages Function: same-origin "today's sky" API backed ENTIRELY by
// E5-owned infrastructure. The legacy third-party proxy is gone — no external
// function-platform URL is referenced or called here.
//
// Source: the kingdom-journal worker's /cosmos/sky route, which computes
// planetary positions from our own D1 cosmos_ephem table. Authenticated with
// the KINGDOM_TOKEN Pages secret (same value as that worker's KINGDOM_TOKEN).
const WORKER = 'https://kingdom-journal.yisraelleemccartney.workers.dev';

export async function onRequestPost(context) {
  const token = context.env.KINGDOM_TOKEN || '';
  if (!token) {
    return Response.json({ ok: false, error: 'server misconfigured' }, { status: 500 });
  }
  try {
    const r = await fetch(
      `${WORKER}/cosmos/sky?k=${encodeURIComponent(token)}`,
      { headers: { 'User-Agent': 'e5-website-transits' } }
    );
    if (!r.ok) throw new Error('worker ' + r.status);
    const d = await r.json();
    if (!d || !Array.isArray(d.planets)) throw new Error('bad worker sky');
    // Map worker shape -> the shape the client renders.
    return Response.json({
      ok: true,
      date: d.date,
      planets: d.planets.map((p) => ({
        planet: p.planet,
        sign: p.sign,
        glyph: p.glyph,
        glyphSign: p.signGlyph,
        deg: p.deg,
        note: p.note,
      })),
    });
  } catch (e) {
    return Response.json({ ok: false, error: 'sky unavailable' }, { status: 502 });
  }
}

export function onRequest(context) {
  return onRequestPost(context);
}
