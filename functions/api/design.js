// Cloudflare Pages Function: /api/design
// Receives { prompt: string, provider?: 'groq' | 'gemini', model?: string }
// Calls configured LLM provider using server-side secrets (GROQ_API_KEY or GEMINI_API_KEY)
// Returns structured design JSON specification. Does NOT generate images or return executable code.

const DESIGN_JSON_SCHEMA = {
  category: "string (cybersecurity|ai-agent|programming|news|productivity|science|creative)",
  composition: "string (focal-right|split-duel|isometric-stage|shatter-burst|cinematic-hud)",
  headline: "string (max 6-8 words, high impact)",
  headlineHighlight: "string (1-2 words from headline to emphasize in accent color)",
  subtitle: "string (short supporting claim or context)",
  badge: "string (e.g. 'BREACH DETECTED', 'JUST RELEASED', '10X FASTER')",
  focalSubject: "string (key visual metaphor)",
  palette: {
    bgDark: "hex color (e.g. #060913)",
    bgMid: "hex color (e.g. #0e1526)",
    accent1: "hex color (primary neon/energy glow)",
    accent2: "hex color (secondary warning/contrast color)",
    textLight: "hex color (#ffffff)",
    textAccent: "hex color"
  },
  effects: {
    glowIntensity: "number 0.1 to 1.0",
    particleDensity: "number 0 to 1.0",
    vignette: "boolean",
    gridFloor: "boolean",
    laserBeams: "boolean",
    warningGlitch: "boolean"
  },
  mood: "string"
};

const SYSTEM_PROMPT = `You are a world-class YouTube thumbnail creative director and SVG graphic architect for the faceless AI and tech channel 'AI Simplified Lab'.
Given a natural language prompt describing a video, generate a structured visual design specification in JSON.
Never output HTML, markdown formatting, or JavaScript code. Output ONLY valid, parseable JSON conforming to this schema:
${JSON.stringify(DESIGN_JSON_SCHEMA, null, 2)}

Design Principles:
1. YouTube thumbnails need MASSIVE visual contrast and immediate readability even on small mobile screens.
2. Headlines must be punchy, curiosity-inducing, and short (3 to 6 words).
3. Select an accent color that screams out against dark backgrounds (neon cyan #00f2fe, bright red #ff2a5f, electric amber #ffb703, toxic green #00ff87, or vivid magenta #ff007f).
4. Do NOT depict human faces. Use futuristic tech metaphors: data vaults, neural cores, breaking sandboxes, cyber shields, code consoles, workflow pipelines, quantum atoms.`;

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const prompt = (body.prompt || '').trim();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const groqKey = env.GROQ_API_KEY;
    const geminiKey = env.GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      return new Response(JSON.stringify({
        error: 'No server-side LLM API key configured in Cloudflare Pages environment secrets. Please use the client-side API key option or the built-in Local Generator mode.'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let designSpec = null;

    if (groqKey) {
      designSpec = await callGroq(groqKey, prompt);
    } else if (geminiKey) {
      designSpec = await callGemini(geminiKey, prompt);
    }

    if (!designSpec) {
      return new Response(JSON.stringify({ error: 'Failed to generate design specification from LLM provider' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, design: designSpec }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Server error processing design' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function callGroq(apiKey, userPrompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Design a thumbnail for this video prompt: "${userPrompt}"` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  return JSON.parse(content);
}

async function callGemini(apiKey, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: SYSTEM_PROMPT },
          { text: `Design a thumbnail for this video prompt: "${userPrompt}". Provide only valid JSON.` }
        ]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.6
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}
