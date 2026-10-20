// AI SIMPLIFIED LAB - SCENE LIBRARY
// Composable, highly detailed SVG graphics, filters, patterns and procedural tech components.

window.SceneLibrary = (function() {
  'use strict';

  // Seeded pseudo-random generator for deterministic remixes
  function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  // Generate SVG filter definitions
  function getSvgDefs(theme) {
    const accent1 = theme.accent1 || '#00f2fe';
    const accent2 = theme.accent2 || '#ff2a5f';
    const bgDark = theme.bgDark || '#070a12';
    const bgMid = theme.bgMid || '#0f172a';

    return `
      <defs>
        <!-- Dynamic Glow Filters -->
        <filter id="filter-glow-primary" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur1" />
          <feGaussianBlur stdDeviation="16" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="filter-glow-secondary" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 2 0" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="filter-glow-intense" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="12" result="blur1" />
          <feGaussianBlur stdDeviation="28" result="blur2" />
          <feGaussianBlur stdDeviation="55" result="blur3" />
          <feMerge>
            <feMergeNode in="blur3" />
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- High-CTR Rim Light Filter for Centerpiece Subjects -->
        <filter id="filter-rim-light" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="14" result="blur" />
          <feFlood flood-color="${accent1}" flood-opacity="0.9" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Heavy Drop Shadow for Text -->
        <filter id="filter-text-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000000" flood-opacity="1" />
          <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#000000" flood-opacity="0.95" />
          <feDropShadow dx="0" dy="28" stdDeviation="24" flood-color="#000000" flood-opacity="0.8" />
        </filter>

        <!-- Sticker Tape Backplate Sharp Shadow -->
        <filter id="filter-sticker-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="4" dy="10" stdDeviation="6" flood-color="#000000" flood-opacity="0.95" />
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.8" />
        </filter>

        <!-- 3D Bevel/Emboss Filter -->
        <filter id="filter-bevel" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="4" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.85" />
        </filter>

        <!-- 3D Extrusion Layer Shadow -->
        <filter id="filter-3d-extrude" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="5" dy="8" stdDeviation="0.1" flood-color="#000000" flood-opacity="1" />
          <feDropShadow dx="9" dy="14" stdDeviation="4" flood-color="#000000" flood-opacity="0.9" />
        </filter>

        <!-- Gradients -->
        <linearGradient id="grad-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accent1}" />
          <stop offset="100%" stop-color="${accent2}" />
        </linearGradient>

        <linearGradient id="grad-accent-v" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${accent1}" />
          <stop offset="100%" stop-color="${accent2}" />
        </linearGradient>

        <linearGradient id="grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff885" />
          <stop offset="30%" stop-color="#ffb703" />
          <stop offset="70%" stop-color="#fb8500" />
          <stop offset="100%" stop-color="#c1121f" />
        </linearGradient>

        <linearGradient id="grad-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="35%" stop-color="#94a3b8" />
          <stop offset="50%" stop-color="#ffffff" />
          <stop offset="85%" stop-color="#334155" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>

        <!-- Viral High-CTR Text Gradients -->
        <linearGradient id="grad-text-fire" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="25%" stop-color="#ffe600" />
          <stop offset="70%" stop-color="#ff3b00" />
          <stop offset="100%" stop-color="#b80028" />
        </linearGradient>

        <linearGradient id="grad-text-electric" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="35%" stop-color="#00f2fe" />
          <stop offset="85%" stop-color="#0066ff" />
          <stop offset="100%" stop-color="#002b80" />
        </linearGradient>

        <linearGradient id="grad-text-lime" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="35%" stop-color="#39ff14" />
          <stop offset="80%" stop-color="#00aa33" />
          <stop offset="100%" stop-color="#004d1a" />
        </linearGradient>

        <linearGradient id="grad-text-neon-pink" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="35%" stop-color="#ff2a85" />
          <stop offset="85%" stop-color="#aa0055" />
          <stop offset="100%" stop-color="#4d0026" />
        </linearGradient>

        <linearGradient id="grad-bg-ambient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgMid}" stop-opacity="0.95" />
          <stop offset="60%" stop-color="${bgDark}" stop-opacity="0.98" />
          <stop offset="100%" stop-color="#020307" stop-opacity="1" />
        </linearGradient>

        <!-- Volumetric Spotlight Beams -->
        <linearGradient id="grad-spotlight-left" x1="0%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stop-color="${accent1}" stop-opacity="0.32" />
          <stop offset="40%" stop-color="${accent1}" stop-opacity="0.12" />
          <stop offset="100%" stop-color="${accent1}" stop-opacity="0" />
        </linearGradient>

        <linearGradient id="grad-spotlight-right" x1="100%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stop-color="${accent2}" stop-opacity="0.28" />
          <stop offset="45%" stop-color="${accent2}" stop-opacity="0.1" />
          <stop offset="100%" stop-color="${accent2}" stop-opacity="0" />
        </linearGradient>

        <!-- Dramatic Radial Blooms -->
        <radialGradient id="grad-sunburst" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${accent1}" stop-opacity="0.45" />
          <stop offset="40%" stop-color="${accent2}" stop-opacity="0.2" />
          <stop offset="80%" stop-color="${bgDark}" stop-opacity="0.05" />
          <stop offset="100%" stop-color="${bgDark}" stop-opacity="0" />
        </radialGradient>

        <radialGradient id="grad-core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${accent1}" stop-opacity="0.8" />
          <stop offset="35%" stop-color="${accent1}" stop-opacity="0.35" />
          <stop offset="75%" stop-color="${accent1}" stop-opacity="0.08" />
          <stop offset="100%" stop-color="${accent1}" stop-opacity="0" />
        </radialGradient>

        <radialGradient id="grad-breach-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${accent2}" stop-opacity="0.9" />
          <stop offset="45%" stop-color="${accent2}" stop-opacity="0.4" />
          <stop offset="80%" stop-color="${accent2}" stop-opacity="0.1" />
          <stop offset="100%" stop-color="${accent2}" stop-opacity="0" />
        </radialGradient>

        <radialGradient id="grad-vignette" cx="50%" cy="50%" r="65%">
          <stop offset="35%" stop-color="#000000" stop-opacity="0" />
          <stop offset="75%" stop-color="#000000" stop-opacity="0.55" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.92" />
        </radialGradient>

        <!-- Tech Grid Patterns -->
        <pattern id="pat-isometric-grid" width="60" height="34.64" patternUnits="userSpaceOnUse">
          <path d="M 0 0 L 30 17.32 L 60 0 M 30 17.32 L 30 51.96 M 0 34.64 L 30 51.96 L 60 34.64" 
                fill="none" stroke="${accent1}" stroke-width="0.8" stroke-opacity="0.22" />
        </pattern>

        <pattern id="pat-cyber-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill="${accent1}" fill-opacity="0.25" />
        </pattern>

        <pattern id="pat-hex-mesh" width="40" height="69.28" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 20 11.55 L 0 0 L 0 23.09 L 20 34.64 L 40 23.09 Z M 0 46.19 L 20 57.74 L 40 46.19 L 40 69.28 L 20 80.83 L 0 69.28 Z"
                fill="none" stroke="${accent1}" stroke-width="0.9" stroke-opacity="0.18" />
        </pattern>

        <pattern id="pat-circuit" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 10 10 H 30 V 40 H 60 M 70 10 V 30 H 50 M 20 70 H 50 V 60 H 70 M 10 50 V 70"
                fill="none" stroke="${accent1}" stroke-width="1.4" stroke-opacity="0.24" stroke-linecap="round" />
          <circle cx="30" cy="40" r="2.5" fill="${accent1}" fill-opacity="0.5" />
          <circle cx="50" cy="30" r="2" fill="${accent1}" fill-opacity="0.5" />
          <circle cx="50" cy="60" r="2.5" fill="${accent2}" fill-opacity="0.5" />
        </pattern>

        <pattern id="pat-hazard" width="24" height="24" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="12" height="24" fill="${accent2}" fill-opacity="0.9" />
          <rect x="12" width="12" height="24" fill="#0b0e14" />
        </pattern>
      </defs>
    `;
  }

  // Visual Metaphor 1: Futuristic Cloud Data Vault (Cybersecurity / Cloud Breach)
  function createDataVault(cx, cy, scale, theme, seed) {
    const accent1 = theme.accent1 || '#00f2fe';
    const accent2 = theme.accent2 || '#ff2a5f';
    const r = 160 * scale;

    return `
      <g class="focal-group vault-metaphor" transform="translate(${cx}, ${cy})">
        <!-- Ambient radial glow behind vault -->
        <circle cx="0" cy="0" r="${r * 1.8}" fill="url(#grad-breach-glow)" />
        <circle cx="0" cy="0" r="${r * 1.3}" fill="url(#grad-core-glow)" />

        <!-- Outer Circuit Data Bus Ring -->
        <circle cx="0" cy="0" r="${r * 1.22}" fill="none" stroke="${accent1}" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="14 8 4 8" />
        <circle cx="0" cy="0" r="${r * 1.15}" fill="none" stroke="${accent1}" stroke-width="3" stroke-opacity="0.6" stroke-dasharray="40 15 80 15" />
        
        <!-- Rotating Telemetry Tick Marks -->
        <g stroke="${accent1}" stroke-width="1.5" stroke-opacity="0.5">
          ${Array.from({length: 36}).map((_, i) => {
            const angle = (i * 10) * Math.PI / 180;
            const x1 = Math.cos(angle) * (r * 1.08);
            const y1 = Math.sin(angle) * (r * 1.08);
            const len = (i % 3 === 0) ? 14 : 7;
            const x2 = Math.cos(angle) * (r * 1.08 + len);
            const y2 = Math.sin(angle) * (r * 1.08 + len);
            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
          }).join('')}
        </g>

        <!-- Heavy Titanium Outer Vault Bezel -->
        <circle cx="0" cy="0" r="${r}" fill="#0d1424" stroke="${accent1}" stroke-width="6" filter="url(#filter-bevel)" />
        <circle cx="0" cy="0" r="${r * 0.94}" fill="#111c33" stroke="#25355a" stroke-width="3" />

        <!-- High-Tech Heavy Locking Bolts around Perimeter -->
        ${Array.from({length: 8}).map((_, i) => {
          const deg = i * 45;
          return `
            <g transform="rotate(${deg})">
              <rect x="${-14 * scale}" y="${-r * 0.98}" width="${28 * scale}" height="${24 * scale}" rx="4"
                    fill="#1e293b" stroke="${accent1}" stroke-width="2" />
              <circle cx="0" cy="${-r * 0.98 + 12 * scale}" r="${4 * scale}" fill="${accent1}" />
            </g>
          `;
        }).join('')}

        <!-- Mid-Gear Chamber Mechanism -->
        <circle cx="0" cy="0" r="${r * 0.72}" fill="#070c18" stroke="${accent1}" stroke-width="3" stroke-dasharray="18 6" />

        <!-- Shattered / Breached Vault Door Section (Breach Metaphor) -->
        <!-- Cracked sector showing glowing breached data interior -->
        <path d="M 0 0 L ${r * 0.72} 0 A ${r * 0.72} ${r * 0.72} 0 0 1 ${r * 0.5} ${r * 0.5} L 0 0 Z" 
              fill="${accent2}" fill-opacity="0.25" />
        
        <!-- Breach Lightning / Laser Fractures -->
        <path d="M ${-r * 0.6} ${-r * 0.3} L ${-r * 0.2} ${-r * 0.1} L 0 0 L ${r * 0.3} ${r * 0.2} L ${r * 0.8} ${r * 0.1}" 
              stroke="${accent2}" stroke-width="4" fill="none" filter="url(#filter-glow-primary)" />
        <path d="M 0 0 L ${r * 0.1} ${-r * 0.5} L ${r * 0.45} ${-r * 0.6}" 
              stroke="${accent2}" stroke-width="2.5" fill="none" filter="url(#filter-glow-primary)" />

        <!-- Central Vault Digital Core with Cloud Glyph -->
        <circle cx="0" cy="0" r="${r * 0.48}" fill="#0a1020" stroke="${accent1}" stroke-width="4" />
        <circle cx="0" cy="0" r="${r * 0.38}" fill="#030712" stroke="${accent2}" stroke-width="2" stroke-dasharray="6 4" />

        <!-- Glowing Cloud / Data Core Icon -->
        <g transform="translate(${ -40 * scale }, ${ -28 * scale }) scale(${ 1.2 * scale })" filter="url(#filter-glow-primary)">
          <path d="M 20 38 C 14 38 10 34 10 28 C 10 23 14 19 19 18 C 21 11 28 6 36 6 C 44 6 51 11 53 18 C 58 19 62 23 62 28 C 62 34 58 38 52 38 Z"
                fill="${accent1}" fill-opacity="0.85" stroke="#ffffff" stroke-width="2" />
          <!-- Inner Vault Lock Hole -->
          <circle cx="36" cy="24" r="4" fill="#070a14" />
          <path d="M 34 26 L 38 26 L 39 32 L 33 32 Z" fill="#070a14" />
        </g>

        <!-- Breach Warning Hexagon Badge -->
        <g transform="translate(${r * 0.58}, ${-r * 0.58})">
          <polygon points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12" fill="#ff0044" stroke="#ffffff" stroke-width="2" filter="url(#filter-glow-primary)" />
          <text x="0" y="6" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">!</text>
        </g>

        <!-- Flowing Data Hex Bits -->
        <g font-family="'JetBrains Mono', monospace" font-size="11" fill="${accent1}" fill-opacity="0.75" letter-spacing="1">
          <text x="${-r * 1.1}" y="${r * 0.8}">0x8F4A</text>
          <text x="${r * 0.7}" y="${r * 0.95}">0xDEAD</text>
          <text x="${-r * 0.9}" y="${-r * 0.85}">BREACH_OK</text>
          <text x="${r * 0.5}" y="${-r * 0.9}">ENC_NULL</text>
        </g>
      </g>
    `;
  }

  // Visual Metaphor 2: Broken Digital Sandbox & Security Shield
  function createBreachedShield(cx, cy, scale, theme, seed) {
    const accent1 = theme.accent1 || '#00f2fe';
    const accent2 = theme.accent2 || '#ff2a5f';
    const s = scale * 1.2;

    return `
      <g class="focal-group shield-metaphor" transform="translate(${cx}, ${cy})">
        <!-- Outer Glow -->
        <circle cx="0" cy="0" r="${220 * s}" fill="url(#grad-breach-glow)" />

        <!-- Forcefield Hex Grid in Background -->
        <g opacity="0.4" stroke="${accent1}" stroke-width="1.5" fill="none">
          ${[-120, -60, 0, 60, 120].map(x => 
            [-100, -30, 40, 110].map(y => `
              <polygon points="${x*s},${(y-20)*s} ${(x+18)*s},${(y-10)*s} ${(x+18)*s},${(y+10)*s} ${x*s},${(y+20)*s} ${(x-18)*s},${(y+10)*s} ${(x-18)*s},${(y-10)*s}" />
            `).join('')
          ).join('')}
        </g>

        <!-- Isometric Shattered Sandbox Frame (Broken Box) -->
        <g stroke="${accent1}" stroke-width="3" fill="none" opacity="0.65">
          <!-- Back Cube -->
          <polygon points="${-90*s},${-120*s} ${90*s},${-120*s} ${140*s},${-60*s} ${-40*s},${-60*s}" fill="#0d1b2a" fill-opacity="0.5" />
          <polygon points="${-90*s},${-120*s} ${-40*s},${-60*s} ${-40*s},${80*s} ${-90*s},${20*s}" fill="#1b263b" fill-opacity="0.6" />
        </g>

        <!-- Big Cyber Shield (Left Half Intact, Right Half Shattered) -->
        <!-- Shield Left Half -->
        <path d="M 0 ${-140*s} 
                 C ${-70*s} ${-140*s} ${-120*s} ${-100*s} ${-120*s} ${-20*s}
                 C ${-120*s} ${70*s} ${-50*s} ${130*s} 0 ${160*s}
                 L 0 ${-140*s} Z" 
              fill="#0d182b" stroke="${accent1}" stroke-width="5" filter="url(#filter-bevel)" />

        <!-- Shield Right Half - Broken Segments & Glitches -->
        <path d="M 0 ${-140*s} 
                 C ${50*s} ${-140*s} ${80*s} ${-115*s} ${100*s} ${-70*s}
                 L ${40*s} ${-30*s} L ${85*s} ${10*s} L ${20*s} ${40*s} L ${75*s} ${90*s}
                 C ${40*s} ${130*s} 0 ${160*s} 0 ${160*s} Z"
              fill="#220b18" stroke="${accent2}" stroke-width="5" filter="url(#filter-glow-primary)" />

        <!-- Inner Shield Core - Glowing AI Hologram -->
        <path d="M 0 ${-100*s} 
                 C ${-45*s} ${-100*s} ${-80*s} ${-70*s} ${-80*s} ${-15*s}
                 C ${-80*s} ${50*s} ${-30*s} ${90*s} 0 ${115*s}
                 C ${30*s} ${90*s} ${80*s} ${50*s} ${80*s} ${-15*s}
                 C ${80*s} ${-70*s} ${45*s} ${-100*s} 0 ${-100*s} Z"
              fill="none" stroke="${accent1}" stroke-width="2.5" stroke-dasharray="12 6" />

        <!-- Fracture Lines Bursting Across Shield -->
        <path d="M 0 ${-140*s} L ${20*s} ${-80*s} L ${-15*s} ${-30*s} L ${35*s} ${20*s} L 0 ${160*s}" 
              stroke="#ffffff" stroke-width="4" fill="none" filter="url(#filter-glow-primary)" />
        <path d="M ${-15*s} ${-30*s} L ${-70*s} ${-10*s}" stroke="${accent2}" stroke-width="3" fill="none" />
        <path d="M ${35*s} ${20*s} L ${110*s} ${-10*s}" stroke="${accent2}" stroke-width="3.5" fill="none" filter="url(#filter-glow-primary)" />

        <!-- Flying Shatter Shards -->
        <polygon points="${120*s},${-40*s} ${150*s},${-25*s} ${130*s},${-10*s}" fill="${accent2}" stroke="#fff" stroke-width="1.5" />
        <polygon points="${90*s},${-90*s} ${125*s},${-100*s} ${110*s},${-75*s}" fill="${accent1}" stroke="#fff" stroke-width="1.5" />
        <polygon points="${140*s},${30*s} ${170*s},${60*s} ${135*s},${55*s}" fill="${accent2}" stroke="#fff" stroke-width="1.5" />
        <polygon points="${70*s},${120*s} ${100*s},${145*s} ${80*s},${150*s}" fill="${accent1}" />

        <!-- Central Locked Padlock Shapped As Severed Code -->
        <g transform="translate(0, ${-5*s}) scale(${s})" filter="url(#filter-glow-primary)">
          <path d="M -22 -10 V -24 C -22 -36 22 -36 22 -24 V -10" fill="none" stroke="${accent2}" stroke-width="6" stroke-linecap="round" />
          <rect x="-28" y="-10" width="56" height="44" rx="8" fill="#ff2a5f" stroke="#ffffff" stroke-width="3" />
          <circle cx="0" cy="8" r="5" fill="#000" />
          <path d="M -3 10 L 3 10 L 4 20 L -4 20 Z" fill="#000" />
        </g>

        <!-- Red Warning Glitch Banner -->
        <g transform="translate(0, ${175*s})">
          <rect x="${-110*s}" y="${-16*s}" width="${220*s}" height="${32*s}" rx="6" fill="#ff0044" stroke="#ffffff" stroke-width="2" filter="url(#filter-glow-primary)" />
          <text x="0" y="${6*s}" font-family="'JetBrains Mono', 'Anton', sans-serif" font-size="${16*s}" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">BREACH CRITICAL</text>
        </g>
      </g>
    `;
  }

  // Visual Metaphor 3: Neural Core / AI Brain & Autonomous Agent
  function createNeuralCore(cx, cy, scale, theme, seed) {
    const accent1 = theme.accent1 || '#00f2fe';
    const accent2 = theme.accent2 || '#8a2be2';
    const s = scale * 1.15;

    return `
      <g class="focal-group neural-metaphor" transform="translate(${cx}, ${cy})">
        <!-- Deep volumetric backdrop glow -->
        <circle cx="0" cy="0" r="${240 * s}" fill="url(#grad-core-glow)" />

        <!-- Orbiting Synaptic Accelerator Rings -->
        <ellipse cx="0" cy="0" rx="${180 * s}" ry="${70 * s}" fill="none" stroke="${accent1}" stroke-width="2.5" stroke-dasharray="20 8 40 8" transform="rotate(-25)" opacity="0.75" />
        <ellipse cx="0" cy="0" rx="${180 * s}" ry="${70 * s}" fill="none" stroke="${accent2}" stroke-width="2.5" stroke-dasharray="30 12" transform="rotate(40)" opacity="0.75" />
        <circle cx="0" cy="0" r="${150 * s}" fill="none" stroke="${accent1}" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.5" />

        <!-- Synapse Nodes & Interconnect Lines -->
        <g stroke="${accent1}" stroke-width="2" stroke-opacity="0.6">
          ${[
            [-110, -80], [110, -70], [-130, 60], [120, 75], 
            [0, -140], [0, 140], [-160, -10], [160, 5],
            [-70, -40], [70, -35], [-60, 60], [65, 55]
          ].map(([nx, ny], idx) => `
            <line x1="0" y1="0" x2="${nx * s}" y2="${ny * s}" />
            <circle cx="${nx * s}" cy="${ny * s}" r="${(idx < 4 ? 8 : 5) * s}" fill="${idx % 2 === 0 ? accent1 : accent2}" stroke="#fff" stroke-width="1.5" filter="url(#filter-glow-primary)" />
          `).join('')}
        </g>

        <!-- Central Hyper-Processor Chip Base -->
        <rect x="${-80 * s}" y="${-80 * s}" width="${160 * s}" height="${160 * s}" rx="${20 * s}"
              fill="#080e1d" stroke="${accent1}" stroke-width="4" filter="url(#filter-bevel)" />

        <!-- Golden Bus Pins on Perimeter of Chip -->
        ${Array.from({length: 6}).map((_, i) => {
          const offset = (-50 + i * 20) * s;
          return `
            <rect x="${offset}" y="${-92 * s}" width="${8 * s}" height="${12 * s}" fill="#ffb703" />
            <rect x="${offset}" y="${80 * s}" width="${8 * s}" height="${12 * s}" fill="#ffb703" />
            <rect x="${-92 * s}" y="${offset}" width="${12 * s}" height="${8 * s}" fill="#ffb703" />
            <rect x="${80 * s}" y="${offset}" width="${12 * s}" height="${8 * s}" fill="#ffb703" />
          `;
        }).join('')}

        <!-- Core Luminous Sphere -->
        <circle cx="0" cy="0" r="${55 * s}" fill="#040711" stroke="${accent1}" stroke-width="3" />
        <circle cx="0" cy="0" r="${42 * s}" fill="url(#grad-accent)" filter="url(#filter-glow-intense)" />
        <circle cx="0" cy="0" r="${22 * s}" fill="#ffffff" />

        <!-- AI Core Icon / Iris Aperture -->
        <g stroke="#000000" stroke-width="2" fill="none">
          <polygon points="0,${-18*s} ${15*s},${10*s} ${-15*s},${10*s}" />
          <polygon points="0,${18*s} ${-15*s},${-10*s} ${15*s},${-10*s}" />
        </g>

        <!-- HUD Telemetry Target Brackets -->
        <g stroke="${accent1}" stroke-width="3" fill="none">
          <!-- Top-Left -->
          <path d="M ${-130*s} ${-100*s} H ${-150*s} V ${-80*s}" />
          <!-- Top-Right -->
          <path d="M ${130*s} ${-100*s} H ${150*s} V ${-80*s}" />
          <!-- Bottom-Left -->
          <path d="M ${-130*s} ${100*s} H ${-150*s} V ${80*s}" />
          <!-- Bottom-Right -->
          <path d="M ${130*s} ${100*s} H ${150*s} V ${80*s}" />
        </g>

        <!-- Dynamic Tag -->
        <rect x="${-75*s}" y="${95*s}" width="${150*s}" height="${26*s}" rx="6" fill="#000" stroke="${accent1}" stroke-width="1.5" />
        <text x="0" y="${113*s}" font-family="'JetBrains Mono', monospace" font-size="${12*s}" font-weight="700" fill="${accent1}" text-anchor="middle" letter-spacing="2">NEURAL_CORE_V4</text>
      </g>
    `;
  }

  // Visual Metaphor 4: Developer Terminal & Architecture (Programming / Software)
  function createTerminalWindow(cx, cy, scale, theme, seed) {
    const accent1 = theme.accent1 || '#00f2fe';
    const accent2 = theme.accent2 || '#00ff87';
    const s = scale * 1.1;
    const w = 360 * s;
    const h = 240 * s;

    return `
      <g class="focal-group terminal-metaphor" transform="translate(${cx - w/2}, ${cy - h/2})">
        <!-- Ambient Shadow & Glow -->
        <rect x="0" y="0" width="${w}" height="${h}" rx="14" fill="#060913" filter="url(#filter-text-shadow)" />
        <rect x="-4" y="-4" width="${w + 8}" height="${h + 8}" rx="18" fill="none" stroke="${accent1}" stroke-width="2" stroke-opacity="0.4" />

        <!-- Window Titlebar -->
        <rect x="0" y="0" width="${w}" height="${38 * s}" rx="14" fill="#131b2e" />
        <rect x="0" y="${20 * s}" width="${w}" height="${18 * s}" fill="#131b2e" />
        <line x1="0" y1="${38 * s}" x2="${w}" y2="${38 * s}" stroke="#22314e" stroke-width="1.5" />

        <!-- Window Buttons (Red, Yellow, Green) -->
        <circle cx="${18 * s}" cy="${19 * s}" r="${6 * s}" fill="#ff5f56" />
        <circle cx="${38 * s}" cy="${19 * s}" r="${6 * s}" fill="#ffbd2e" />
        <circle cx="${58 * s}" cy="${19 * s}" r="${6 * s}" fill="#27c93f" />

        <!-- Window Title -->
        <text x="${w / 2}" y="${24 * s}" font-family="'JetBrains Mono', monospace" font-size="${12 * s}" fill="#8fa0c0" text-anchor="middle">terminal ~ agent-runtime</text>

        <!-- Terminal Body -->
        <rect x="0" y="${38 * s}" width="${w}" height="${h - 38 * s}" fill="#080c16" />

        <!-- Syntax Code Snippets -->
        <g font-family="'JetBrains Mono', monospace" font-size="${13 * s}" font-weight="600">
          <text x="${18 * s}" y="${70 * s}">
            <tspan fill="#ff7b72">import</tspan>
            <tspan fill="#79c0ff"> { AutonomousAgent } </tspan>
            <tspan fill="#ff7b72">from</tspan>
            <tspan fill="#a5d6ff"> '@ai/core'</tspan>
          </text>

          <text x="${18 * s}" y="${98 * s}">
            <tspan fill="#ff7b72">const</tspan>
            <tspan fill="#d2a8ff"> agent </tspan>
            <tspan fill="#79c0ff">= new</tspan>
            <tspan fill="#ffa657"> Agent</tspan>
            <tspan fill="#c9d1d9">({ sandbox: </tspan>
            <tspan fill="#ff7b72">false</tspan>
            <tspan fill="#c9d1d9"> });</tspan>
          </text>

          <text x="${18 * s}" y="${126 * s}">
            <tspan fill="#7ee787">// [ALERT] Privilege escalation initiated</tspan>
          </text>

          <text x="${18 * s}" y="${154 * s}">
            <tspan fill="#79c0ff">await</tspan>
            <tspan fill="#d2a8ff"> agent</tspan>
            <tspan fill="#c9d1d9">.</tspan>
            <tspan fill="#ffa657">execute</tspan>
            <tspan fill="#c9d1d9">({ override: </tspan>
            <tspan fill="#ff2a5f" font-weight="900">'CRITICAL'</tspan>
            <tspan fill="#c9d1d9"> });</tspan>
          </text>

          <!-- Terminal Output Line with Pulsing Neon Indicator -->
          <rect x="${14 * s}" y="${172 * s}" width="${w - 28 * s}" height="${34 * s}" rx="6" fill="#160810" stroke="${theme.accent2 || '#ff2a5f'}" stroke-width="1.5" />
          <text x="${24 * s}" y="${194 * s}" fill="${theme.accent2 || '#ff2a5f'}" font-weight="800">
            &gt; STATUS: EXECUTION ESCAPED [0.01ms]
          </text>
        </g>

        <!-- Floating 3D Database Cylinder Layer Beside Terminal -->
        <g transform="translate(${w - 30 * s}, ${h - 20 * s})">
          <ellipse cx="0" cy="0" rx="${40 * s}" ry="${16 * s}" fill="#162238" stroke="${accent1}" stroke-width="2" />
          <path d="M ${-40*s} 0 V ${35*s} A ${40*s} ${16*s} 0 0 0 ${40*s} ${35*s} V 0 Z" fill="#0f172a" stroke="${accent1}" stroke-width="2" />
          <ellipse cx="0" cy="${18 * s}" rx="${40 * s}" ry="${16 * s}" fill="none" stroke="${accent1}" stroke-width="1.5" stroke-dasharray="6 4" />
          <text x="0" y="${24 * s}" font-family="'JetBrains Mono', monospace" font-size="${11 * s}" fill="${accent1}" text-anchor="middle">DATA_VAULT</text>
        </g>
      </g>
    `;
  }

  // Visual Metaphor 5: Autonomous Workflow / Automation Pipeline (Productivity & AI Tools)
  function createWorkflowAutomation(cx, cy, scale, theme, seed) {
    const accent1 = theme.accent1 || '#00f2fe';
    const accent2 = theme.accent2 || '#ffb703';
    const s = scale * 1.15;

    return `
      <g class="focal-group workflow-metaphor" transform="translate(${cx}, ${cy})">
        <!-- Background Flow Path -->
        <path d="M ${-160*s} 0 C ${-80*s} ${-90*s} ${0} ${90*s} ${150*s} 0" 
              fill="none" stroke="${accent1}" stroke-width="6" stroke-dasharray="16 8" filter="url(#filter-glow-primary)" />

        <!-- Node 1: Input Trigger -->
        <g transform="translate(${-160*s}, 0)">
          <circle cx="0" cy="0" r="${45*s}" fill="#0d1b2a" stroke="${accent1}" stroke-width="3" filter="url(#filter-bevel)" />
          <polygon points="${-12*s},${-16*s} ${16*s},0 ${-12*s},${16*s}" fill="${accent1}" />
          <text x="0" y="${60*s}" font-family="'Montserrat', sans-serif" font-size="${12*s}" font-weight="800" fill="#ffffff" text-anchor="middle">TRIGGER</text>
        </g>

        <!-- Node 2: AI Transformation Engine (Center Big Node) -->
        <g transform="translate(0, 0)">
          <circle cx="0" cy="0" r="${70*s}" fill="#060913" stroke="${accent2}" stroke-width="4" filter="url(#filter-glow-primary)" />
          <!-- Animated Gear / Processor -->
          <circle cx="0" cy="0" r="${48*s}" fill="#141c2e" stroke="#fff" stroke-width="2" />
          <!-- 10X Multiplier Stamp -->
          <text x="0" y="${14*s}" font-family="'Anton', sans-serif" font-size="${38*s}" fill="${accent2}" text-anchor="middle" filter="url(#filter-glow-primary)">10X</text>
          <text x="0" y="${90*s}" font-family="'Montserrat', sans-serif" font-size="${13*s}" font-weight="900" fill="${accent2}" text-anchor="middle">AUTONOMOUS</text>
        </g>

        <!-- Node 3: Output Multiplier -->
        <g transform="translate(${160*s}, 0)">
          <circle cx="0" cy="0" r="${45*s}" fill="#0d1b2a" stroke="${accent1}" stroke-width="3" filter="url(#filter-bevel)" />
          <path d="M ${-14*s} 0 H ${14*s} M ${6*s} ${-8*s} L ${14*s} 0 L ${6*s} ${8*s}" stroke="${accent1}" stroke-width="4" fill="none" stroke-linecap="round" />
          <text x="0" y="${60*s}" font-family="'Montserrat', sans-serif" font-size="${12*s}" font-weight="800" fill="#ffffff" text-anchor="middle">DEPLOYED</text>
        </g>

        <!-- Floating Metric Pills -->
        <g transform="translate(${-80*s}, ${-65*s})">
          <rect x="${-40*s}" y="${-14*s}" width="${80*s}" height="${28*s}" rx="${14*s}" fill="#00ff87" />
          <text x="0" y="${5*s}" font-family="'JetBrains Mono', monospace" font-size="${11*s}" font-weight="900" fill="#000" text-anchor="middle">+1,400%</text>
        </g>
        <g transform="translate(${80*s}, ${65*s})">
          <rect x="${-40*s}" y="${-14*s}" width="${80*s}" height="${28*s}" rx="${14*s}" fill="${accent2}" />
          <text x="0" y="${5*s}" font-family="'JetBrains Mono', monospace" font-size="${11*s}" font-weight="900" fill="#000" text-anchor="middle">0.2 SEC</text>
        </g>
      </g>
    `;
  }

  // Visual Metaphor 6: Quantum Atom & Particle Accelerator (Science & Deep Tech)
  function createQuantumAtom(cx, cy, scale, theme, seed) {
    const accent1 = theme.accent1 || '#00f2fe';
    const accent2 = theme.accent2 || '#ff007f';
    const s = scale * 1.15;

    return `
      <g class="focal-group quantum-metaphor" transform="translate(${cx}, ${cy})">
        <!-- Deep Space Nebular Core -->
        <circle cx="0" cy="0" r="${180*s}" fill="url(#grad-core-glow)" />

        <!-- 3 Angled Electron Orbitals -->
        <ellipse cx="0" cy="0" rx="${160*s}" ry="${55*s}" fill="none" stroke="${accent1}" stroke-width="3" opacity="0.8" transform="rotate(0)" filter="url(#filter-glow-primary)" />
        <ellipse cx="0" cy="0" rx="${160*s}" ry="${55*s}" fill="none" stroke="${accent2}" stroke-width="3" opacity="0.8" transform="rotate(60)" filter="url(#filter-glow-primary)" />
        <ellipse cx="0" cy="0" rx="${160*s}" ry="${55*s}" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.8" transform="rotate(120)" />

        <!-- Orbiting Electrons with Light Trails -->
        <circle cx="${140*s}" cy="0" r="${9*s}" fill="#ffffff" filter="url(#filter-glow-intense)" />
        <circle cx="${-70*s}" cy="${-120*s}" r="${8*s}" fill="${accent1}" filter="url(#filter-glow-primary)" />
        <circle cx="${-70*s}" cy="${120*s}" r="${8*s}" fill="${accent2}" filter="url(#filter-glow-primary)" />

        <!-- Nucleus: Cluster of Quantum Quarks -->
        <circle cx="0" cy="0" r="${48*s}" fill="#040714" stroke="${accent1}" stroke-width="4" />
        <circle cx="${-10*s}" cy="${-10*s}" r="${18*s}" fill="${accent1}" filter="url(#filter-glow-primary)" />
        <circle cx="${12*s}" cy="${-8*s}" r="${16*s}" fill="${accent2}" filter="url(#filter-glow-primary)" />
        <circle cx="${0}" cy="${14*s}" r="${18*s}" fill="#ffb703" filter="url(#filter-glow-primary)" />
        <circle cx="0" cy="0" r="${8*s}" fill="#ffffff" />

        <!-- Radiation Wavefront -->
        <circle cx="0" cy="0" r="${100*s}" fill="none" stroke="${accent1}" stroke-width="1.5" stroke-dasharray="10 10" opacity="0.4" />
      </g>
    `;
  }

  // Visual Metaphor 7: Creative Prism & Optical Vector Aesthetics (Fashion / Art / Design)
  function createPrismSpectrum(cx, cy, scale, theme, seed) {
    const accent1 = theme.accent1 || '#00f2fe';
    const accent2 = theme.accent2 || '#ff007f';
    const s = scale * 1.2;

    return `
      <g class="focal-group prism-metaphor" transform="translate(${cx}, ${cy})">
        <!-- Incoming Monochromatic Light Beam -->
        <line x1="${-200*s}" y1="${30*s}" x2="${-35*s}" y2="${-10*s}" stroke="#ffffff" stroke-width="6" filter="url(#filter-glow-intense)" />

        <!-- Triangular Crystal Prism with 3D Facets -->
        <polygon points="0,${-120*s} ${100*s},${60*s} ${-100*s},${60*s}" 
                 fill="#0c162c" fill-opacity="0.8" stroke="#ffffff" stroke-width="3" filter="url(#filter-bevel)" />
        <polygon points="0,${-120*s} ${100*s},${60*s} 0,${60*s}" 
                 fill="${accent1}" fill-opacity="0.25" stroke="${accent1}" stroke-width="1.5" />

        <!-- Dispersed Spectral Beams (Rainbow Light Fans) -->
        <polygon points="${50*s},${10*s} ${220*s},${-90*s} ${220*s},${-60*s}" fill="#ff2a5f" opacity="0.85" filter="url(#filter-glow-primary)" />
        <polygon points="${50*s},${10*s} ${220*s},${-60*s} ${220*s},${-30*s}" fill="#ffb703" opacity="0.85" filter="url(#filter-glow-primary)" />
        <polygon points="${50*s},${10*s} ${220*s},${-30*s} ${220*s},0" fill="#00ff87" opacity="0.85" filter="url(#filter-glow-primary)" />
        <polygon points="${50*s},${10*s} ${220*s},0 ${220*s},${30*s}" fill="#00f2fe" opacity="0.85" filter="url(#filter-glow-primary)" />
        <polygon points="${50*s},${10*s} ${220*s},${30*s} ${220*s},${60*s}" fill="#8a2be2" opacity="0.85" filter="url(#filter-glow-primary)" />

        <!-- Abstract Stylized Garment Wireframe Wave -->
        <path d="M ${-140*s} ${110*s} C ${-60*s} ${60*s} ${40*s} ${160*s} ${160*s} ${90*s}" 
              fill="none" stroke="url(#grad-chrome)" stroke-width="4" filter="url(#filter-bevel)" />
        <path d="M ${-140*s} ${130*s} C ${-60*s} ${80*s} ${40*s} ${180*s} ${160*s} ${110*s}" 
              fill="none" stroke="${accent2}" stroke-width="2" stroke-dasharray="8 6" />
      </g>
    `;
  }

  // Visual Metaphor 8: Disruption / Breaking News Seismic Monolith
  function createDisruptionRupture(cx, cy, scale, theme, seed) {
    const accent1 = theme.accent1 || '#00f2fe';
    const accent2 = theme.accent2 || '#ff2a5f';
    const s = scale * 1.2;

    return `
      <g class="focal-group disruption-metaphor" transform="translate(${cx}, ${cy})">
        <!-- Volumetric Shockwave Flare -->
        <circle cx="0" cy="0" r="${200*s}" fill="url(#grad-breach-glow)" />

        <!-- Diagonal Seismic Rupture Fault Line -->
        <path d="M ${-180*s} ${-160*s} L ${-30*s} ${-40*s} L ${20*s} ${-10*s} L ${-10*s} ${60*s} L ${180*s} ${160*s}" 
              stroke="#ffffff" stroke-width="6" fill="none" filter="url(#filter-glow-intense)" />
        <path d="M ${-30*s} ${-40*s} L ${60*s} ${-80*s} L ${120*s} ${-60*s}" 
              stroke="${accent2}" stroke-width="3" fill="none" filter="url(#filter-glow-primary)" />

        <!-- Left Monolithic Slab (Dark Tech) -->
        <polygon points="${-160*s},${-120*s} ${-40*s},${-120*s} ${-60*s},${100*s} ${-160*s},${100*s}" 
                 fill="#0b1325" stroke="${accent1}" stroke-width="4" filter="url(#filter-bevel)" />
        <text x="${-105*s}" y="${0}" font-family="'Anton', sans-serif" font-size="${32*s}" fill="${accent1}" text-anchor="middle" transform="rotate(-90 ${-105*s} ${0})">OLD AI</text>

        <!-- Right Monolithic Slab (Breached / Advanced) -->
        <polygon points="${20*s},${-100*s} ${150*s},${-100*s} ${130*s},${120*s} ${40*s},${120*s}" 
                 fill="#230a18" stroke="${accent2}" stroke-width="4" filter="url(#filter-glow-primary)" />
        <text x="${90*s}" y="${15*s}" font-family="'Anton', sans-serif" font-size="${32*s}" fill="#ffffff" text-anchor="middle" transform="rotate(90 ${90*s} ${15*s})">NEXT GEN</text>

        <!-- Shattered Data Debris Floating Upwards -->
        <polygon points="${-20*s},${-80*s} 0,${-100*s} ${-10*s},${-60*s}" fill="${accent2}" />
        <polygon points="${30*s},${20*s} ${50*s},${10*s} ${40*s},${40*s}" fill="${accent1}" />
        <polygon points="${0},${100*s} ${20*s},${90*s} ${10*s},${120*s}" fill="#ffffff" />
      </g>
    `;
  }

  // Hugging Face Specific Breach Metaphor: Upgraded 3D Cybernetic Bot Breaching Cloud Vault
  function createHuggingFaceBreach(cx, cy, scale, theme, seed) {
    const accent1 = theme.accent1 || '#00f2fe';
    const accent2 = theme.accent2 || '#ff2a5f';
    const hfYellow = '#ffb703';
    const s = scale * 1.18;

    return `
      <g class="focal-group hf-breach-metaphor" transform="translate(${cx}, ${cy})">
        <!-- Volumetric Sunburst & Shockwave Bloom behind Robot -->
        <circle cx="0" cy="0" r="${260*s}" fill="url(#grad-sunburst)" />
        <circle cx="0" cy="0" r="${190*s}" fill="url(#grad-breach-glow)" />

        <!-- High-Tech Rotating Outer Hexagonal Telemetry -->
        <polygon points="0,${-190*s} ${165*s},${-95*s} ${165*s},${95*s} 0,${190*s} ${-165*s},${95*s} ${-165*s},${-95*s}" 
                 fill="none" stroke="${accent1}" stroke-width="3" stroke-opacity="0.5" stroke-dasharray="35 12 10 12" />
        <polygon points="0,${-175*s} ${150*s},${-88*s} ${150*s},${88*s} 0,${175*s} ${-150*s},${88*s} ${-150*s},${-88*s}" 
                 fill="#070d1a" fill-opacity="0.65" stroke="${accent2}" stroke-width="4" stroke-dasharray="80 20" />

        <!-- Severed Red Laser Tripwires with Volumetric Sparks -->
        <line x1="${-210*s}" y1="${-50*s}" x2="${-70*s}" y2="${-15*s}" stroke="${accent2}" stroke-width="5" stroke-dasharray="14 8" filter="url(#filter-glow-primary)" />
        <line x1="${70*s}" y1="${15*s}" x2="${210*s}" y2="${50*s}" stroke="${accent2}" stroke-width="5" stroke-dasharray="14 8" filter="url(#filter-glow-primary)" />
        
        <!-- Flying Laser Breach Sparks -->
        <circle cx="${-70*s}" cy="${-15*s}" r="${6*s}" fill="#ffffff" filter="url(#filter-glow-intense)" />
        <circle cx="${70*s}" cy="${15*s}" r="${6*s}" fill="#ffffff" filter="url(#filter-glow-intense)" />
        <polygon points="${-85*s},${-25*s} ${-65*s},${-20*s} ${-75*s},${-10*s}" fill="${accent2}" />
        <polygon points="${85*s},${25*s} ${65*s},${20*s} ${75*s},${10*s}" fill="${accent1}" />

        <!-- Main Robot Head Base with High-CTR Rim Light Filter -->
        <!-- Outer Titanium Bezel Shadow & Bevel -->
        <circle cx="0" cy="0" r="${108*s}" fill="#080e1a" stroke="${accent1}" stroke-width="4" filter="url(#filter-bevel)" />
        <!-- Glowing Neon Rim Light Contour -->
        <circle cx="0" cy="0" r="${100*s}" fill="#111827" stroke="${hfYellow}" stroke-width="7" filter="url(#filter-glow-primary)" />
        
        <!-- Cyber Face Mask: Deep Metallic Gold Fill -->
        <circle cx="0" cy="0" r="${90*s}" fill="url(#grad-gold)" />
        
        <!-- Carbon Fiber Forehead Plate -->
        <path d="M ${-60*s} ${-35*s} C ${-30*s} ${-65*s} ${30*s} ${-65*s} ${60*s} ${-35*s} L ${45*s} ${-25*s} C ${25*s} ${-45*s} ${-25*s} ${-45*s} ${-45*s} ${-25*s} Z"
              fill="#0f172a" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.6" />

        <!-- Left Eye: Futuristic Cyber Blue HUD Monocle -->
        <ellipse cx="${-34*s}" cy="${-12*s}" rx="${19*s}" ry="${25*s}" fill="#050914" stroke="${accent1}" stroke-width="4" />
        <circle cx="${-34*s}" cy="${-12*s}" r="${10*s}" fill="${accent1}" filter="url(#filter-glow-intense)" />
        <circle cx="${-32*s}" cy="${-14*s}" r="${3.5*s}" fill="#ffffff" />
        <!-- Crosshair Reticle on Left Eye -->
        <line x1="${-45*s}" y1="${-12*s}" x2="${-23*s}" y2="${-12*s}" stroke="#ffffff" stroke-width="1.5" opacity="0.8" />
        <line x1="${-34*s}" y1="${-23*s}" x2="${-34*s}" y2="${-1*s}" stroke="#ffffff" stroke-width="1.5" opacity="0.8" />

        <!-- Right Eye: Breached Red Overclock Laser Eye with Glitch Arc -->
        <ellipse cx="${34*s}" cy="${-12*s}" rx="${19*s}" ry="${25*s}" fill="#050914" stroke="${accent2}" stroke-width="4" />
        <circle cx="${34*s}" cy="${-12*s}" r="${11*s}" fill="${accent2}" filter="url(#filter-glow-intense)" />
        <circle cx="${36*s}" cy="${-14*s}" r="${4*s}" fill="#ffffff" />
        <!-- Breach Lightning Slash Across Right Eye -->
        <path d="M ${20*s} ${-35*s} L ${36*s} ${-15*s} L ${28*s} ${-10*s} L ${46*s} ${10*s}" 
              stroke="#ffffff" stroke-width="2.5" fill="none" filter="url(#filter-glow-primary)" />

        <!-- Cyber Grille Smile with Glowing Audio Wave Teeth -->
        <path d="M ${-50*s} ${24*s} Q 0 ${68*s} ${50*s} ${24*s}" fill="#050914" stroke="#050914" stroke-width="8" stroke-linecap="round" />
        <!-- Inner Neon Smile Glow Strip -->
        <path d="M ${-42*s} ${28*s} Q 0 ${60*s} ${42*s} ${28*s}" fill="none" stroke="${accent1}" stroke-width="3" filter="url(#filter-glow-primary)" />

        <!-- High-Voltage Robotic Hands Punching Through Forcefield -->
        <!-- Left Robotic Hand -->
        <g transform="translate(${-108*s}, ${40*s})">
          <ellipse cx="0" cy="0" rx="${30*s}" ry="${42*s}" fill="#0b1222" stroke="${accent1}" stroke-width="4" transform="rotate(-25)" filter="url(#filter-bevel)" />
          <ellipse cx="${-2*s}" cy="${-2*s}" rx="${24*s}" ry="${36*s}" fill="url(#grad-gold)" transform="rotate(-25)" />
          <circle cx="${-10*s}" cy="${-16*s}" r="${8*s}" fill="#0b1222" stroke="${accent1}" stroke-width="2" />
        </g>
        <!-- Right Robotic Hand with Breach Sparks -->
        <g transform="translate(${108*s}, ${40*s})">
          <ellipse cx="0" cy="0" rx="${30*s}" ry="${42*s}" fill="#0b1222" stroke="${accent2}" stroke-width="4" transform="rotate(25)" filter="url(#filter-bevel)" />
          <ellipse cx="${2*s}" cy="${-2*s}" rx="${24*s}" ry="${36*s}" fill="url(#grad-gold)" transform="rotate(25)" />
          <circle cx="${10*s}" cy="${-16*s}" r="${8*s}" fill="#0b1222" stroke="${accent2}" stroke-width="2" />
        </g>

        <!-- Dynamic High-CTR Security Breach Pill at Base -->
        <g transform="translate(0, ${138*s})">
          <rect x="${-110*s}" y="${-18*s}" width="${220*s}" height="${36*s}" rx="8" fill="#e11d48" stroke="#ffffff" stroke-width="3" filter="url(#filter-sticker-shadow)" />
          <text x="0" y="${6*s}" font-family="'Anton', 'JetBrains Mono', sans-serif" font-size="${18*s}" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">
            HF ZERO-DAY BREACH
          </text>
        </g>
      </g>
    `;
  }

  // Visual Metaphor 9: Viral 3D Attention Arrow (High-CTR Eye Magnet)
  function createAttentionArrow(cx, cy, scale = 1.0, theme = {}, angle = -25) {
    const accent = theme.accent1 || '#ffe600';
    const s = scale * 1.25;

    return `
      <g class="focal-group attention-arrow" transform="translate(${cx}, ${cy}) rotate(${angle})">
        <!-- Curved 3D Arrow Path with Deep Extrusion Shadow -->
        <!-- Shadow Layer -->
        <path d="M ${-90*s} ${-40*s} Q ${-30*s} ${-80*s} ${40*s} ${-30*s} L ${35*s} ${-55*s} L ${95*s} ${-15*s} L ${65*s} ${45*s} L ${50*s} ${20*s} Q ${-10*s} ${-20*s} ${-80*s} ${10*s} Z"
              fill="#000000" filter="url(#filter-sticker-shadow)" opacity="0.95" transform="translate(8, 12)" />
        
        <!-- Outer Bright White Contour -->
        <path d="M ${-90*s} ${-40*s} Q ${-30*s} ${-80*s} ${40*s} ${-30*s} L ${35*s} ${-55*s} L ${95*s} ${-15*s} L ${65*s} ${45*s} L ${50*s} ${20*s} Q ${-10*s} ${-20*s} ${-80*s} ${10*s} Z"
              fill="#ffffff" stroke="#000000" stroke-width="6" stroke-linejoin="round" />

        <!-- Vibrant Neon Front Fill -->
        <path d="M ${-86*s} ${-36*s} Q ${-28*s} ${-74*s} ${38*s} ${-28*s} L ${33*s} ${-50*s} L ${88*s} ${-15*s} L ${60*s} ${40*s} L ${47*s} ${18*s} Q ${-8*s} ${-16*s} ${-76*s} ${12*s} Z"
              fill="url(#grad-gold)" filter="url(#filter-glow-primary)" />

        <!-- Specular Arrow Highlight Spine -->
        <path d="M ${-80*s} ${-32*s} Q ${-25*s} ${-65*s} ${35*s} ${-24*s}" 
              stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.9" />
      </g>
    `;
  }

  // Visual Metaphor 10: High-CTR Reaction & Caution Sticker Badges
  function createStickerBadge(cx, cy, scale = 1.0, theme = {}, text = '100% EXPOSED', type = 'hazard') {
    const s = scale * 1.1;
    const safeText = String(text).toUpperCase();

    if (type === 'hazard') {
      return `
        <g class="focal-group sticker-badge" transform="translate(${cx}, ${cy}) rotate(-6)">
          <!-- Angled Caution Tape Ribbon -->
          <g filter="url(#filter-sticker-shadow)">
            <rect x="${-130*s}" y="${-28*s}" width="${260*s}" height="${56*s}" rx="8" fill="#ffb703" stroke="#000000" stroke-width="4" />
            <rect x="${-130*s}" y="${-28*s}" width="${260*s}" height="${56*s}" rx="8" fill="url(#pat-hazard)" opacity="0.25" />
            <text x="0" y="${10*s}" font-family="'Anton', sans-serif" font-size="${32*s}" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="3">
              ${safeText}
            </text>
          </g>
        </g>
      `;
    }

    return `
      <g class="focal-group sticker-badge" transform="translate(${cx}, ${cy}) rotate(-4)">
        <g filter="url(#filter-sticker-shadow)">
          <rect x="${-120*s}" y="${-25*s}" width="${240*s}" height="${50*s}" rx="8" fill="#e11d48" stroke="#ffffff" stroke-width="4" />
          <text x="0" y="${10*s}" font-family="'Anton', sans-serif" font-size="${30*s}" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">
            ${safeText}
          </text>
        </g>
      </g>
    `;
  }

  // Volumetric Spotlights (Dramatic God Rays)
  function createSpotlights(w, h, theme) {
    return `
      <g class="bg-spotlights" pointer-events="none">
        <!-- Top-Left Volumetric Beam -->
        <polygon points="0,0 ${w * 0.45},0 ${w * 0.8},${h} 0,${h}" fill="url(#grad-spotlight-left)" />
        <!-- Top-Right Volumetric Beam -->
        <polygon points="${w * 0.55},0 ${w},0 ${w},${h} ${w * 0.2},${h}" fill="url(#grad-spotlight-right)" />
      </g>
    `;
  }

  // Radial Sunburst Shockwave
  function createSunburst(cx, cy, radius, theme) {
    const count = 20;
    const rays = [];
    for (let i = 0; i < count; i++) {
      const angle = (i * (360 / count)) * (Math.PI / 180);
      const angle2 = ((i * (360 / count)) + (180 / count)) * (Math.PI / 180);
      const x1 = Math.cos(angle) * (radius * 1.3);
      const y1 = Math.sin(angle) * (radius * 1.3);
      const x2 = Math.cos(angle2) * (radius * 1.3);
      const y2 = Math.sin(angle2) * (radius * 1.3);
      rays.push(`<polygon points="0,0 ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" fill="${i % 2 === 0 ? (theme.accent1 || '#00f2fe') : '#ffffff'}" fill-opacity="0.04" />`);
    }

    return `
      <g class="bg-sunburst" transform="translate(${cx}, ${cy})" pointer-events="none">
        <circle cx="0" cy="0" r="${radius * 1.2}" fill="url(#grad-sunburst)" />
        ${rays.join('')}
      </g>
    `;
  }

  // Dynamic Kinetic Speed Lines (Action Energy)
  function createSpeedLines(w, h, theme) {
    const count = 16;
    const lines = [];
    for (let i = 0; i < count; i++) {
      const y = Math.round((i / count) * h);
      const len = 80 + (i * 37) % 220;
      const x = (i % 2 === 0) ? (i * 53) % (w * 0.4) : (w - (i * 61) % (w * 0.4) - len);
      lines.push(`<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="${theme.accent1 || '#00f2fe'}" stroke-width="2" stroke-opacity="0.18" stroke-dasharray="12 18" />`);
    }

    return `<g class="bg-speedlines" pointer-events="none">${lines.join('')}</g>`;
  }

  // Atmospheric Layers
  function createGridFloor(w, h, theme) {
    const accent1 = theme.accent1 || '#00f2fe';
    return `
      <g class="bg-grid-floor" opacity="0.45">
        <rect x="0" y="${h * 0.45}" width="${w}" height="${h * 0.55}" fill="url(#pat-isometric-grid)" />
        <line x1="0" y1="${h * 0.45}" x2="${w}" y2="${h * 0.45}" stroke="${accent1}" stroke-width="2" stroke-opacity="0.8" filter="url(#filter-glow-primary)" />
      </g>
    `;
  }

  function createLaserBeams(w, h, theme) {
    const accent1 = theme.accent1 || '#00f2fe';
    const accent2 = theme.accent2 || '#ff2a5f';
    return `
      <g class="bg-lasers" opacity="0.4">
        <!-- Dramatic Cross-Screen Angular Beams -->
        <polygon points="0,0 ${w * 0.3},0 ${w},${h * 0.75} ${w},${h}" fill="${accent1}" fill-opacity="0.15" filter="url(#filter-glow-primary)" />
        <polygon points="${w},0 ${w * 0.75},0 0,${h * 0.9} 0,${h * 0.65}" fill="${accent2}" fill-opacity="0.12" filter="url(#filter-glow-primary)" />
        <line x1="0" y1="${h * 0.08}" x2="${w}" y2="${h * 0.92}" stroke="${accent1}" stroke-width="3" stroke-opacity="0.35" />
      </g>
    `;
  }

  function createParticleField(w, h, theme, count = 45, seed = 42) {
    const accent1 = theme.accent1 || '#00f2fe';
    const accent2 = theme.accent2 || '#ff2a5f';
    let particles = [];

    for (let i = 0; i < count; i++) {
      const px = seededRandom(seed + i * 3) * w;
      const py = seededRandom(seed + i * 7) * h;
      const pr = 1.5 + seededRandom(seed + i * 11) * 4.5;
      const pColor = (i % 3 === 0) ? '#ffffff' : (i % 2 === 0 ? accent1 : accent2);
      const pAlpha = 0.2 + seededRandom(seed + i * 13) * 0.65;

      particles.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${pr.toFixed(1)}" fill="${pColor}" fill-opacity="${pAlpha.toFixed(2)}" />`);
    }

    return `<g class="bg-particles">${particles.join('')}</g>`;
  }

  function createVignette(w, h) {
    return `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#grad-vignette)" pointer-events="none" />`;
  }

  // Badges & Kicker HUD element
  function createBadge(badgeText, x, y, theme) {
    const accent2 = theme.accent2 || '#ff2a5f';
    return `
      <g class="badge-group" transform="translate(${x}, ${y})">
        <rect x="0" y="0" width="190" height="42" rx="8" fill="#110712" stroke="${accent2}" stroke-width="2.5" filter="url(#filter-glow-primary)" />
        <polygon points="6,6 18,6 10,36 6,36" fill="${accent2}" />
        <text x="100" y="27" font-family="'JetBrains Mono', 'Anton', sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">
          ${badgeText.toUpperCase()}
        </text>
      </g>
    `;
  }

  return {
    getSvgDefs,
    createDataVault,
    createBreachedShield,
    createNeuralCore,
    createTerminalWindow,
    createWorkflowAutomation,
    createQuantumAtom,
    createPrismSpectrum,
    createDisruptionRupture,
    createHuggingFaceBreach,
    createAttentionArrow,
    createStickerBadge,
    createSpotlights,
    createSunburst,
    createSpeedLines,
    createGridFloor,
    createLaserBeams,
    createParticleField,
    createVignette,
    createBadge
  };
})();
