// AI SIMPLIFIED LAB - PROMPT INTERPRETER (Local NLP Engine)
// Interprets natural language descriptions into a rich visual design specification.
// Completely offline, client-side, zero API key required.

window.PromptInterpreter = (function() {
  'use strict';

  // Curated color themes for high CTR and visual punch
  const COLOR_PALETTES = {
    viralMrBeast: {
      name: 'Viral High-CTR',
      bgDark: '#08080d',
      bgMid: '#161622',
      accent1: '#ffe600', // Electric High-CTR Yellow
      accent2: '#ff0044', // Hot Crimson Red
      textLight: '#ffffff',
      textAccent: '#ffe600'
    },
    cyberpunk: {
      name: 'Cyberpunk Breach',
      bgDark: '#060a14',
      bgMid: '#0e172a',
      accent1: '#00f2fe', // Electric Cyan
      accent2: '#ff2a5f', // Crimson Breach
      textLight: '#ffffff',
      textAccent: '#ff2a5f'
    },
    neonGreen: {
      name: 'Matrix Exploit',
      bgDark: '#040b08',
      bgMid: '#0b1f14',
      accent1: '#00ff87', // Toxic Lime
      accent2: '#00f2fe', // Cyber Cyan
      textLight: '#ffffff',
      textAccent: '#00ff87'
    },
    neuralViolet: {
      name: 'Deep Neural',
      bgDark: '#090514',
      bgMid: '#160d2e',
      accent1: '#8a2be2', // Royal Violet
      accent2: '#00f2fe', // Electric Cyan
      textLight: '#ffffff',
      textAccent: '#00f2fe'
    },
    dangerAmber: {
      name: 'Critical Alert',
      bgDark: '#0d0904',
      bgMid: '#241708',
      accent1: '#ffb703', // Amber Gold
      accent2: '#ff2a5f', // Crimson Red
      textLight: '#ffffff',
      textAccent: '#ffb703'
    },
    quantumPink: {
      name: 'Quantum Spectrum',
      bgDark: '#080511',
      bgMid: '#180c29',
      accent1: '#ff007f', // Neon Magenta
      accent2: '#00f2fe', // Cyan
      textLight: '#ffffff',
      textAccent: '#ff007f'
    },
    obsidianChrome: {
      name: 'Obsidian Minimal',
      bgDark: '#090a0f',
      bgMid: '#141722',
      accent1: '#38bdf8', // Sky Blue
      accent2: '#fbbf24', // Warm Gold
      textLight: '#ffffff',
      textAccent: '#38bdf8'
    }
  };

  // Category classifiers based on weighted keywords
  const CATEGORIES = {
    cybersecurity: {
      id: 'cybersecurity',
      keywords: ['breach', 'breaching', 'hack', 'hacked', 'hugging face', 'security', 'shield', 'sandbox', 'escaped', 'vault', 'exploit', 'vulnerability', 'firewall', 'ransomware', 'cyber', 'leak', 'zero-day', 'data vault'],
      defaultMetaphor: 'vault',
      palette: 'cyberpunk',
      badge: 'BREACH DETECTED'
    },
    aiAgent: {
      id: 'ai-agent',
      keywords: ['agent', 'autonomous', 'llm', 'neural', 'brain', 'ai model', 'gpt', 'claude', 'gemini', 'deepseek', 'robot', 'intelligence', 'reasoning', 'superintelligence', 'agi', 'escape', 'swarm'],
      defaultMetaphor: 'neural-core',
      palette: 'neuralViolet',
      badge: 'AUTONOMOUS AI'
    },
    programming: {
      id: 'programming',
      keywords: ['code', 'coding', 'developer', 'software', 'python', 'javascript', 'terminal', 'api', 'architecture', 'backend', 'fullstack', 'database', 'git', 'bug', 'ide', 'framework'],
      defaultMetaphor: 'terminal',
      palette: 'neonGreen',
      badge: 'DEV RUNTIME'
    },
    news: {
      id: 'news',
      keywords: ['breaking', 'news', 'announced', 'just', 'release', 'update', 'disruption', 'banned', 'killed', 'over', 'shocking', 'truth', 'controversy', 'leak'],
      defaultMetaphor: 'disruption',
      palette: 'dangerAmber',
      badge: 'BREAKING NEWS'
    },
    productivity: {
      id: 'productivity',
      keywords: ['productivity', 'workflow', 'automate', 'automation', '10x', 'faster', 'pipeline', 'tool', 'system', 'efficiency', 'work', 'speed', 'n8n', 'zapier'],
      defaultMetaphor: 'workflow',
      palette: 'dangerAmber',
      badge: '10X WORKFLOW'
    },
    science: {
      id: 'science',
      keywords: ['science', 'quantum', 'physics', 'energy', 'atom', 'particle', 'fusion', 'molecule', 'space', 'galaxy', 'experiment', 'black hole'],
      defaultMetaphor: 'quantum',
      palette: 'quantumPink',
      badge: 'DEEP TECH'
    },
    creative: {
      id: 'creative',
      keywords: ['fashion', 'design', 'art', 'style', 'creative', 'aesthetic', 'texture', 'garment', 'fabric', 'luxury', 'visual', 'render', '3d'],
      defaultMetaphor: 'prism',
      palette: 'quantumPink',
      badge: 'NEXT AESTHETIC'
    }
  };

  // Helper to extract quoted phrases
  function extractQuotedText(text) {
    const doubleMatch = text.match(/"([^"]+)"/);
    if (doubleMatch) return doubleMatch[1];
    const singleMatch = text.match(/'([^']+)'/);
    if (singleMatch) return singleMatch[1];
    const curlyMatch = text.match(/“([^”]+)”/);
    if (curlyMatch) return curlyMatch[1];
    return null;
  }

  // Detect headline from prompt
  function detectHeadline(prompt, category) {
    // Check for explicit headline directives
    // e.g. "headline 'AI ESCAPED?'" or "Make the headline '...'"
    const headlineDirective = prompt.match(/(?:headline|title|text|saying|titled)\s*[:=]?\s*['"“]([^'"”]+)['"”]/i);
    if (headlineDirective && headlineDirective[1].trim()) {
      return headlineDirective[1].trim();
    }

    const anyQuote = extractQuotedText(prompt);
    if (anyQuote && anyQuote.length > 2 && anyQuote.length < 35) {
      return anyQuote;
    }

    // Check uppercase short phrases
    const uppercaseMatch = prompt.match(/\b[A-Z0-9\s?!-]{4,25}\b/);
    if (uppercaseMatch && uppercaseMatch[0].trim().split(/\s+/).length <= 4) {
      return uppercaseMatch[0].trim();
    }

    // Default high-CTR headlines per category
    const fallbacks = {
      cybersecurity: 'AI ESCAPED?',
      'ai-agent': 'AGENTS UNLEASHED',
      programming: 'CODE AUTOMATED',
      news: 'IT JUST HAPPENED',
      productivity: '10X YOUR OUTPUT',
      science: 'QUANTUM LEAP',
      creative: 'FUTURE AESTHETIC'
    };

    return fallbacks[category] || 'AI SIMPLIFIED';
  }

  // Detect which words in headline should have accent color
  function detectHighlightWord(headline) {
    const words = headline.trim().split(/\s+/);
    if (words.length <= 1) return words[0];

    // Priority words that grab attention
    const punchyWords = ['ESCAPED', 'BREACH', 'LEAKED', 'CRITICAL', 'UNLEASHED', '10X', 'STOP', 'SHOCKING', 'SECRET', 'NEW', 'AGENTS', 'HACKED', 'DESTROYED', 'FAIL', 'WAR'];
    for (const w of words) {
      const clean = w.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (punchyWords.includes(clean)) return w;
    }

    // Default to the last punchy word
    return words[words.length - 1];
  }

  // Detect user requested colors
  function detectColors(prompt) {
    const p = prompt.toLowerCase();
    let customPalette = null;

    if (p.includes('cyan') && p.includes('red')) {
      customPalette = { ...COLOR_PALETTES.cyberpunk };
    } else if (p.includes('green') || p.includes('lime') || p.includes('matrix')) {
      customPalette = { ...COLOR_PALETTES.neonGreen };
    } else if (p.includes('purple') || p.includes('violet')) {
      customPalette = { ...COLOR_PALETTES.neuralViolet };
    } else if (p.includes('gold') || p.includes('amber') || p.includes('yellow')) {
      customPalette = { ...COLOR_PALETTES.dangerAmber };
    } else if (p.includes('magenta') || p.includes('pink')) {
      customPalette = { ...COLOR_PALETTES.quantumPink };
    }

    if (p.includes('dark navy') || p.includes('navy')) {
      if (customPalette) {
        customPalette.bgDark = '#050c18';
        customPalette.bgMid = '#0c1a32';
      }
    }

    return customPalette;
  }

  // Detect specific visual metaphor
  function detectFocalMetaphor(prompt, categoryId) {
    const p = prompt.toLowerCase();

    // Explicit graphic accents take top precedence
    if (p.includes('arrow') || p.includes('pointing') || p.includes('look here')) {
      return 'arrow';
    }
    if (p.includes('sticker') || p.includes('hazard') || p.includes('caution') || p.includes('exposed') || p.includes('banned')) {
      return 'sticker-badge';
    }

    if (p.includes('hugging face') || p.includes('huggingface') || p.includes('hf')) {
      return 'hf-breach';
    }
    if (p.includes('vault') || p.includes('data vault') || p.includes('storage') || p.includes('cloud')) {
      return 'vault';
    }
    if (p.includes('shield') || p.includes('firewall') || p.includes('sandbox') || p.includes('barrier')) {
      return 'shield';
    }
    if (p.includes('terminal') || p.includes('code') || p.includes('developer') || p.includes('python')) {
      return 'terminal';
    }
    if (p.includes('brain') || p.includes('neural') || p.includes('core') || p.includes('chip') || p.includes('agent')) {
      return 'neural-core';
    }
    if (p.includes('workflow') || p.includes('automate') || p.includes('pipeline') || p.includes('10x')) {
      return 'workflow';
    }
    if (p.includes('atom') || p.includes('quantum') || p.includes('physics') || p.includes('molecule')) {
      return 'quantum';
    }
    if (p.includes('prism') || p.includes('fashion') || p.includes('fabric') || p.includes('garment') || p.includes('spectrum')) {
      return 'prism';
    }
    if (p.includes('breaking') || p.includes('disruption') || p.includes('monolith') || p.includes('split')) {
      return 'disruption';
    }

    // Default based on category
    return CATEGORIES[categoryId]?.defaultMetaphor || 'neural-core';
  }

  // Main interpret function
  function interpret(promptText, remixSeed = 0) {
    const text = (promptText || '').trim();
    const lower = text.toLowerCase();

    // 1. Score categories
    let bestCat = 'cybersecurity';
    let highestScore = -1;

    for (const [key, def] of Object.entries(CATEGORIES)) {
      let score = 0;
      for (const kw of def.keywords) {
        if (lower.includes(kw)) {
          score += kw.length > 5 ? 3 : 1; // longer matches count more
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestCat = def.id;
      }
    }

    const categoryDef = CATEGORIES[bestCat] || CATEGORIES.cybersecurity;

    // 2. Extract headline & text components
    const headline = detectHeadline(text, bestCat);
    const highlightWord = detectHighlightWord(headline);

    // Contextual subtitle
    let subtitle = 'THE UNFILTERED BREAKDOWN';
    if (bestCat === 'cybersecurity') subtitle = 'SECURITY PROTOCOLS BYPASSED';
    else if (bestCat === 'ai-agent') subtitle = 'ZERO HUMAN INTERVENTION';
    else if (bestCat === 'programming') subtitle = 'FULL ARCHITECTURE INSIDE';
    else if (bestCat === 'news') subtitle = 'EVERYTHING JUST CHANGED';
    else if (bestCat === 'productivity') subtitle = 'FULL PRODUCTION WORKFLOW';
    else if (bestCat === 'science') subtitle = 'NEW PHYSICAL DISCOVERY';
    else if (bestCat === 'creative') subtitle = 'GENERATIVE ART & DESIGN';

    // 3. Focal metaphor
    const focalMetaphor = detectFocalMetaphor(text, bestCat);

    // 4. Color Palette
    let palette = detectColors(text) || COLOR_PALETTES[categoryDef.palette] || COLOR_PALETTES.cyberpunk;

    // 5. Composition Style (Remix rotates through compositions)
    const compositions = ['focal-right', 'split-duel', 'isometric-stage', 'shatter-burst', 'cinematic-hud'];
    const compIndex = Math.abs(remixSeed) % compositions.length;
    const composition = compositions[compIndex];

    // 6. Effects specification with cinematic lighting
    const effects = {
      gridFloor: lower.includes('grid') || true,
      laserBeams: lower.includes('beam') || lower.includes('light') || true,
      spotlights: true,
      sunburst: true,
      particleDensity: 45 + (remixSeed % 20),
      vignette: true,
      glowIntensity: 1.0
    };

    // 7. Badge text
    let badge = categoryDef.badge;
    if (lower.includes('hugging face') || lower.includes('huggingface')) {
      badge = 'HF ZERO-DAY BREACH';
    } else if (lower.includes('critical') || lower.includes('alert')) {
      badge = 'CRITICAL ALERT';
    } else if (lower.includes('secret') || lower.includes('leak')) {
      badge = 'CONFIDENTIAL LEAK';
    }

    return {
      category: bestCat,
      focalMetaphor,
      composition,
      headline,
      headlineHighlight: highlightWord,
      textStyle: 'sticker',
      slant: -3,
      backplateColor: palette.accent2 || '#e11d48',
      subtitle,
      badge,
      palette,
      effects,
      seed: remixSeed,
      rawPrompt: text
    };
  }

  return {
    interpret,
    COLOR_PALETTES,
    CATEGORIES
  };
})();
