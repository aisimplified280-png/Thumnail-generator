// AI SIMPLIFIED LAB - LLM PROVIDER ADAPTER
// Optional AI enhancement layer (Groq / Gemini / Pages Function).
// Validates strict JSON design specs and automatically falls back to Local Generator.

window.LLMProvider = (function() {
  'use strict';

  const STORAGE_KEY_CONFIG = 'as_thumb_llm_config';

  function getConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG) || localStorage.getItem('studio_llm_config');
      return stored ? JSON.parse(stored) : {
        mode: 'local', // 'local' | 'groq' | 'gemini'
        groqApiKey: '',
        groqModel: 'openai/gpt-oss-20b',
        geminiApiKey: ''
      };
    } catch (e) {
      return { mode: 'local', groqApiKey: '', groqModel: 'openai/gpt-oss-20b', geminiApiKey: '' };
    }
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
    } catch (e) {
      console.warn('Failed to save LLM config to localStorage:', e);
    }
  }

  // Schema validation for returned design specs
  function validateAndSanitizeSpec(rawSpec, fallbackPrompt) {
    if (!rawSpec || typeof rawSpec !== 'object') {
      throw new Error('LLM did not return a valid JSON object');
    }

    const validCategories = ['cybersecurity', 'ai-agent', 'programming', 'news', 'productivity', 'science', 'creative'];
    const validCompositions = ['focal-right', 'split-duel', 'isometric-stage', 'shatter-burst', 'cinematic-hud'];

    const category = validCategories.includes(rawSpec.category) ? rawSpec.category : 'cybersecurity';
    const composition = validCompositions.includes(rawSpec.composition) ? rawSpec.composition : 'focal-right';
    const headline = (rawSpec.headline || 'AI ESCAPED?').toString().slice(0, 50);
    const headlineHighlight = (rawSpec.headlineHighlight || '').toString().slice(0, 20);
    const subtitle = (rawSpec.subtitle || 'UNFILTERED BREAKDOWN').toString().slice(0, 60);
    const badge = (rawSpec.badge || 'CRITICAL ALERT').toString().slice(0, 30);
    const focalMetaphor = (rawSpec.focalSubject || rawSpec.focalMetaphor || 'vault').toString().toLowerCase();

    const p = rawSpec.palette || {};
    const palette = {
      bgDark: (p.bgDark && /^#[0-9a-f]{6}$/i.test(p.bgDark)) ? p.bgDark : '#060a14',
      bgMid: (p.bgMid && /^#[0-9a-f]{6}$/i.test(p.bgMid)) ? p.bgMid : '#0e172a',
      accent1: (p.accent1 && /^#[0-9a-f]{6}$/i.test(p.accent1)) ? p.accent1 : '#00f2fe',
      accent2: (p.accent2 && /^#[0-9a-f]{6}$/i.test(p.accent2)) ? p.accent2 : '#ff2a5f',
      textLight: '#ffffff',
      textAccent: (p.accent2 && /^#[0-9a-f]{6}$/i.test(p.accent2)) ? p.accent2 : '#ff2a5f'
    };

    const effects = {
      gridFloor: rawSpec.effects?.gridFloor !== false,
      laserBeams: rawSpec.effects?.laserBeams !== false,
      particleDensity: typeof rawSpec.effects?.particleDensity === 'number' ? Math.min(80, Math.max(10, rawSpec.effects.particleDensity * 60)) : 45,
      vignette: true,
      glowIntensity: 1.0
    };

    return {
      category,
      focalMetaphor,
      composition,
      headline,
      headlineHighlight,
      subtitle,
      badge,
      palette,
      effects,
      rawPrompt: fallbackPrompt
    };
  }

  // Generate design specification
  async function generateDesign(prompt, remixSeed = 0) {
    const config = getConfig();

    // Mode A: Local Engine (Default, fast, 100% offline & free)
    if (config.mode === 'local') {
      return {
        spec: PromptInterpreter.interpret(prompt, remixSeed),
        source: 'local'
      };
    }

    // Cloudflare Pages Function (Unavailable on GitHub Pages static deployment)
    if (config.mode === 'pages-api') {
      return {
        spec: PromptInterpreter.interpret(prompt, remixSeed),
        source: 'local-fallback',
        error: 'Pages Function is not available on GitHub Pages static hosting. Used Local Engine.'
      };
    }

    // Mode B: Direct Groq Client-side Key
    if (config.mode === 'groq') {
      const apiKey = (config.groqApiKey || '').trim();
      if (!apiKey) {
        return {
          spec: PromptInterpreter.interpret(prompt, remixSeed),
          source: 'local-fallback',
          error: 'No Groq API key set. Used Local Generator.'
        };
      }

      // Valid active Groq models (verified supported)
      const userSelectedModel = config.groqModel === 'openai/gpt-oss-120b' ? 'openai/gpt-oss-120b' : 'openai/gpt-oss-20b';
      const modelsToTry = [
        userSelectedModel,
        userSelectedModel === 'openai/gpt-oss-20b' ? 'openai/gpt-oss-120b' : 'openai/gpt-oss-20b'
      ];

      let lastErrorMsg = null;

      for (const modelName of modelsToTry) {
        try {
          const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                {
                  role: 'system',
                  content: `You are a YouTube thumbnail designer for 'AI Simplified Lab'. Output valid JSON only with properties: category (cybersecurity|ai-agent|programming|news|productivity|science|creative), composition (focal-right|split-duel|isometric-stage|shatter-burst|cinematic-hud), headline (short, uppercase, max 5 words), headlineHighlight, subtitle, badge, focalSubject (vault|shield|neural-core|terminal|workflow|quantum|prism|disruption|hf-breach), palette {bgDark, bgMid, accent1, accent2}, effects {gridFloor, laserBeams, particleDensity}.`
                },
                { role: 'user', content: `Design thumbnail: ${prompt}` }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.6
            })
          });

          if (!resp.ok) {
            const errJson = await resp.json().catch(() => null);
            const errDetail = errJson?.error?.message || `HTTP ${resp.status}`;

            if (resp.status === 401 || resp.status === 403) {
              lastErrorMsg = `Groq authentication error (${resp.status}): Invalid API key`;
              break;
            } else if (resp.status === 429) {
              lastErrorMsg = 'Groq rate limit or quota exceeded (429)';
              break;
            } else if (resp.status === 404) {
              lastErrorMsg = `Groq model '${modelName}' unavailable (404)`;
              continue;
            } else {
              lastErrorMsg = `Groq error: ${errDetail}`;
              break;
            }
          }

          const data = await resp.json();
          const content = JSON.parse(data.choices?.[0]?.message?.content || '{}');
          const validated = validateAndSanitizeSpec(content, prompt);
          return { spec: validated, source: `groq (${modelName})` };
        } catch (err) {
          lastErrorMsg = err.message || 'Groq network connection error';
          break;
        }
      }

      return {
        spec: PromptInterpreter.interpret(prompt, remixSeed),
        source: 'local-fallback',
        error: lastErrorMsg || 'Groq request failed'
      };
    }

    // Mode B: Direct Gemini Client-side Key
    if (config.mode === 'gemini') {
      const apiKey = (config.geminiApiKey || '').trim();
      if (!apiKey) {
        return {
          spec: PromptInterpreter.interpret(prompt, remixSeed),
          source: 'local-fallback',
          error: 'No Gemini API key set. Used Local Generator.'
        };
      }

      const geminiModel = 'gemini-3.8-flash';
      let lastErrorMsg = null;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a YouTube thumbnail designer for 'AI Simplified Lab'. Return JSON only matching schema: { category, composition, headline, headlineHighlight, subtitle, badge, focalSubject, palette: {bgDark, bgMid, accent1, accent2}, effects: {gridFloor, laserBeams, particleDensity} }. Design thumbnail for: "${prompt}"`
              }]
            }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (!resp.ok) {
          const errJson = await resp.json().catch(() => null);
          const errDetail = errJson?.error?.message || `HTTP ${resp.status}`;

          if (resp.status === 401 || resp.status === 403) {
            lastErrorMsg = `Gemini authentication error (${resp.status}): Invalid API key`;
          } else if (resp.status === 400) {
            lastErrorMsg = `Gemini request error (400): ${errDetail}`;
          } else if (resp.status === 429) {
            lastErrorMsg = 'Gemini rate limit or quota exceeded (429)';
          } else if (resp.status === 404) {
            lastErrorMsg = `Gemini model '${geminiModel}' unavailable (404)`;
          } else {
            lastErrorMsg = `Gemini error: ${errDetail}`;
          }
        } else {
          const data = await resp.json();
          const content = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
          const validated = validateAndSanitizeSpec(content, prompt);
          return { spec: validated, source: `gemini (${geminiModel})` };
        }
      } catch (err) {
        lastErrorMsg = err.message || 'Gemini network connection error';
      }

      return {
        spec: PromptInterpreter.interpret(prompt, remixSeed),
        source: 'local-fallback',
        error: lastErrorMsg || 'Gemini request failed'
      };
    }

    // Default fallback
    return {
      spec: PromptInterpreter.interpret(prompt, remixSeed),
      source: 'local'
    };
  }

  return {
    getConfig,
    saveConfig,
    generateDesign
  };
})();
