/**
 * Innovation Lab — Photo Analysis Worker
 * Endpoint: POST /api/innovation/photo-analyze
 * Body: { imageBase64: string, mimeType: string }
 * Routes through Base44 proxy → Cohere Command A+ Vision
 * DAG: innovation-lab-photo-worker-2026-0520-v2
 */

const PROXY_URL = 'https://sue-app-e73f9f1e.base44.app/api/functions/innovationPhotoProxy';

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
  const { request } = context;

  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 and mimeType required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Forward to Base44 proxy which holds the Cohere key securely
    const proxyRes = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
