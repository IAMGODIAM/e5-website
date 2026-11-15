// Cloudflare Pages Function: RingLatch free 10-call snapshot intake.
// Stores consented requests in Workers KV (SNAPSHOT_REQUESTS).
// Email Routing on e5enclave.com is unconfigured, so this path is KV only.
// Turnstile is not used here: it would need a new site key and secret
// (a new infra key, which is a human gate). Proposed later, after approval.

const TRADES = new Set(['HVAC', 'Plumbing', 'Dental', 'Other']);
const ROLES = new Set(['Owner', 'Office or service manager', 'Other']);
const AFTER_HOURS = new Set([
  'Voicemail',
  'Answering service',
  'Forwarded to a cell',
  'Nothing, it rings out',
  'Not sure',
]);
const WEEKLY_CALLS = new Set(['Under 50', '50–150', '150–400', '400+', 'Not sure']);

const MAX = {
  name: 120,
  email: 160,
  business_name: 120,
  city: 120,
  phone: 40,
  hours: 400,
  do_not_call: 400,
  heard_about: 200,
};
const RATE_LIMIT = 8;
const RATE_WINDOW_SEC = 3600;
const MIN_SUBMIT_MS = 3000;
const MAX_SUBMIT_MS = 24 * 60 * 60 * 1000;

const CONSENT_TEXT =
  'I consent to E5 Enclave placing 10 test calls to my business line, made by people, with no AI voice and no recording.';
const AUTHORITY_TEXT =
  'I own this business or am authorized to approve these test calls.';

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

function usPhone(s) {
  let d = digits(s);
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  return d.length === 10 ? d : null;
}

function validEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

function clean(s, max) {
  return String(s || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);
}

function isChecked(raw) {
  return (
    raw === true ||
    raw === 'true' ||
    raw === 'yes' ||
    raw === 'on' ||
    raw === '1'
  );
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

function tooFast(body) {
  const raw = body.form_started;
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    // Allow a no-JS post; honeypot + rate limit still apply.
    return false;
  }
  const started = Number(raw);
  if (!Number.isFinite(started) || started <= 0) return true;
  const elapsed = Date.now() - started;
  if (elapsed < MIN_SUBMIT_MS || elapsed > MAX_SUBMIT_MS) return true;
  return false;
}

function validate(body) {
  const honeypot = String(body.company_url || body.website || '').trim();
  if (honeypot) return { honeypot: true };

  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email).toLowerCase();
  const role = String(body.role || '').trim();
  const business_name = clean(body.business_name, MAX.business_name);
  const trade = String(body.trade || '').trim();
  const city = clean(body.city, MAX.city);
  const phone_raw = clean(body.phone, MAX.phone);
  const hours = clean(body.hours, MAX.hours);
  const after_hours = String(body.after_hours || '').trim();
  const weekly_calls = String(body.weekly_calls || '').trim();
  const crews_raw = String(body.crews ?? '').trim();
  const do_not_call = clean(body.do_not_call, MAX.do_not_call);
  const heard_about = clean(body.heard_about, MAX.heard_about);
  const consent = isChecked(body.consent);
  const authorized = isChecked(body.authorized);

  if (!name) return { error: 'Please enter your name.', field: 'name' };
  if (!email || !validEmail(email)) {
    return { error: 'Please enter a valid email address.', field: 'email' };
  }
  if (!ROLES.has(role)) return { error: 'Please select your role.', field: 'role' };
  if (!business_name) {
    return { error: 'Please enter your business name.', field: 'business_name' };
  }
  if (!TRADES.has(trade)) return { error: 'Please select a trade.', field: 'trade' };
  if (!city) {
    return { error: 'Please enter your city or service area.', field: 'city' };
  }
  const phone = usPhone(phone_raw);
  if (!phone) {
    return {
      error: 'Please enter a valid US business phone number (10 digits).',
      field: 'phone',
    };
  }
  if (!hours) {
    return { error: 'Please enter your business hours.', field: 'hours' };
  }
  if (!AFTER_HOURS.has(after_hours)) {
    return {
      error: 'Please tell us how after-hours calls are handled today.',
      field: 'after_hours',
    };
  }
  if (weekly_calls && !WEEKLY_CALLS.has(weekly_calls)) {
    return { error: 'Please choose a weekly call volume, or leave it blank.', field: 'weekly_calls' };
  }
  let crews = null;
  if (crews_raw !== '') {
    if (!/^\d{1,4}$/.test(crews_raw)) {
      return {
        error: 'Please enter the number of crews, trucks, or chairs, or leave it blank.',
        field: 'crews',
      };
    }
    crews = parseInt(crews_raw, 10);
  }
  if (!consent) {
    return { error: 'Please confirm your consent for the 10 test calls.', field: 'consent' };
  }
  if (!authorized) {
    return {
      error: 'Please confirm you own this business or are authorized to approve these test calls.',
      field: 'authorized',
    };
  }

  return {
    name,
    email,
    role,
    business_name,
    trade,
    city,
    phone,
    phone_raw,
    hours,
    after_hours,
    weekly_calls: weekly_calls || '',
    crews,
    do_not_call,
    heard_about,
    consent: true,
    authorized: true,
  };
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

  if (tooFast(body)) {
    return json({ ok: false, error: 'Please try again in a moment.' }, 400, origin);
  }

  const result = validate(body);
  if (result.honeypot) return json({ ok: true }, 200, origin);
  if (result.error) {
    return json({ ok: false, error: result.error, field: result.field || null }, 400, origin);
  }

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
    email: result.email,
    role: result.role,
    business_name: result.business_name,
    trade: result.trade,
    city: result.city,
    phone: result.phone,
    phone_raw: result.phone_raw,
    hours: result.hours,
    after_hours: result.after_hours,
    weekly_calls: result.weekly_calls,
    crews: result.crews,
    do_not_call: result.do_not_call,
    heard_about: result.heard_about,
    consent: true,
    consent_text: CONSENT_TEXT,
    authorized: true,
    authority_text: AUTHORITY_TEXT,
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
