/**
 * Innovation Lab — Photo Analysis Worker
 * Endpoint: POST /api/innovation/photo-analyze
 * Body: { imageBase64: string, mimeType: string }
 * Routes through Base44 proxy → Cohere Command A+ Vision
 * Private repo — service token embedded for CF Pages runtime
 * DAG: innovation-lab-photo-worker-2026-0520-v4
 */

const PROXY_URL = 'https://base44.app/api/apps/69d7dd5e015cd1aa45c3e283/functions/innovationPhotoProxy';
const B44_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkOTQyNDdmNS1lOTg2LTQ5MDAtOTM4MC1mNDM0YzZkZjliNGYiLCJjbGllbnRfaWQiOiJkOTQyNDdmNS1lOTg2LTQ5MDAtOTM4MC1mNDM0YzZkZjliNGYiLCJhcHBfaWQiOiI2OWQ3ZGQ1ZTAxNWNkMWFhNDVjM2UyODMiLCJhdWQiOiJiYXNlNDRfYXBpIiwic2NvcGUiOiJhcHAuYWNjZXNzIiwiZXhwIjoxNzc5MzE5MTMzLCJpYXQiOjE3NzkzMTU1MzN9.2-kZbx4vMs0UYjnV7C3h4yjXC_uEG86vnoKoQC8OdPk';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://e5enclave.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  // Prefer env var if set in CF Pages dashboard, fall back to embedded token
  const authToken = env.BASE44_SERVICE_TOKEN || B44_TOKEN;

  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 and mimeType required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const proxyRes = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ imageBase64, mimeType }),
    });

    const data = await proxyRes.json();
    return new Response(JSON.stringify(data), {
      status: proxyRes.status,
      headers: corsHeaders,
    });

  } catch (err) {
    console.error('Worker error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
