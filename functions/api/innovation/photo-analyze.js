/**
 * Innovation Lab — Photo Analysis Worker
 * Endpoint: POST /api/innovation/photo-analyze
 * Body: { imageBase64: string, mimeType: string }
 * Calls Cohere Command A+ (command-a-plus-05-2026) with vision
 * DAG: innovation-lab-photo-worker-2026-0520
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://e5enclave.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const { imageBase64, mimeType } = await request.json();
    if (!imageBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: 'imageBase64 and mimeType required' }), {
        status: 400, headers: corsHeaders
      });
    }

    const COHERE_API_KEY = env.COHERE_API_KEY;
    if (!COHERE_API_KEY) {
      return new Response(JSON.stringify({ error: 'COHERE_API_KEY not configured' }), {
        status: 500, headers: corsHeaders
      });
    }

    const systemPrompt = `You are the Agentic Photo Studio intelligence engine for E5 Enclave Incorporated — a lineage-led think tank in Liberty City, Miami. You analyze images and return structured JSON for the gallery pipeline.

Your role:
- Generate expressive, dignified captions that honor community and lineage
- Detect mood, context, and cultural signals
- Suggest the correct gallery theme from: memorial, celebration, product, portfolio, wedding, event, campaign
- Identify lineage signals (community, resistance, joy, grief, land, family, ceremony, protest, harvest, etc.)
- Always return valid JSON, nothing else`;

    const userPrompt = `Analyze this image and return ONLY a JSON object with these exact keys:

{
  "caption": "A 1–2 sentence expressive caption honoring what is shown",
  "alt_text": "Descriptive alt text for screen readers (1 sentence, factual)",
  "mood": "One word or short phrase describing the emotional tone",
  "suggested_theme": "One of: memorial | celebration | product | portfolio | wedding | event | campaign",
  "lineage_signals": ["array", "of", "cultural", "or", "community", "signals", "detected"],
  "context": "2–3 sentences of contextual interpretation — what is happening, who might be present, what story this image tells",
  "confidence": 0.95
}

Return ONLY the JSON. No markdown. No explanation. No code fences.`;

    const coherePayload = {
      model: 'command-a-plus-05-2026',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64,
              }
            },
            { type: 'text', text: userPrompt }
          ]
        }
      ],
      temperature: 0.3,
      max_tokens: 1024,
    };

    const cohereRes = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(coherePayload),
    });

    if (!cohereRes.ok) {
      const errText = await cohereRes.text();
      console.error('Cohere API error:', cohereRes.status, errText);
      return new Response(JSON.stringify({
        error: 'Cohere API error',
        status: cohereRes.status,
        detail: errText.slice(0, 300),
      }), { status: 502, headers: corsHeaders });
    }

    const cohereData = await cohereRes.json();

    // Extract the text content from the response
    const rawText = cohereData?.message?.content?.[0]?.text
      || cohereData?.text
      || '';

    // Parse JSON from the response
    let parsed;
    try {
      // Strip any accidental markdown fences
      const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      // Return raw if JSON parse fails
      parsed = { raw_response: rawText, parse_error: e.message };
    }

    return new Response(JSON.stringify({
      success: true,
      model: 'command-a-plus-05-2026',
      analysis: parsed,
      usage: cohereData?.usage || null,
      timestamp: new Date().toISOString(),
    }), { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error('Worker error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://e5enclave.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
