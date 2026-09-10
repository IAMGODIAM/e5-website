// Cloudflare Pages Function: same-origin proxy for the base44 transitsToday function.
// The shared secret lives ONLY in the Pages environment (TRANSITS_TODAY_SECRET);
// it is never embedded in client code or the browser bundle.
const UPSTREAM = 'https://sue-app-e73f9f1e.base44.app/api/apps/69d7dd5e015cd1aa45c3e283/functions/transitsToday';

export async function onRequestPost(context) {
  const secret = context.env.TRANSITS_TODAY_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: 'server misconfigured' }, { status: 500 });
  }
  const upstream = await fetch(UPSTREAM, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret }),
  });
  const data = await upstream.json().catch(() => null);
  return Response.json(data ?? { ok: false }, { status: upstream.status });
}

export function onRequest(context) {
  return onRequestPost(context);
}
