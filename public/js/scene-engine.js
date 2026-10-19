// AI SIMPLIFIED LAB - SCENE ENGINE
// State manager and renderer for modular SVG thumbnail layers.
// Supports multi-aspect ratio reflow, layer compositing, and safe areas.

window.SceneEngine = (function() {
  'use strict';

  // Dimension presets
  const FORMATS = {
    '16:9': { id: '16:9', name: 'YouTube Landscape', width: 1280, height: 720 },
    '9:16': { id: '9:16', name: 'YouTube Shorts', width: 1080, height: 1920 },
    '1:1': { id: '1:1', name: 'Square', width: 1080, height: 1080 }
  };

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

    // Load a structured design spec and generate layers
    loadDesignSpec(spec) {
      this.spec = spec;
      if (spec.palette) {
        this.theme = { ...this.theme, ...spec.palette };
      }

      this.layers = [];
      const w = this.width;
      const h = this.height;

      // 1. Background Base
      this.addLayer({
        id: 'bg-base',
        name: 'Background Base',
        type: 'background',
        visible: true,
        locked: true,
        render: () => `
          <rect x="0" y="0" width="${w}" height="${h}" fill="url(#grad-bg-ambient)" />
          <rect x="0" y="0" width="${w}" height="${h}" fill="url(#pat-cyber-dots)" opacity="0.15" />
        `
      });

      // 2. Background Grid Floor
      if (spec.effects?.gridFloor !== false) {
        this.addLayer({
          id: 'bg-grid',
          name: 'Cyber Grid Floor',
          type: 'background',
          visible: true,
          locked: false,
          render: () => SceneLibrary.createGridFloor(w, h, this.theme)
        });
      }

      // 3. Volumetric Lasers / Light Beams
      if (spec.effects?.laserBeams !== false) {
        this.addLayer({
          id: 'bg-lasers',
          name: 'Volumetric Lasers',
          type: 'ambient',
          visible: true,
          locked: false,
          render: () => SceneLibrary.createLaserBeams(w, h, this.theme)
        });
      }

      // 4. Ambient Particle Dust
      this.addLayer({
        id: 'bg-particles',
        name: 'Particle Matrix',
        type: 'ambient',
        visible: true,
        locked: false,
        render: () => SceneLibrary.createParticleField(w, h, this.theme, spec.effects?.particleDensity || 45, spec.seed || 1)
      });

      // 5. Focal Graphic Illustration Layer
      const focalPositions = this.calculateFocalPosition(spec.composition);
      this.addLayer({
        id: 'focal-graphic',
        name: `Focal: ${spec.focalMetaphor || 'Central Tech'}`,
        type: 'graphic',
        visible: true,
        locked: false,
        x: focalPositions.x,
        y: focalPositions.y,
        scale: focalPositions.scale,
        rotation: 0,
        metaphor: spec.focalMetaphor,
        render: (layer) => this.renderFocalMetaphor(layer)
      });

      // 6. Top Alert Badge / Kicker
      const badgePos = this.calculateBadgePosition(spec.composition);
      this.addLayer({
        id: 'layer-badge',
        name: 'Alert Badge',
        type: 'badge',
        visible: true,
        locked: false,
        x: badgePos.x,
        y: badgePos.y,
        text: spec.badge || 'CRITICAL UPDATE',
        render: (layer) => `
          <g transform="translate(${layer.x}, ${layer.y})">
            <rect x="0" y="0" width="220" height="42" rx="8" fill="#0d0e17" stroke="${this.theme.accent2}" stroke-width="2.5" filter="url(#filter-glow-primary)" />
            <polygon points="6,6 18,6 10,36 6,36" fill="${this.theme.accent2}" />
            <text x="115" y="27" font-family="'JetBrains Mono', 'Anton', sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">
              ${(layer.text || '').toUpperCase()}
            </text>
          </g>
        `
      });

      // 7. Headline Text Layer
      const headlinePos = this.calculateHeadlinePosition(spec.composition);
      this.addLayer({
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
        highlightColor: this.theme.accent2 || '#ff2a5f',
        strokeColor: '#000000',
        strokeWidth: 4,
        letterSpacing: 2,
        render: (layer) => this.renderHeadlineText(layer)
      });

      // 8. Subtitle Text Layer
      const subPos = this.calculateSubtitlePosition(spec.composition, headlinePos);
      this.addLayer({
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
        letterSpacing: 3,
        render: (layer) => `
          <g transform="translate(${layer.x}, ${layer.y})">
            <text x="0" y="0" font-family="${layer.fontFamily}" font-size="${layer.fontSize}" font-weight="${layer.fontWeight}" fill="${layer.color}" letter-spacing="${layer.letterSpacing}" filter="url(#filter-text-shadow)">
              ${layer.text.toUpperCase()}
            </text>
          </g>
        `
      });

      // 9. Channel Signature Branding Pill
      this.addLayer({
        id: 'layer-branding',
        name: 'Studio Stamp',
        type: 'branding',
        visible: true,
        locked: false,
        x: 60,
        y: h - 50,
        text: 'AI SIMPLIFIED LAB',
        render: (layer) => `
          <g transform="translate(${layer.x}, ${layer.y})">
            <rect x="0" y="-22" width="180" height="28" rx="6" fill="#090f1d" stroke="#2a3d66" stroke-width="1.5" />
            <circle cx="14" cy="-8" r="4" fill="${this.theme.accent1}" filter="url(#filter-glow-primary)" />
            <text x="26" y="-3" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#94a3b8" letter-spacing="1">
              ${layer.text}
            </text>
          </g>
        `
      });

      // 10. Cinematic Vignette Overlay
      this.addLayer({
        id: 'vignette-overlay',
        name: 'Cinematic Vignette',
        type: 'overlay',
        visible: true,
        locked: true,
        render: () => SceneLibrary.createVignette(w, h)
      });

      this.selectedLayerId = 'layer-headline';
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

    // Reflow layer coordinates when changing aspect ratios (16:9 -> 9:16 -> 1:1)
    reflowLayers() {
      const isVertical = this.currentFormat === '9:16';
      const isSquare = this.currentFormat === '1:1';
      const w = this.width;
      const h = this.height;

      const focalLayer = this.getLayer('focal-graphic');
      if (focalLayer) {
        if (isVertical) {
          focalLayer.x = w * 0.5;
          focalLayer.y = h * 0.62;
          focalLayer.scale = 1.35;
        } else if (isSquare) {
          focalLayer.x = w * 0.5;
          focalLayer.y = h * 0.6;
          focalLayer.scale = 1.15;
        } else {
          // 16:9 Landscape
          focalLayer.x = w * 0.72;
          focalLayer.y = h * 0.5;
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

    // Positions for 16:9 initial layout
    calculateFocalPosition(composition) {
      const w = this.width;
      const h = this.height;

      if (this.currentFormat === '9:16') {
        return { x: w * 0.5, y: h * 0.62, scale: 1.35 };
      }
      if (this.currentFormat === '1:1') {
        return { x: w * 0.5, y: h * 0.6, scale: 1.15 };
      }

      // 16:9
      switch (composition) {
        case 'split-duel':
          return { x: w * 0.75, y: h * 0.5, scale: 1.1 };
        case 'isometric-stage':
          return { x: w * 0.72, y: h * 0.54, scale: 1.05 };
        case 'shatter-burst':
          return { x: w * 0.68, y: h * 0.48, scale: 1.15 };
        case 'focal-right':
        default:
          return { x: w * 0.73, y: h * 0.5, scale: 1.0 };
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
      const transform = `transform="translate(${layer.x}, ${layer.y}) rotate(${rot})"`;

      let innerSvg = '';
      switch (layer.metaphor) {
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

      return `<g id="group-${layer.id}" ${transform}>${innerSvg}</g>`;
    }

    // High impact YouTube headline renderer with word-level neon accent highlighting
    renderHeadlineText(layer) {
      const words = (layer.text || '').split(/\s+/);
      const hlWord = (layer.highlightWord || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const fontSize = layer.fontSize || 88;
      const lineHeight = fontSize * 1.06;

      // Wrap headline into 1 to 3 compact lines
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

      let lineTspans = lines.map((lineText, lineIdx) => {
        const lineWords = lineText.split(/\s+/);
        const spans = lineWords.map(w => {
          const clean = w.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          const isHighlight = hlWord && clean === hlWord;
          const fillColor = isHighlight ? (layer.highlightColor || this.theme.accent2) : (layer.color || '#ffffff');
          const filter = isHighlight ? 'filter="url(#filter-glow-primary)"' : '';
          return `<tspan fill="${fillColor}" ${filter}>${w} </tspan>`;
        }).join('');

        return `<tspan x="0" dy="${lineIdx === 0 ? 0 : lineHeight}">${spans}</tspan>`;
      }).join('');

      return `
        <g transform="translate(${layer.x}, ${layer.y})" filter="url(#filter-text-shadow)">
          <!-- Outer Dark Stroke/Shadow for Uncompromising Contrast -->
          <text x="0" y="0" font-family="${layer.fontFamily}" font-size="${fontSize}" font-weight="${layer.fontWeight}" letter-spacing="${layer.letterSpacing || 2}" stroke="#000000" stroke-width="12" stroke-linejoin="round" fill="none">
            ${lines.map((l, i) => `<tspan x="0" dy="${i === 0 ? 0 : lineHeight}">${l} </tspan>`).join('')}
          </text>
          <!-- Front Text with Word Highlights -->
          <text x="0" y="0" font-family="${layer.fontFamily}" font-size="${fontSize}" font-weight="${layer.fontWeight}" letter-spacing="${layer.letterSpacing || 2}">
            ${lineTspans}
          </text>
        </g>
      `;
    }

    // Render YouTube Safe Area Guides
    renderSafeGuides() {
      if (!this.showSafeGuides) return '';
      const w = this.width;
      const h = this.height;

      if (this.currentFormat === '16:9') {
        return `
          <g id="safe-guides" pointer-events="none">
            <!-- YouTube Timestamp / Duration Badge at Bottom-Right (180px x 48px) -->
            <rect x="${w - 180}" y="${h - 48}" width="180" height="48" fill="#ff0000" fill-opacity="0.35" stroke="#ff0000" stroke-width="2" stroke-dasharray="4 4" />
            <text x="${w - 90}" y="${h - 20}" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">YT TIMESTAMP SAFE</text>
            
            <!-- YouTube Watch Later / Card overlay at Top-Right -->
            <rect x="${w - 80}" y="12" width="68" height="68" fill="#ffaa00" fill-opacity="0.25" stroke="#ffaa00" stroke-width="1.5" stroke-dasharray="4 4" />
            
            <!-- Outer Safe Margins (5% margin) -->
            <rect x="${w * 0.05}" y="${h * 0.05}" width="${w * 0.9}" height="${h * 0.9}" fill="none" stroke="#00f2fe" stroke-width="1" stroke-dasharray="8 8" opacity="0.4" />
          </g>
        `;
      } else if (this.currentFormat === '9:16') {
        // Shorts Safe Area
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

    // Render interactive selection bounding box
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

    // Complete SVG string generator
    generateSvgString(options = {}) {
      const transparentBg = options.transparentBg || false;
      const w = this.width;
      const h = this.height;

      let defs = SceneLibrary.getSvgDefs(this.theme);

      let layersSvg = this.layers
        .filter(layer => layer.visible)
        .filter(layer => !(transparentBg && (layer.type === 'background' || layer.type === 'overlay')))
        .map(layer => {
          if (layer.type === 'user-image') {
            return `
              <g transform="translate(${layer.x}, ${layer.y}) rotate(${layer.rotation || 0}) scale(${layer.scale || 1})" opacity="${layer.opacity ?? 1}">
                <image href="${layer.dataUrl}" width="${layer.width || 300}" height="${layer.height || 300}" />
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
    FORMATS
  };
})();
