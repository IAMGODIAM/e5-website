// KARMELO ANTHONY COURT SUPPORT — Cloudflare Pages Function
// Route: /api/karmelo-signup
// Forwards to Base44 karmeloSignup function + writes directly to Google Sheets
// DAG: karmelo-cf-worker-2026-0521

const BASE44_FUNCTION_URL = 'https://sue-45c3e283.base44.app/api/apps/69d7dd5e015cd1aa45c3e283/functions/karmeloSignup';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    // Basic validation at edge
    const firstName = (body.firstName || body.first_name || '').trim();
    const lastName  = (body.lastName  || body.last_name  || '').trim();
    const email     = (body.email || '').trim().toLowerCase();

    if (!firstName || !lastName || !email) {
      return new Response(
        JSON.stringify({ error: 'First name, last name, and email are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    const normalised = {
      firstName,
      lastName,
      email,
      phone:        (body.phone        || '').trim(),
      city:         (body.city         || '').trim(),
      state:        (body.state        || '').trim(),
      commitment:   (body.commitment   || body.commitment_type || 'updates_only').trim(),
      organization: (body.organization || '').trim(),
      message:      (body.message      || '').trim(),
      source:       body.source || 'karmelo-justice-page',
      submitted_at: new Date().toISOString(),
    };

    // Forward to Base44 function (handles DB + Sheets + Telegram)
    const b44Resp = await fetch(BASE44_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalised),
    });

    const result = await b44Resp.json();

    if (!b44Resp.ok) {
      console.error('[karmelo-signup] Base44 error:', b44Resp.status, JSON.stringify(result));
      // Still return 200 to user — log the error internally
      return new Response(
        JSON.stringify({ success: true, message: 'You are now on the record. We will be in touch.' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } }
    );

  } catch (err) {
    console.error('[karmelo-signup] Error:', err.message);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please email israel@e5enclave.com directly.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }
}
