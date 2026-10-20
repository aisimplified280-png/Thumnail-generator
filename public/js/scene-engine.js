// AI SIMPLIFIED LAB - SCENE ENGINE (V2 - Hardened & Resilient)
// State manager and renderer for modular SVG thumbnail layers.
// Supports multi-aspect ratio reflow, full layer persistence, undo/redo inflation, and strict XML/HTML escaping.

window.SceneEngine = (function() {
  'use strict';

  // Dimension presets
  const FORMATS = {
    '16:9': { id: '16:9', name: 'YouTube Landscape', width: 1280, height: 720 },
    '9:16': { id: '9:16', name: 'YouTube Shorts', width: 1080, height: 1920 },
    '1:1': { id: '1:1', name: 'Square', width: 1080, height: 1080 }
  };

  // Safe XML / SVG string escaping
  function escapeXml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  class Engine {
    constructor() {
      this.currentFormat = '16:9';
      this.width = 1280;
      this.height = 720;
      this.theme = {
        bgDark: '#060a14',
        bgMid: '#0e172a',
        accent1: '#00f2fe',
        accent2: '#ff2a5f',
        textLight: '#ffffff',
        textAccent: '#ff2a5f'
      };
      this.layers = [];
      this.selectedLayerId = null;
      this.showSafeGuides = false;
      this.showGrid = false;
      this.spec = null;
    }

    setFormat(formatId) {
      if (!FORMATS[formatId]) return;
      this.currentFormat = formatId;
      this.width = FORMATS[formatId].width;
      this.height = FORMATS[formatId].height;
      this.reflowLayers();
    }

    // Attach standard render function based on layer type
    attachRenderer(layer) {
      if (layer.type === 'background') {
        if (layer.id === 'bg-grid') {
          layer.render = () => SceneLibrary.createGridFloor(this.width, this.height, this.theme);
        } else if (layer.id === 'bg-spotlights') {
          layer.render = () => SceneLibrary.createSpotlights(this.width, this.height, this.theme);
        } else {
          layer.render = () => `
            <rect x="0" y="0" width="${this.width}" height="${this.height}" fill="url(#grad-bg-ambient)" />
            <rect x="0" y="0" width="${this.width}" height="${this.height}" fill="url(#pat-cyber-dots)" opacity="0.18" />
          `;
        }
      } else if (layer.type === 'ambient') {
        if (layer.id === 'bg-lasers') {
          layer.render = () => SceneLibrary.createLaserBeams(this.width, this.height, this.theme);
        } else if (layer.id === 'bg-particles') {
          layer.render = () => SceneLibrary.createParticleField(this.width, this.height, this.theme, this.spec?.effects?.particleDensity || 50, this.spec?.seed || 1);
        } else if (layer.id === 'bg-speedlines') {
          layer.render = () => SceneLibrary.createSpeedLines(this.width, this.height, this.theme);
        } else if (layer.id === 'bg-sunburst') {
          const fx = layer.x || Math.round(this.width * 0.72);
          const fy = layer.y || Math.round(this.height * 0.5);
          layer.render = () => SceneLibrary.createSunburst(fx, fy, Math.round(this.width * 0.35), this.theme);
        }
      } else if (layer.type === 'graphic') {
        layer.render = (l) => this.renderFocalMetaphor(l);
      } else if (layer.type === 'badge') {
        layer.render = (l) => {
          const safeText = escapeXml((l.text || '').toUpperCase());
          if (l.badgeStyle === 'hazard') {
            return SceneLibrary.createStickerBadge(l.x || 0, l.y || 0, l.scale || 1.0, this.theme, safeText, 'hazard');
          }
          return `
            <g transform="translate(${l.x || 0}, ${l.y || 0})">
              <rect x="0" y="0" width="220" height="42" rx="8" fill="#0d0e17" stroke="${this.theme.accent2}" stroke-width="2.5" filter="url(#filter-glow-primary)" />
              <polygon points="6,6 18,6 10,36 6,36" fill="${this.theme.accent2}" />
              <text x="115" y="27" font-family="'JetBrains Mono', 'Anton', sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">
                ${safeText}
              </text>
            </g>
          `;
        };
      } else if (layer.type === 'text') {
        if (layer.id === 'layer-headline' || layer.name?.toLowerCase().includes('headline')) {
          layer.render = (l) => this.renderHeadlineText(l);
        } else {
          layer.render = (l) => {
            const safeText = escapeXml((l.text || '').toUpperCase());
            return `
              <g transform="translate(${l.x || 0}, ${l.y || 0})">
                <text x="0" y="0" font-family="${escapeXml(l.fontFamily || 'Montserrat')}" font-size="${l.fontSize || 22}" font-weight="${l.fontWeight || 800}" fill="${l.color || this.theme.accent1}" letter-spacing="${l.letterSpacing || 2}" filter="url(#filter-text-shadow)">
                  ${safeText}
                </text>
              </g>
            `;
          };
        }
      } else if (layer.type === 'branding') {
        layer.render = (l) => {
          const safeText = escapeXml(l.text || 'AI SIMPLIFIED LAB');
          return `
            <g transform="translate(${l.x || 0}, ${l.y || 0})">
              <rect x="0" y="-22" width="180" height="28" rx="6" fill="#090f1d" stroke="#2a3d66" stroke-width="1.5" />
              <circle cx="14" cy="-8" r="4" fill="${this.theme.accent1}" filter="url(#filter-glow-primary)" />
              <text x="26" y="-3" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#94a3b8" letter-spacing="1">
                ${safeText}
              </text>
            </g>
          `;
        };
      } else if (layer.type === 'overlay') {
        layer.render = () => SceneLibrary.createVignette(this.width, this.height);
      }
      return layer;
    }

    // Load initial design spec (from Local generator or LLM)
    loadDesignSpec(spec) {
      this.spec = spec;
      if (spec.palette) {
        this.theme = { ...this.theme, ...spec.palette };
      }

      this.layers = [];

      // 1. Background Base
      this.addLayer(this.attachRenderer({
        id: 'bg-base',
        name: 'Background Base',
        type: 'background',
        visible: true,
        locked: true
      }));

      // 2. Background Grid Floor
      if (spec.effects?.gridFloor !== false) {
        this.addLayer(this.attachRenderer({
          id: 'bg-grid',
          name: 'Cyber Grid Floor',
          type: 'background',
          visible: true,
          locked: false
        }));
      }

      // 3. Volumetric Atmospheric Spotlights
      if (spec.effects?.spotlights !== false) {
        this.addLayer(this.attachRenderer({
          id: 'bg-spotlights',
          name: 'Volumetric Spotlights',
          type: 'background',
          visible: true,
          locked: false
        }));
      }

      // 4. Volumetric Lasers
      if (spec.effects?.laserBeams !== false) {
        this.addLayer(this.attachRenderer({
          id: 'bg-lasers',
          name: 'Volumetric Lasers',
          type: 'ambient',
          visible: true,
          locked: false
        }));
      }

      // 5. Sunburst Energy Shockwave Bloom
      const focalPositions = this.calculateFocalPosition(spec.composition);
      if (spec.effects?.sunburst !== false) {
        this.addLayer(this.attachRenderer({
          id: 'bg-sunburst',
          name: 'Sunburst Shockwave',
          type: 'ambient',
          visible: true,
          locked: false,
          x: focalPositions.x,
          y: focalPositions.y
        }));
      }

      // 6. Ambient Particle Dust
      this.addLayer(this.attachRenderer({
        id: 'bg-particles',
        name: 'Particle Matrix',
        type: 'ambient',
        visible: true,
        locked: false
      }));

      // 7. Focal Graphic Illustration Layer
      this.addLayer(this.attachRenderer({
        id: 'focal-graphic',
        name: `Focal: ${spec.focalMetaphor || 'Central Tech'}`,
        type: 'graphic',
        visible: true,
        locked: false,
        x: focalPositions.x,
        y: focalPositions.y,
        scale: focalPositions.scale,
        rotation: 0,
        metaphor: spec.focalMetaphor
      }));

      // 8. Top Alert Badge / Kicker
      const badgePos = this.calculateBadgePosition(spec.composition);
      this.addLayer(this.attachRenderer({
        id: 'layer-badge',
        name: 'Alert Badge',
        type: 'badge',
        visible: true,
        locked: false,
        x: badgePos.x,
        y: badgePos.y,
        text: spec.badge || 'CRITICAL UPDATE'
      }));

      // 9. Headline Text Layer with Viral High-CTR Default Styling
      const headlinePos = this.calculateHeadlinePosition(spec.composition);
      this.addLayer(this.attachRenderer({
        id: 'layer-headline',
        name: 'Headline',
        type: 'text',
        visible: true,
        locked: false,
        x: headlinePos.x,
        y: headlinePos.y,
        text: spec.headline || 'AI ESCAPED?',
        highlightWord: spec.headlineHighlight || '',
        fontFamily: "'Anton', 'Montserrat', sans-serif",
        fontSize: headlinePos.fontSize,
        fontWeight: '900',
        color: '#ffffff',
        highlightColor: '#ffe600',
        textStyle: spec.textStyle || 'sticker',
        slant: spec.slant != null ? spec.slant : -3,
        backplateColor: spec.backplateColor || this.theme.accent2 || '#e11d48',
        strokeColor: '#000000',
        strokeWidth: 14,
        letterSpacing: 2
      }));

      // 8. Subtitle Text Layer
      const subPos = this.calculateSubtitlePosition(spec.composition, headlinePos);
      this.addLayer(this.attachRenderer({
        id: 'layer-subtitle',
        name: 'Subtitle',
        type: 'text',
        visible: true,
        locked: false,
        x: subPos.x,
        y: subPos.y,
        text: spec.subtitle || 'SECURITY PROTOCOLS BYPASSED',
        fontFamily: "'Montserrat', 'Inter', sans-serif",
        fontSize: subPos.fontSize,
        fontWeight: '800',
        color: this.theme.accent1 || '#00f2fe',
        letterSpacing: 3
      }));

      // 9. Channel Signature Branding Pill
      this.addLayer(this.attachRenderer({
        id: 'layer-branding',
        name: 'Studio Stamp',
        type: 'branding',
        visible: true,
        locked: false,
        x: 60,
        y: this.height - 50,
        text: 'AI SIMPLIFIED LAB'
      }));

      // 10. Cinematic Vignette Overlay
      this.addLayer(this.attachRenderer({
        id: 'vignette-overlay',
        name: 'Cinematic Vignette',
        type: 'overlay',
        visible: true,
        locked: true
      }));

      this.selectedLayerId = 'layer-headline';
    }

    // Full Project Restoration (Fixes Issue 1: preserves ALL customized layers & positions)
    loadProject(projectData) {
      if (!projectData) return;
      this.spec = projectData.spec || this.spec;
      if (projectData.theme) this.theme = { ...this.theme, ...projectData.theme };
      if (projectData.format) {
        this.currentFormat = projectData.format;
        this.width = FORMATS[this.currentFormat]?.width || 1280;
        this.height = FORMATS[this.currentFormat]?.height || 720;
      }

      if (Array.isArray(projectData.layers) && projectData.layers.length > 0) {
        this.layers = projectData.layers.map(savedLayer => {
          const l = { ...savedLayer };
          return this.attachRenderer(l);
        });
      } else {
        this.loadDesignSpec(this.spec);
      }

      this.selectedLayerId = this.layers.find(l => l.type === 'text')?.id || this.layers[0]?.id || null;
    }

    // Complete State Restoration for Undo/Redo (Fixes Issue 3: restores additions & deletions)
    restoreFromSnapshot(snapshot) {
      if (!snapshot) return;
      this.currentFormat = snapshot.format || '16:9';
      this.width = FORMATS[this.currentFormat]?.width || 1280;
      this.height = FORMATS[this.currentFormat]?.height || 720;
      this.theme = snapshot.theme ? { ...snapshot.theme } : this.theme;
      this.spec = snapshot.spec ? { ...snapshot.spec } : this.spec;

      if (Array.isArray(snapshot.layers)) {
        this.layers = snapshot.layers.map(l => this.attachRenderer({ ...l }));
      }
    }

    addLayer(layer) {
      this.layers.push(layer);
    }

    removeLayer(id) {
      this.layers = this.layers.filter(l => l.id !== id);
      if (this.selectedLayerId === id) {
        this.selectedLayerId = this.layers.length > 0 ? this.layers[this.layers.length - 1].id : null;
      }
    }

    getLayer(id) {
      return this.layers.find(l => l.id === id);
    }

    reorderLayer(id, direction) {
      const idx = this.layers.findIndex(l => l.id === id);
      if (idx === -1) return;
      const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (targetIdx < 0 || targetIdx >= this.layers.length) return;
      const temp = this.layers[idx];
      this.layers[idx] = this.layers[targetIdx];
      this.layers[targetIdx] = temp;
    }

    // Reflow layer coordinates when changing aspect ratios (Fixes Issue 2: responsive reflow)
    reflowLayers() {
      const isVertical = this.currentFormat === '9:16';
      const isSquare = this.currentFormat === '1:1';
      const w = this.width;
      const h = this.height;

      const focalLayer = this.getLayer('focal-graphic');
      if (focalLayer) {
        if (isVertical) {
          focalLayer.x = Math.round(w * 0.5);
          focalLayer.y = Math.round(h * 0.62);
          focalLayer.scale = 1.35;
        } else if (isSquare) {
          focalLayer.x = Math.round(w * 0.5);
          focalLayer.y = Math.round(h * 0.6);
          focalLayer.scale = 1.15;
        } else {
          focalLayer.x = Math.round(w * 0.72);
          focalLayer.y = Math.round(h * 0.5);
          focalLayer.scale = 1.0;
        }
      }

      const badgeLayer = this.getLayer('layer-badge');
      if (badgeLayer) {
        if (isVertical) {
          badgeLayer.x = 80;
          badgeLayer.y = 120;
        } else if (isSquare) {
          badgeLayer.x = 80;
          badgeLayer.y = 80;
        } else {
          badgeLayer.x = 70;
          badgeLayer.y = 85;
        }
      }

      const headlineLayer = this.getLayer('layer-headline');
      if (headlineLayer) {
        if (isVertical) {
          headlineLayer.x = 80;
          headlineLayer.y = 280;
          headlineLayer.fontSize = 98;
        } else if (isSquare) {
          headlineLayer.x = 80;
          headlineLayer.y = 220;
          headlineLayer.fontSize = 84;
        } else {
          headlineLayer.x = 70;
          headlineLayer.y = 230;
          headlineLayer.fontSize = 86;
        }
      }

      const subLayer = this.getLayer('layer-subtitle');
      if (subLayer && headlineLayer) {
        if (isVertical) {
          subLayer.x = 80;
          subLayer.y = headlineLayer.y + 240;
          subLayer.fontSize = 24;
        } else if (isSquare) {
          subLayer.x = 80;
          subLayer.y = headlineLayer.y + 200;
          subLayer.fontSize = 22;
        } else {
          subLayer.x = 70;
          subLayer.y = headlineLayer.y + 190;
          subLayer.fontSize = 22;
        }
      }

      const brandLayer = this.getLayer('layer-branding');
      if (brandLayer) {
        brandLayer.x = 70;
        brandLayer.y = h - 50;
      }
    }

    calculateFocalPosition(composition) {
      const w = this.width;
      const h = this.height;

      if (this.currentFormat === '9:16') {
        return { x: Math.round(w * 0.5), y: Math.round(h * 0.62), scale: 1.35 };
      }
      if (this.currentFormat === '1:1') {
        return { x: Math.round(w * 0.5), y: Math.round(h * 0.6), scale: 1.15 };
      }

      switch (composition) {
        case 'split-duel':
          return { x: Math.round(w * 0.75), y: Math.round(h * 0.5), scale: 1.1 };
        case 'isometric-stage':
          return { x: Math.round(w * 0.72), y: Math.round(h * 0.54), scale: 1.05 };
        case 'shatter-burst':
          return { x: Math.round(w * 0.68), y: Math.round(h * 0.48), scale: 1.15 };
        case 'focal-right':
        default:
          return { x: Math.round(w * 0.73), y: Math.round(h * 0.5), scale: 1.0 };
      }
    }

    calculateBadgePosition(composition) {
      return { x: 70, y: 85 };
    }

    calculateHeadlinePosition(composition) {
      return { x: 70, y: 230, fontSize: 88 };
    }

    calculateSubtitlePosition(composition, headPos) {
      return { x: headPos.x, y: headPos.y + 190, fontSize: 22 };
    }

    renderFocalMetaphor(layer) {
      const scale = layer.scale || 1.0;
      const rot = layer.rotation || 0;
      const transform = `transform="translate(${layer.x || 0}, ${layer.y || 0}) rotate(${rot})"`;

      let innerSvg = '';
      switch (layer.metaphor) {
        case 'arrow':
          innerSvg = SceneLibrary.createAttentionArrow(0, 0, scale, this.theme, rot || -25);
          break;
        case 'sticker-badge':
          innerSvg = SceneLibrary.createStickerBadge(0, 0, scale, this.theme, layer.text || '100% EXPOSED', layer.badgeType || 'hazard');
          break;
        case 'hf-breach':
          innerSvg = SceneLibrary.createHuggingFaceBreach(0, 0, scale, this.theme, 42);
          break;
        case 'shield':
          innerSvg = SceneLibrary.createBreachedShield(0, 0, scale, this.theme, 42);
          break;
        case 'vault':
          innerSvg = SceneLibrary.createDataVault(0, 0, scale, this.theme, 42);
          break;
        case 'terminal':
          innerSvg = SceneLibrary.createTerminalWindow(0, 0, scale, this.theme, 42);
          break;
        case 'workflow':
          innerSvg = SceneLibrary.createWorkflowAutomation(0, 0, scale, this.theme, 42);
          break;
        case 'quantum':
          innerSvg = SceneLibrary.createQuantumAtom(0, 0, scale, this.theme, 42);
          break;
        case 'prism':
          innerSvg = SceneLibrary.createPrismSpectrum(0, 0, scale, this.theme, 42);
          break;
        case 'disruption':
          innerSvg = SceneLibrary.createDisruptionRupture(0, 0, scale, this.theme, 42);
          break;
        case 'neural-core':
        default:
          innerSvg = SceneLibrary.createNeuralCore(0, 0, scale, this.theme, 42);
          break;
      }

      return `<g id="group-${escapeXml(layer.id)}" ${transform}>${innerSvg}</g>`;
    }

    // High impact YouTube headline renderer with strict XML escaping & viral visual styles
    renderHeadlineText(layer) {
      const words = (layer.text || '').trim().split(/\s+/);
      const hlWord = (layer.highlightWord || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const fontSize = layer.fontSize || 88;
      const lineHeight = fontSize * 1.08;
      const textStyle = layer.textStyle || 'sticker';
      const slant = layer.slant != null ? layer.slant : -3;
      const fontFamily = escapeXml(layer.fontFamily || 'Anton');
      const letterSpacing = layer.letterSpacing || 2;
      const strokeWidth = layer.strokeWidth || 14;
      const backplateColor = layer.backplateColor || this.theme.accent2 || '#e11d48';

      const lines = [];
      if (words.length <= 2) {
        lines.push(words.join(' '));
      } else if (words.length <= 4) {
        lines.push(words.slice(0, 2).join(' '));
        lines.push(words.slice(2).join(' '));
      } else {
        const mid = Math.ceil(words.length / 2);
        lines.push(words.slice(0, mid).join(' '));
        lines.push(words.slice(mid).join(' '));
      }

      // Generate front tspans
      const lineTspans = lines.map((lineText, lineIdx) => {
        const lineWords = lineText.split(/\s+/);
        const spans = lineWords.map(w => {
          const clean = w.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          const isHighlight = hlWord && clean === hlWord;
          let fillColor = isHighlight ? (layer.highlightColor || '#ffe600') : (layer.color || '#ffffff');
          let filter = isHighlight ? 'filter="url(#filter-glow-primary)"' : '';

          if (textStyle === 'neon-glow') {
            fillColor = isHighlight ? '#ffe600' : 'url(#grad-text-electric)';
            filter = 'filter="url(#filter-glow-intense)"';
          } else if (textStyle === 'chrome-gold') {
            fillColor = isHighlight ? '#ffffff' : 'url(#grad-gold)';
            filter = 'filter="url(#filter-bevel)"';
          }

          return `<tspan fill="${fillColor}" ${filter}>${escapeXml(w)} </tspan>`;
        }).join('');

        return `<tspan x="0" dy="${lineIdx === 0 ? 0 : lineHeight}">${spans}</tspan>`;
      }).join('');

      // Generate sticker backplate pill boxes behind each line if textStyle === 'sticker'
      let stickerBackplates = '';
      if (textStyle === 'sticker') {
        const padX = fontSize * 0.22;
        stickerBackplates = lines.map((lineText, lineIdx) => {
          const approxCharWidth = fontSize * 0.56;
          const rectWidth = Math.round(lineText.length * approxCharWidth + padX * 2);
          const rectHeight = Math.round(fontSize * 1.14);
          const rectY = Math.round(lineIdx * lineHeight - fontSize * 0.9);
          return `
            <g filter="url(#filter-sticker-shadow)">
              <rect x="${-padX}" y="${rectY}" width="${rectWidth}" height="${rectHeight}" rx="10" 
                    fill="${backplateColor}" stroke="#ffffff" stroke-width="3" />
            </g>
          `;
        }).join('');
      }

      // Generate 3D Extrusion Shadow steps if textStyle === '3d-block'
      let extrusion3d = '';
      if (textStyle === '3d-block') {
        extrusion3d = [1, 2, 3, 4, 5, 6].map(step => `
          <text x="${step * 2}" y="${step * 2.5}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="900" letter-spacing="${letterSpacing}" fill="#000000" stroke="#000000" stroke-width="6" stroke-linejoin="round">
            ${lines.map((l, i) => `<tspan x="${step * 2}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(l)} </tspan>`).join('')}
          </text>
        `).join('');
      }

      const slantTransform = slant !== 0 ? `rotate(${slant})` : '';

      return `
        <g transform="translate(${layer.x || 0}, ${layer.y || 0}) ${slantTransform}" filter="url(#filter-text-shadow)">
          <!-- Sticker Backplates (High-CTR Viral Tape Pills) -->
          ${stickerBackplates}

          <!-- 3D Extruded Block Shadows -->
          ${extrusion3d}

          <!-- Outer Heavy Black Contour Stroke for 100% Legibility -->
          <text x="0" y="0" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${layer.fontWeight || 900}" letter-spacing="${letterSpacing}" stroke="#000000" stroke-width="${strokeWidth}" stroke-linejoin="round" fill="none">
            ${lines.map((l, i) => `<tspan x="0" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(l)} </tspan>`).join('')}
          </text>

          <!-- Crisp Front Text with Highlights / Gradients -->
          <text x="0" y="0" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${layer.fontWeight || 900}" letter-spacing="${letterSpacing}">
            ${lineTspans}
          </text>
        </g>
      `;
    }

    renderSafeGuides() {
      if (!this.showSafeGuides) return '';
      const w = this.width;
      const h = this.height;

      if (this.currentFormat === '16:9') {
        return `
          <g id="safe-guides" pointer-events="none">
            <!-- YouTube Timestamp Badge Safe Zone (bottom-right 180x48) -->
            <rect x="${w - 180}" y="${h - 48}" width="180" height="48" fill="#ff0000" fill-opacity="0.35" stroke="#ff0000" stroke-width="2" stroke-dasharray="4 4" />
            <text x="${w - 90}" y="${h - 20}" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">YT TIMESTAMP SAFE</text>
            <!-- YouTube Watch Later / Card overlay at Top-Right -->
            <rect x="${w - 80}" y="12" width="68" height="68" fill="#ffaa00" fill-opacity="0.25" stroke="#ffaa00" stroke-width="1.5" stroke-dasharray="4 4" />
            <!-- Outer Safe Margins (5% margin) -->
            <rect x="${w * 0.05}" y="${h * 0.05}" width="${w * 0.9}" height="${h * 0.9}" fill="none" stroke="#00f2fe" stroke-width="1" stroke-dasharray="8 8" opacity="0.4" />
          </g>
        `;
      } else if (this.currentFormat === '9:16') {
        return `
          <g id="safe-guides" pointer-events="none">
            <!-- Shorts Right Sidebar Icons (Like, Comment, Share) -->
            <rect x="${w - 160}" y="${h * 0.4}" width="140" height="${h * 0.45}" fill="#ff0000" fill-opacity="0.25" stroke="#ff0000" stroke-width="2" stroke-dasharray="4 4" />
            <text x="${w - 90}" y="${h * 0.6}" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">SHORTS ICONS</text>
            <!-- Bottom Title Safe Zone -->
            <rect x="20" y="${h - 280}" width="${w - 40}" height="260" fill="#ffaa00" fill-opacity="0.2" stroke="#ffaa00" stroke-width="2" stroke-dasharray="4 4" />
          </g>
        `;
      }
      return '';
    }

    renderSelectionBox() {
      if (!this.selectedLayerId) return '';
      const layer = this.getLayer(this.selectedLayerId);
      if (!layer || layer.type === 'background' || layer.type === 'overlay') return '';

      const x = layer.x || 0;
      const y = layer.y || 0;

      return `
        <g id="selection-overlay" pointer-events="none">
          <circle cx="${x}" cy="${y}" r="8" fill="#00f2fe" stroke="#ffffff" stroke-width="2" filter="url(#filter-glow-primary)" />
        </g>
      `;
    }

    generateSvgString(options = {}) {
      const transparentBg = options.transparentBg || false;
      const w = this.width;
      const h = this.height;

      const defs = SceneLibrary.getSvgDefs(this.theme);

      const layersSvg = this.layers
        .filter(layer => layer.visible)
        .filter(layer => !(transparentBg && (layer.type === 'background' || layer.type === 'overlay')))
        .map(layer => {
          if (layer.type === 'user-image') {
            return `
              <g transform="translate(${layer.x || 0}, ${layer.y || 0}) rotate(${layer.rotation || 0}) scale(${layer.scale || 1})" opacity="${layer.opacity ?? 1}">
                <image href="${escapeXml(layer.dataUrl)}" width="${layer.width || 300}" height="${layer.height || 300}" />
              </g>
            `;
          }
          if (typeof layer.render === 'function') {
            return layer.render(layer);
          }
          return '';
        }).join('\n');

      const safeGuides = (!options.isExport && this.showSafeGuides) ? this.renderSafeGuides() : '';
      const selectionBox = (!options.isExport) ? this.renderSelectionBox() : '';

      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" id="thumbnail-canvas-svg">
          ${defs}
          ${layersSvg}
          ${safeGuides}
          ${selectionBox}
        </svg>
      `;
    }
  }

  return {
    Engine,
    FORMATS,
    escapeXml
  };
})();
