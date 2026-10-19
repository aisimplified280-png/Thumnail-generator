// AI SIMPLIFIED LAB - LAYER EDITOR & INTERACTION MANAGER
// Handles direct on-canvas dragging, context-sensitive inspector, and layers list.

window.LayerEditor = (function() {
  'use strict';

  class Editor {
    constructor(engine, onUpdateCallback) {
      this.engine = engine;
      this.onUpdate = onUpdateCallback || (() => {});
      this.isDragging = false;
      this.dragLayer = null;
      this.dragStart = { x: 0, y: 0 };
      this.layerStart = { x: 0, y: 0 };

      this.initCanvasEvents();
      this.initKeyboardEvents();
    }

    // Convert mouse/touch event to SVG coordinate space
    getSvgCoords(e, svgElement) {
      const pt = svgElement.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const screenCTM = svgElement.getScreenCTM();
      if (!screenCTM) return { x: 0, y: 0 };
      return pt.matrixTransform(screenCTM.inverse());
    }

    initCanvasEvents() {
      const container = document.getElementById('canvas-container');
      if (!container) return;

      container.addEventListener('mousedown', (e) => {
        const svg = document.getElementById('thumbnail-canvas-svg');
        if (!svg) return;

        const coords = this.getSvgCoords(e, svg);
        const hitLayer = this.findHitLayer(coords.x, coords.y);

        if (hitLayer && !hitLayer.locked) {
          this.engine.selectedLayerId = hitLayer.id;
          this.isDragging = true;
          this.dragLayer = hitLayer;
          this.dragStart = { x: coords.x, y: coords.y };
          this.layerStart = { x: hitLayer.x || 0, y: hitLayer.y || 0 };
          this.renderInspector();
          this.renderLayersList();
          this.onUpdate({ type: 'select', layer: hitLayer });
        } else if (!hitLayer) {
          // Clicked empty background
          this.engine.selectedLayerId = null;
          this.renderInspector();
          this.renderLayersList();
          this.onUpdate({ type: 'deselect' });
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.isDragging || !this.dragLayer) return;
        const svg = document.getElementById('thumbnail-canvas-svg');
        if (!svg) return;

        const coords = this.getSvgCoords(e, svg);
        const dx = coords.x - this.dragStart.x;
        const dy = coords.y - this.dragStart.y;

        this.dragLayer.x = Math.round(this.layerStart.x + dx);
        this.dragLayer.y = Math.round(this.layerStart.y + dy);

        this.updateCanvasDirectly();
        this.updateInspectorPositionInputs();
      });

      window.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          this.dragLayer = null;
          this.onUpdate({ type: 'drag-end' });
        }
      });
    }

    initKeyboardEvents() {
      window.addEventListener('keydown', (e) => {
        // If typing in input or textarea, ignore
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
          return;
        }

        const layer = this.engine.getLayer(this.engine.selectedLayerId);
        if (!layer || layer.locked) return;

        const step = e.shiftKey ? 10 : 2;
        let moved = false;

        if (e.key === 'ArrowLeft') {
          layer.x = (layer.x || 0) - step;
          moved = true;
        } else if (e.key === 'ArrowRight') {
          layer.x = (layer.x || 0) + step;
          moved = true;
        } else if (e.key === 'ArrowUp') {
          layer.y = (layer.y || 0) - step;
          moved = true;
        } else if (e.key === 'ArrowDown') {
          layer.y = (layer.y || 0) + step;
          moved = true;
        }

        if (moved) {
          e.preventDefault();
          this.updateCanvasDirectly();
          this.updateInspectorPositionInputs();
          this.onUpdate({ type: 'nudge' });
        }
      });
    }

    // Hit-testing layers from top to bottom
    findHitLayer(x, y) {
      const activeLayers = [...this.engine.layers].reverse();
      for (const layer of activeLayers) {
        if (!layer.visible || layer.locked) continue;
        if (layer.type === 'background' || layer.type === 'overlay' || layer.type === 'ambient') continue;

        const lx = layer.x || 0;
        const ly = layer.y || 0;

        // Approximate bounding boxes based on layer type
        if (layer.type === 'text') {
          const fontSize = layer.fontSize || 80;
          const textWidth = (layer.text || '').length * fontSize * 0.55;
          const textHeight = fontSize * 1.5;
          if (x >= lx - 20 && x <= lx + textWidth && y >= ly - fontSize && y <= ly + textHeight) {
            return layer;
          }
        } else if (layer.type === 'badge') {
          if (x >= lx && x <= lx + 240 && y >= ly && y <= ly + 50) {
            return layer;
          }
        } else if (layer.type === 'branding') {
          if (x >= lx && x <= lx + 200 && y >= ly - 30 && y <= ly + 10) {
            return layer;
          }
        } else if (layer.type === 'graphic') {
          const radius = 220 * (layer.scale || 1.0);
          const dist = Math.hypot(x - lx, y - ly);
          if (dist <= radius) {
            return layer;
          }
        } else if (layer.type === 'user-image') {
          const w = (layer.width || 300) * (layer.scale || 1);
          const h = (layer.height || 300) * (layer.scale || 1);
          if (x >= lx && x <= lx + w && y >= ly && y <= ly + h) {
            return layer;
          }
        }
      }
      return null;
    }

    updateCanvasDirectly() {
      const container = document.getElementById('canvas-container');
      if (container) {
        container.innerHTML = this.engine.generateSvgString({ isExport: false });
      }
    }

    updateInspectorPositionInputs() {
      const posX = document.getElementById('inspector-pos-x');
      const posY = document.getElementById('inspector-pos-y');
      const layer = this.engine.getLayer(this.engine.selectedLayerId);
      if (posX && layer) posX.value = layer.x || 0;
      if (posY && layer) posY.value = layer.y || 0;
    }

    // Render Context-Sensitive Inspector Controls
    renderInspector() {
      const panel = document.getElementById('inspector-content');
      if (!panel) return;

      const layer = this.engine.getLayer(this.engine.selectedLayerId);

      if (!layer) {
        panel.innerHTML = `
          <div class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
            <p>Select any element on the canvas or layer list to customize its properties.</p>
          </div>
        `;
        return;
      }

      function esc(unsafe) {
        if (unsafe == null) return '';
        return String(unsafe).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      }

      let content = `
        <div class="inspector-section">
          <div class="section-header">
            <h4>${esc(layer.name)}</h4>
            <span class="badge-type">${esc(layer.type.toUpperCase())}</span>
          </div>

          <!-- Position Coordinates -->
          <div class="input-row">
            <div class="input-field">
              <label>X Position</label>
              <input type="number" id="inspector-pos-x" value="${layer.x || 0}">
            </div>
            <div class="input-field">
              <label>Y Position</label>
              <input type="number" id="inspector-pos-y" value="${layer.y || 0}">
            </div>
          </div>
        </div>
      `;

      // Text Specific Controls
      if (layer.type === 'text') {
        content += `
          <div class="inspector-section">
            <label class="control-label">Text Content</label>
            <textarea id="prop-text-val" rows="2" class="studio-input">${esc(layer.text || '')}</textarea>

            <label class="control-label">Font Family</label>
            <select id="prop-font-family" class="studio-select">
              <option value="'Anton', sans-serif" ${layer.fontFamily?.includes('Anton') ? 'selected' : ''}>Anton (Bold Condensed)</option>
              <option value="'Montserrat', sans-serif" ${layer.fontFamily?.includes('Montserrat') ? 'selected' : ''}>Montserrat (Geometric Ultra)</option>
              <option value="'Outfit', sans-serif" ${layer.fontFamily?.includes('Outfit') ? 'selected' : ''}>Outfit (Modern Tech)</option>
              <option value="'Bebas Neue', sans-serif" ${layer.fontFamily?.includes('Bebas') ? 'selected' : ''}>Bebas Neue (Impact)</option>
              <option value="'JetBrains Mono', monospace" ${layer.fontFamily?.includes('JetBrains') ? 'selected' : ''}>JetBrains Mono (Code)</option>
              <option value="'Inter', sans-serif" ${layer.fontFamily?.includes('Inter') ? 'selected' : ''}>Inter (Clean Neo)</option>
            </select>

            <div class="slider-control">
              <div class="slider-header">
                <label>Font Size</label>
                <span id="font-size-val">${layer.fontSize || 80}px</span>
              </div>
              <input type="range" id="prop-font-size" min="20" max="180" value="${layer.fontSize || 80}">
            </div>

            <div class="input-row">
              <div class="input-field">
                <label>Primary Color</label>
                <input type="color" id="prop-text-color" value="${esc(layer.color || '#ffffff')}">
              </div>
              <div class="input-field">
                <label>Highlight Word</label>
                <input type="text" id="prop-highlight-word" value="${esc(layer.highlightWord || '')}" placeholder="e.g. ESCAPED">
              </div>
            </div>

            <div class="input-row">
              <div class="input-field">
                <label>Highlight Color</label>
                <input type="color" id="prop-highlight-color" value="${esc(layer.highlightColor || this.engine.theme.accent2)}">
              </div>
              <div class="input-field">
                <label>Letter Spacing</label>
                <input type="number" id="prop-letter-spacing" value="${layer.letterSpacing || 2}">
              </div>
            </div>
          </div>
        `;
      }

      // Graphic / Focal Metaphor Controls
      if (layer.type === 'graphic') {
        content += `
          <div class="inspector-section">
            <label class="control-label">Visual Metaphor</label>
            <select id="prop-focal-metaphor" class="studio-select">
              <option value="vault" ${layer.metaphor === 'vault' ? 'selected' : ''}>Cloud Data Vault (Security)</option>
              <option value="shield" ${layer.metaphor === 'shield' ? 'selected' : ''}>Breached Cyber Shield</option>
              <option value="neural-core" ${layer.metaphor === 'neural-core' ? 'selected' : ''}>Neural Core / AI Brain</option>
              <option value="hf-breach" ${layer.metaphor === 'hf-breach' ? 'selected' : ''}>Hugging Face Robot Breach</option>
              <option value="terminal" ${layer.metaphor === 'terminal' ? 'selected' : ''}>Developer Terminal Window</option>
              <option value="workflow" ${layer.metaphor === 'workflow' ? 'selected' : ''}>Autonomous 10X Workflow</option>
              <option value="quantum" ${layer.metaphor === 'quantum' ? 'selected' : ''}>Quantum Atom Orbital</option>
              <option value="prism" ${layer.metaphor === 'prism' ? 'selected' : ''}>Optical Prism & Spectrum</option>
              <option value="disruption" ${layer.metaphor === 'disruption' ? 'selected' : ''}>Seismic Disruption Monolith</option>
            </select>

            <div class="slider-control">
              <div class="slider-header">
                <label>Scale Factor</label>
                <span id="scale-val">${(layer.scale || 1).toFixed(2)}x</span>
              </div>
              <input type="range" id="prop-scale" min="0.5" max="2.5" step="0.05" value="${layer.scale || 1}">
            </div>

            <div class="slider-control">
              <div class="slider-header">
                <label>Rotation</label>
                <span id="rotation-val">${layer.rotation || 0}°</span>
              </div>
              <input type="range" id="prop-rotation" min="-180" max="180" value="${layer.rotation || 0}">
            </div>

            <div class="input-row">
              <div class="input-field">
                <label>Primary Glow</label>
                <input type="color" id="prop-theme-accent1" value="${this.engine.theme.accent1}">
              </div>
              <div class="input-field">
                <label>Warning / Breach Accent</label>
                <input type="color" id="prop-theme-accent2" value="${this.engine.theme.accent2}">
              </div>
            </div>
          </div>
        `;
      }

      // Badge Controls
      if (layer.type === 'badge') {
        content += `
          <div class="inspector-section">
            <label class="control-label">Badge Text</label>
            <input type="text" id="prop-badge-text" class="studio-input" value="${esc(layer.text || '')}">
            <div class="input-field" style="margin-top: 10px;">
              <label>Accent Border Color</label>
              <input type="color" id="prop-theme-accent2" value="${esc(this.engine.theme.accent2)}">
            </div>
          </div>
        `;
      }

      // User Uploaded Image Controls
      if (layer.type === 'user-image') {
        content += `
          <div class="inspector-section">
            <div class="slider-control">
              <div class="slider-header">
                <label>Scale</label>
                <span id="scale-val">${(layer.scale || 1).toFixed(2)}x</span>
              </div>
              <input type="range" id="prop-scale" min="0.2" max="3" step="0.05" value="${layer.scale || 1}">
            </div>

            <div class="slider-control">
              <div class="slider-header">
                <label>Opacity</label>
                <span id="opacity-val">${Math.round((layer.opacity ?? 1) * 100)}%</span>
              </div>
              <input type="range" id="prop-opacity" min="0.1" max="1" step="0.05" value="${layer.opacity ?? 1}">
            </div>

            <div class="slider-control">
              <div class="slider-header">
                <label>Rotation</label>
                <span id="rotation-val">${layer.rotation || 0}°</span>
              </div>
              <input type="range" id="prop-rotation" min="-180" max="180" value="${layer.rotation || 0}">
            </div>
          </div>
        `;
      }

      // Layer Actions (Duplicate / Delete)
      content += `
        <div class="inspector-actions">
          <button class="btn btn-secondary btn-sm" id="btn-duplicate-layer">Duplicate Layer</button>
          ${!layer.locked ? `<button class="btn btn-danger btn-sm" id="btn-delete-layer">Delete</button>` : ''}
        </div>
      `;

      panel.innerHTML = content;
      this.attachInspectorEvents(layer);
    }

    attachInspectorEvents(layer) {
      const posX = document.getElementById('inspector-pos-x');
      const posY = document.getElementById('inspector-pos-y');
      if (posX) posX.addEventListener('input', (e) => {
        layer.x = parseFloat(e.target.value) || 0;
        this.updateCanvasDirectly();
      });
      if (posY) posY.addEventListener('input', (e) => {
        layer.y = parseFloat(e.target.value) || 0;
        this.updateCanvasDirectly();
      });

      // Text events
      const textVal = document.getElementById('prop-text-val');
      if (textVal) textVal.addEventListener('input', (e) => {
        layer.text = e.target.value;
        this.updateCanvasDirectly();
        this.onUpdate({ type: 'prop-change' });
      });

      const fontFamily = document.getElementById('prop-font-family');
      if (fontFamily) fontFamily.addEventListener('change', (e) => {
        layer.fontFamily = e.target.value;
        this.updateCanvasDirectly();
        this.onUpdate({ type: 'prop-change' });
      });

      const fontSize = document.getElementById('prop-font-size');
      if (fontSize) fontSize.addEventListener('input', (e) => {
        layer.fontSize = parseFloat(e.target.value);
        const label = document.getElementById('font-size-val');
        if (label) label.textContent = `${layer.fontSize}px`;
        this.updateCanvasDirectly();
      });

      const textColor = document.getElementById('prop-text-color');
      if (textColor) textColor.addEventListener('input', (e) => {
        layer.color = e.target.value;
        this.updateCanvasDirectly();
      });

      const hlWord = document.getElementById('prop-highlight-word');
      if (hlWord) hlWord.addEventListener('input', (e) => {
        layer.highlightWord = e.target.value;
        this.updateCanvasDirectly();
      });

      const hlColor = document.getElementById('prop-highlight-color');
      if (hlColor) hlColor.addEventListener('input', (e) => {
        layer.highlightColor = e.target.value;
        this.updateCanvasDirectly();
      });

      const letterSpacing = document.getElementById('prop-letter-spacing');
      if (letterSpacing) letterSpacing.addEventListener('input', (e) => {
        layer.letterSpacing = parseFloat(e.target.value) || 0;
        this.updateCanvasDirectly();
      });

      // Graphic / Metaphor events
      const focalSelect = document.getElementById('prop-focal-metaphor');
      if (focalSelect) focalSelect.addEventListener('change', (e) => {
        layer.metaphor = e.target.value;
        layer.name = `Focal: ${e.target.options[e.target.selectedIndex].text}`;
        this.updateCanvasDirectly();
        this.renderLayersList();
        this.onUpdate({ type: 'prop-change' });
      });

      const scale = document.getElementById('prop-scale');
      if (scale) scale.addEventListener('input', (e) => {
        layer.scale = parseFloat(e.target.value);
        const label = document.getElementById('scale-val');
        if (label) label.textContent = `${layer.scale.toFixed(2)}x`;
        this.updateCanvasDirectly();
      });

      const rot = document.getElementById('prop-rotation');
      if (rot) rot.addEventListener('input', (e) => {
        layer.rotation = parseInt(e.target.value, 10);
        const label = document.getElementById('rotation-val');
        if (label) label.textContent = `${layer.rotation}°`;
        this.updateCanvasDirectly();
      });

      const accent1 = document.getElementById('prop-theme-accent1');
      if (accent1) accent1.addEventListener('input', (e) => {
        this.engine.theme.accent1 = e.target.value;
        this.updateCanvasDirectly();
      });

      const accent2 = document.getElementById('prop-theme-accent2');
      if (accent2) accent2.addEventListener('input', (e) => {
        this.engine.theme.accent2 = e.target.value;
        this.updateCanvasDirectly();
      });

      const badgeText = document.getElementById('prop-badge-text');
      if (badgeText) badgeText.addEventListener('input', (e) => {
        layer.text = e.target.value;
        this.updateCanvasDirectly();
      });

      const opacity = document.getElementById('prop-opacity');
      if (opacity) opacity.addEventListener('input', (e) => {
        layer.opacity = parseFloat(e.target.value);
        const label = document.getElementById('opacity-val');
        if (label) label.textContent = `${Math.round(layer.opacity * 100)}%`;
        this.updateCanvasDirectly();
      });

      // Duplicate & Delete
      const btnDup = document.getElementById('btn-duplicate-layer');
      if (btnDup) btnDup.addEventListener('click', () => {
        const clone = { ...layer, id: 'layer_' + Date.now(), name: `${layer.name} (Copy)`, x: (layer.x || 0) + 20, y: (layer.y || 0) + 20 };
        this.engine.addLayer(clone);
        this.engine.selectedLayerId = clone.id;
        this.renderLayersList();
        this.renderInspector();
        this.updateCanvasDirectly();
        this.onUpdate({ type: 'layer-duplicate' });
      });

      const btnDel = document.getElementById('btn-delete-layer');
      if (btnDel) btnDel.addEventListener('click', () => {
        this.engine.removeLayer(layer.id);
        this.renderLayersList();
        this.renderInspector();
        this.updateCanvasDirectly();
        this.onUpdate({ type: 'layer-delete' });
      });
    }

    // Render Layers List
    renderLayersList() {
      const listContainer = document.getElementById('layers-list-items');
      if (!listContainer) return;

      const itemsHtml = [...this.engine.layers].reverse().map((layer) => {
        const isSelected = layer.id === this.engine.selectedLayerId;
        const escName = String(layer.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `
          <div class="layer-item ${isSelected ? 'selected' : ''}" data-layer-id="${layer.id}">
            <button class="layer-btn-vis" title="${layer.visible ? 'Hide' : 'Show'}" data-action="toggle-vis">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${layer.visible ? 
                  `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>` :
                  `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
                }
              </svg>
            </button>
            <span class="layer-title">${escName}</span>
            <div class="layer-actions">
              <button class="layer-btn" title="Move Up" data-action="move-up">▲</button>
              <button class="layer-btn" title="Move Down" data-action="move-down">▼</button>
              <button class="layer-btn" title="${layer.locked ? 'Unlock' : 'Lock'}" data-action="toggle-lock">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  ${layer.locked ? 
                    `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>` : 
                    `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>`
                  }
                </svg>
              </button>
            </div>
          </div>
        `;
      }).join('');

      listContainer.innerHTML = itemsHtml;

      // Attach click events
      listContainer.querySelectorAll('.layer-item').forEach(item => {
        const id = item.dataset.layerId;
        item.addEventListener('click', (e) => {
          const actionBtn = e.target.closest('[data-action]');
          if (actionBtn) {
            const action = actionBtn.dataset.action;
            const layer = this.engine.getLayer(id);
            if (!layer) return;

            if (action === 'toggle-vis') {
              layer.visible = !layer.visible;
            } else if (action === 'toggle-lock') {
              layer.locked = !layer.locked;
            } else if (action === 'move-up') {
              this.engine.reorderLayer(id, 'up');
            } else if (action === 'move-down') {
              this.engine.reorderLayer(id, 'down');
            }
            this.updateCanvasDirectly();
            this.renderLayersList();
            this.renderInspector();
            this.onUpdate({ type: 'layer-reorder' });
            return;
          }

          // Normal selection
          this.engine.selectedLayerId = id;
          this.renderLayersList();
          this.renderInspector();
          this.updateCanvasDirectly();
          this.onUpdate({ type: 'select', layer: this.engine.getLayer(id) });
        });
      });
    }
  }

  return {
    Editor
  };
})();
