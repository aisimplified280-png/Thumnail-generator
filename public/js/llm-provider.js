// AI SIMPLIFIED LAB - LLM PROVIDER ADAPTER
// Optional AI enhancement layer (Groq / Gemini / Pages Function).
// Validates strict JSON design specs and automatically falls back to Local Generator.

window.LLMProvider = (function() {
  'use strict';

  const STORAGE_KEY_CONFIG = 'studio_llm_config';

  function getConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      return stored ? JSON.parse(stored) : {
        mode: 'local', // 'local' | 'pages-api' | 'groq' | 'gemini'
        groqApiKey: '',
        geminiApiKey: ''
      };
    } catch (e) {
      return { mode: 'local', groqApiKey: '', geminiApiKey: '' };
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

    // Mode B: Serverless Cloudflare Pages Function (/api/design)
    if (config.mode === 'pages-api') {
      try {
        const resp = await fetch('/api/design', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || `Server returned ${resp.status}`);
        }
        const data = await resp.json();
        const validated = validateAndSanitizeSpec(data.design, prompt);
        return { spec: validated, source: 'pages-api' };
      } catch (err) {
        console.warn('Pages /api/design failed, falling back to Local Interpreter:', err.message);
        return {
          spec: PromptInterpreter.interpret(prompt, remixSeed),
          source: 'local-fallback',
          error: err.message
        };
      }
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

      const modelsToTry = [
        config.groqModel || 'llama-3.1-8b-instant',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant'
      ];

      // Deduplicate
      const uniqueModels = [...new Set(modelsToTry)];
      let lastError = null;

      for (const modelName of uniqueModels) {
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
            const errMsg = errJson?.error?.message || `Groq returned HTTP ${resp.status}`;
            lastError = new Error(errMsg);
            // If model not found (404), try next model
            if (resp.status === 404) {
              console.warn(`Groq model ${modelName} returned 404, attempting fallback...`);
              continue;
            }
            throw lastError;
          }

          const data = await resp.json();
          const content = JSON.parse(data.choices?.[0]?.message?.content || '{}');
          const validated = validateAndSanitizeSpec(content, prompt);
          return { spec: validated, source: `groq (${modelName})` };
        } catch (err) {
          lastError = err;
          if (!err.message?.includes('404')) {
            break;
          }
        }
      }

      console.warn('Groq call failed, falling back to Local Interpreter:', lastError);
      return {
        spec: PromptInterpreter.interpret(prompt, remixSeed),
        source: 'local-fallback',
        error: lastError ? lastError.message : 'Groq request failed'
      };
    }

    // Mode B: Direct Gemini Client-side Key
    if (config.mode === 'gemini') {
      if (!config.geminiApiKey) {
        return {
          spec: PromptInterpreter.interpret(prompt, remixSeed),
          source: 'local-fallback',
          error: 'No Gemini API key set. Used Local Generator.'
        };
      }

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiApiKey}`;
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

        if (!resp.ok) throw new Error(`Gemini returned ${resp.status}`);
        const data = await resp.json();
        const content = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
        const validated = validateAndSanitizeSpec(content, prompt);
        return { spec: validated, source: 'gemini' };
      } catch (err) {
        console.warn('Gemini direct call failed, falling back to Local Interpreter:', err);
        return {
          spec: PromptInterpreter.interpret(prompt, remixSeed),
          source: 'local-fallback',
          error: err.message
        };
      }
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
