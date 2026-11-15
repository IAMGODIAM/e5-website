// Cloudflare Pages Function: RingLatch free 10-call snapshot intake.
// Stores consented requests in Workers KV (SNAPSHOT_REQUESTS).
// Email Routing on e5enclave.com is unconfigured, so this path is KV only.

const TRADES = new Set(['HVAC', 'Plumbing', 'Dental', 'Other']);
const MAX = { name: 120, business_name: 120, phone: 30 };
const RATE_LIMIT = 8;
const RATE_WINDOW_SEC = 3600;

const corsHeaders = (origin) =>
  origin
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
    : {};

const json = (body, status, origin, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...corsHeaders(origin),
      ...extra,
    },
  });

function allowedOrigin(origin) {
  if (!origin) return '';
  try {
    const host = new URL(origin).hostname;
    if (
      host === 'e5enclave.com' ||
      host === 'www.e5enclave.com' ||
      host === 'e5-website-98u.pages.dev' ||
      host.endsWith('.e5-website-98u.pages.dev')
    ) {
      return origin;
    }
  } catch (_) {}
  return '';
}

function digits(s) {
  return String(s || '').replace(/\D/g, '');
}

function clean(s, max) {
  return String(s || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);
}

async function readBody(request) {
  const type = (request.headers.get('content-type') || '').toLowerCase();
  if (type.includes('application/json')) {
    const data = await request.json().catch(() => null);
    return data && typeof data === 'object' ? data : {};
  }
  if (
    type.includes('application/x-www-form-urlencoded') ||
    type.includes('multipart/form-data')
  ) {
    const fd = await request.formData();
    return Object.fromEntries(fd.entries());
  }
  return {};
}

function validate(body) {
  const name = clean(body.name, MAX.name);
  const business_name = clean(body.business_name, MAX.business_name);
  const phone = clean(body.phone, MAX.phone);
  const trade = String(body.trade || '').trim();
  const consentRaw = body.consent;
  const consent =
    consentRaw === true ||
    consentRaw === 'true' ||
    consentRaw === 'yes' ||
    consentRaw === 'on' ||
    consentRaw === '1';
  const honeypot = String(body.company_url || body.website || '').trim();

  if (honeypot) return { honeypot: true };

  if (!name) return { error: 'Please enter your name.' };
  if (!business_name) return { error: 'Please enter your business name.' };
  const n = digits(phone);
  if (!phone || n.length < 7 || n.length > 15) {
    return { error: 'Please enter a valid business phone number.' };
  }
  if (!TRADES.has(trade)) return { error: 'Please select a trade.' };
  if (!consent) {
    return { error: 'Please confirm your consent for the 10 test calls.' };
  }
  return { name, business_name, phone, trade, consent: true };
}

async function rateLimited(kv, ip) {
  if (!ip) return false;
  const key = `rl:${ip}`;
  const raw = await kv.get(key);
  const count = raw ? parseInt(raw, 10) || 0 : 0;
  if (count >= RATE_LIMIT) return true;
  await kv.put(key, String(count + 1), { expirationTtl: RATE_WINDOW_SEC });
  return false;
}

export async function onRequestOptions(context) {
  const origin = allowedOrigin(context.request.headers.get('Origin') || '');
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = allowedOrigin(request.headers.get('Origin') || '');
  const kv = env.SNAPSHOT_REQUESTS;
  if (!kv) return json({ ok: false, error: 'server misconfigured' }, 500, origin);

  let body;
  try {
    body = await readBody(request);
  } catch (_) {
    return json({ ok: false, error: 'Please check the form and try again.' }, 400, origin);
  }

  const result = validate(body);
  if (result.honeypot) return json({ ok: true }, 200, origin);
  if (result.error) return json({ ok: false, error: result.error }, 400, origin);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (await rateLimited(kv, ip)) {
    return json(
      { ok: false, error: 'Please wait a while before submitting again.' },
      429,
      origin,
    );
  }

  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const record = {
    id,
    created_at,
    name: result.name,
    business_name: result.business_name,
    phone: result.phone,
    trade: result.trade,
    consent: true,
    consent_text:
      'I consent to E5 Enclave placing 10 test calls to my business line, made by people, with no AI voice and no recording.',
  };
  await kv.put(`snapshot:${created_at}:${id}`, JSON.stringify(record));
  return json({ ok: true }, 200, origin);
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return onRequestOptions(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  const origin = allowedOrigin(context.request.headers.get('Origin') || '');
  return json({ ok: false, error: 'method not allowed' }, 405, origin, {
    Allow: 'POST, OPTIONS',
  });
}
