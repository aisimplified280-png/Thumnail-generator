// AI SIMPLIFIED LAB - MAIN APPLICATION CONTROLLER
// Glues all modules, UI controls, project management, and viewport interactions.

(function() {
  'use strict';

  let engine = null;
  let editor = null;
  let historyManager = null;
  let activeProjectId = 'proj_default';
  let remixCounter = 0;
  let currentZoom = 1.0;

  // DOM Elements
  const canvasContainer = document.getElementById('canvas-container');
  const canvasWrapper = document.getElementById('canvas-stage-wrapper');
  const promptInput = document.getElementById('prompt-input');
  const projectTitleInput = document.getElementById('project-title');
  const zoomValueLabel = document.getElementById('zoom-value');
  const badgeGenMode = document.getElementById('badge-gen-mode');

  // Initialize
  async function init() {
    engine = new SceneEngine.Engine();
    historyManager = new StudioStorage.HistoryManager(30);

    // Initialize Layer Editor
    editor = new LayerEditor.Editor(engine, onLayerStateChange);

    // Bind UI Events
    bindHeaderEvents();
    bindPromptEvents();
    bindZoomEvents();
    bindTabs();
    bindModalEvents();
    bindQuickAddTools();

    // Load Initial Design
    const initialPrompt = promptInput.value.trim();
    const result = await LLMProvider.generateDesign(initialPrompt, 0);
    engine.loadDesignSpec(result.spec);

    updateCanvas();
    editor.renderLayersList();
    editor.renderInspector();

    // Auto-fit to viewport
    setTimeout(fitToScreen, 100);

    // Push initial history state
    pushHistoryState();

    // Update Gen Mode Badge
    updateGenModeBadge();

    // Try restoring recent projects
    try {
      await StudioStorage.initDB();
    } catch (e) {
      console.warn('DB init note:', e);
    }
  }

  // Update canvas DOM
  function updateCanvas() {
    if (!canvasContainer) return;
    canvasContainer.innerHTML = engine.generateSvgString({ isExport: false });
  }

  // Update mode badge
  function updateGenModeBadge() {
    if (!badgeGenMode) return;
    const cfg = LLMProvider.getConfig();
    if (cfg.mode === 'local') {
      badgeGenMode.textContent = 'Mode A: Local Engine (Free, Offline)';
      badgeGenMode.style.color = 'var(--accent-emerald)';
    } else if (cfg.mode === 'pages-api') {
      badgeGenMode.textContent = 'Mode B: Pages API (/api/design)';
      badgeGenMode.style.color = 'var(--accent-cyan)';
    } else {
      badgeGenMode.textContent = `Mode B: Direct ${cfg.mode.toUpperCase()}`;
      badgeGenMode.style.color = 'var(--accent-cyan)';
    }
  }

  // State update callback from editor
  function onLayerStateChange(evt) {
    if (evt.type !== 'select' && evt.type !== 'deselect') {
      pushHistoryState();
      autoSaveProject();
    }
  }

  // History stack management
  function pushHistoryState() {
    const snapshot = {
      spec: engine.spec,
      layers: engine.layers.map(l => ({
        id: l.id,
        name: l.name,
        type: l.type,
        visible: l.visible,
        locked: l.locked,
        x: l.x,
        y: l.y,
        scale: l.scale,
        rotation: l.rotation,
        text: l.text,
        fontFamily: l.fontFamily,
        fontSize: l.fontSize,
        fontWeight: l.fontWeight,
        color: l.color,
        highlightWord: l.highlightWord,
        highlightColor: l.highlightColor,
        letterSpacing: l.letterSpacing,
        metaphor: l.metaphor,
        dataUrl: l.dataUrl,
        opacity: l.opacity
      })),
      theme: { ...engine.theme },
      format: engine.currentFormat
    };

    historyManager.pushState(snapshot);
    updateUndoRedoButtons();
  }

  function restoreHistoryState(state) {
    if (!state) return;
    engine.restoreFromSnapshot(state);
    updateCanvas();
    editor.renderLayersList();
    editor.renderInspector();
    updateUndoRedoButtons();
  }

  function updateUndoRedoButtons() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (btnUndo) btnUndo.style.opacity = historyManager.canUndo() ? '1' : '0.4';
    if (btnRedo) btnRedo.style.opacity = historyManager.canRedo() ? '1' : '0.4';
  }

  // Auto save current project to storage
  async function autoSaveProject() {
    try {
      const thumbData = await StudioExport.generateThumbnailPreview(engine);
      const project = {
        id: activeProjectId,
        title: projectTitleInput.value.trim() || 'Untitled Thumbnail',
        format: engine.currentFormat,
        spec: engine.spec,
        theme: engine.theme,
        layers: engine.layers.map(l => ({
          id: l.id,
          name: l.name,
          type: l.type,
          visible: l.visible,
          locked: l.locked,
          x: l.x,
          y: l.y,
          scale: l.scale,
          rotation: l.rotation,
          text: l.text,
          fontFamily: l.fontFamily,
          fontSize: l.fontSize,
          fontWeight: l.fontWeight,
          color: l.color,
          highlightWord: l.highlightWord,
          highlightColor: l.highlightColor,
          letterSpacing: l.letterSpacing,
          metaphor: l.metaphor,
          dataUrl: l.dataUrl,
          opacity: l.opacity
        })),
        thumbnail: thumbData
      };

      await StudioStorage.saveProject(project);
    } catch (e) {
      console.warn('Auto-save note:', e);
    }
  }

  // Header Events
  function bindHeaderEvents() {
    // Project title change
    projectTitleInput.addEventListener('change', autoSaveProject);

    // Format reflow buttons (16:9, 9:16, 1:1)
    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const fmt = btn.dataset.format;
        engine.setFormat(fmt);
        updateCanvas();
        editor.renderLayersList();
        editor.renderInspector();
        fitToScreen();
        pushHistoryState();
        autoSaveProject();
        showToast(`Reflowed to ${btn.textContent.trim()}`);
      });
    });

    // Undo / Redo
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');

    btnUndo.addEventListener('click', () => {
      if (historyManager.canUndo()) {
        const curSnapshot = {
          spec: engine.spec,
          layers: engine.layers,
          theme: engine.theme,
          format: engine.currentFormat
        };
        const prev = historyManager.undo(curSnapshot);
        restoreHistoryState(prev);
        showToast('Undo');
      }
    });

    btnRedo.addEventListener('click', () => {
      if (historyManager.canRedo()) {
        const next = historyManager.redo();
        restoreHistoryState(next);
        showToast('Redo');
      }
    });

    // Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          btnUndo.click();
        } else if (e.key === 'y' || (e.shiftKey && e.key === 'z')) {
          e.preventDefault();
          btnRedo.click();
        }
      }
    });
  }

  // Prompt & Generation Events
  function bindPromptEvents() {
    const btnGenerate = document.getElementById('btn-generate');
    const btnRemix = document.getElementById('btn-remix');

    btnGenerate.addEventListener('click', async () => {
      const prompt = promptInput.value.trim();
      if (!prompt) return;

      btnGenerate.disabled = true;
      btnGenerate.innerHTML = 'Generating...';

      try {
        const result = await LLMProvider.generateDesign(prompt, remixCounter);
        engine.loadDesignSpec(result.spec);
        updateCanvas();
        editor.renderLayersList();
        editor.renderInspector();
        fitToScreen();
        pushHistoryState();
        autoSaveProject();

        if (result.source === 'local') {
          showToast('Design generated locally (100% Free)', 'success');
        } else if (result.source.includes('fallback')) {
          showToast(`LLM unavailable (${result.error || 'limit reached'}). Rendered with Local Engine!`, 'info');
        } else {
          showToast(`Generated using ${result.source.toUpperCase()}`, 'success');
        }
      } catch (err) {
        showToast('Generation error: ' + err.message, 'error');
      } finally {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Generate
        `;
      }
    });

    btnRemix.addEventListener('click', async () => {
      remixCounter++;
      const prompt = promptInput.value.trim();
      const result = await LLMProvider.generateDesign(prompt, remixCounter);
      engine.loadDesignSpec(result.spec);
      updateCanvas();
      editor.renderLayersList();
      editor.renderInspector();
      pushHistoryState();
      autoSaveProject();
      showToast(`Remixed composition (Variation #${remixCounter})`);
    });

    // Chips
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        promptInput.value = chip.dataset.prompt;
        btnGenerate.click();
      });
    });
  }

  // Quick Add Layer Buttons
  function bindQuickAddTools() {
    document.getElementById('btn-add-headline').addEventListener('click', () => {
      const id = 'layer_text_' + Date.now();
      engine.addLayer({
        id,
        name: 'Custom Headline',
        type: 'text',
        visible: true,
        locked: false,
        x: 80,
        y: 340,
        text: 'NEW HEADLINE',
        fontFamily: "'Anton', sans-serif",
        fontSize: 84,
        fontWeight: '900',
        color: '#ffffff',
        highlightWord: '',
        highlightColor: engine.theme.accent2,
        render: (l) => engine.renderHeadlineText(l)
      });
      engine.selectedLayerId = id;
      updateCanvas();
      editor.renderLayersList();
      editor.renderInspector();
      pushHistoryState();
      showToast('Headline layer added');
    });

    document.getElementById('btn-add-subtitle').addEventListener('click', () => {
      const id = 'layer_sub_' + Date.now();
      engine.addLayer({
        id,
        name: 'Supporting Subtitle',
        type: 'text',
        visible: true,
        locked: false,
        x: 80,
        y: 420,
        text: 'EXPLAINED STEP BY STEP',
        fontFamily: "'Montserrat', sans-serif",
        fontSize: 22,
        fontWeight: '800',
        color: engine.theme.accent1,
        letterSpacing: 2,
        render: (l) => `
          <g transform="translate(${l.x}, ${l.y})">
            <text x="0" y="0" font-family="${l.fontFamily}" font-size="${l.fontSize}" font-weight="${l.fontWeight}" fill="${l.color}" letter-spacing="${l.letterSpacing}">
              ${l.text.toUpperCase()}
            </text>
          </g>
        `
      });
      engine.selectedLayerId = id;
      updateCanvas();
      editor.renderLayersList();
      editor.renderInspector();
      pushHistoryState();
      showToast('Subtitle layer added');
    });

    document.getElementById('btn-add-badge').addEventListener('click', () => {
      const id = 'layer_badge_' + Date.now();
      engine.addLayer({
        id,
        name: 'Custom Badge',
        type: 'badge',
        visible: true,
        locked: false,
        x: 80,
        y: 140,
        text: 'SPECIAL REPORT',
        render: (l) => `
          <g transform="translate(${l.x}, ${l.y})">
            <rect x="0" y="0" width="220" height="42" rx="8" fill="#0d0e17" stroke="${engine.theme.accent2}" stroke-width="2.5" />
            <polygon points="6,6 18,6 10,36 6,36" fill="${engine.theme.accent2}" />
            <text x="115" y="27" font-family="'JetBrains Mono', sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">
              ${(l.text || '').toUpperCase()}
            </text>
          </g>
        `
      });
      engine.selectedLayerId = id;
      updateCanvas();
      editor.renderLayersList();
      editor.renderInspector();
      pushHistoryState();
      showToast('Badge layer added');
    });

    // Upload Logo / Image Asset
    const fileUpload = document.getElementById('file-asset-upload');
    document.getElementById('btn-upload-asset').addEventListener('click', () => {
      fileUpload.click();
    });

    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        const id = 'layer_img_' + Date.now();
        engine.addLayer({
          id,
          name: `Image: ${file.name.slice(0, 16)}`,
          type: 'user-image',
          visible: true,
          locked: false,
          x: engine.width * 0.4,
          y: engine.height * 0.4,
          width: 320,
          height: 320,
          scale: 1.0,
          rotation: 0,
          opacity: 1.0,
          dataUrl
        });

        engine.selectedLayerId = id;
        updateCanvas();
        editor.renderLayersList();
        editor.renderInspector();
        pushHistoryState();
        showToast('Uploaded asset added');
      };
      reader.readAsDataURL(file);
      fileUpload.value = '';
    });
  }

  // Zoom & Viewport Toolbar
  function bindZoomEvents() {
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomFit = document.getElementById('btn-zoom-fit');
    const btnToggleSafe = document.getElementById('btn-toggle-safe-guides');

    btnZoomIn.addEventListener('click', () => setZoom(currentZoom + 0.15));
    btnZoomOut.addEventListener('click', () => setZoom(currentZoom - 0.15));
    btnZoomFit.addEventListener('click', fitToScreen);

    btnToggleSafe.addEventListener('click', () => {
      engine.showSafeGuides = !engine.showSafeGuides;
      btnToggleSafe.classList.toggle('active', engine.showSafeGuides);
      updateCanvas();
      showToast(engine.showSafeGuides ? 'YouTube safe guides enabled' : 'YouTube safe guides disabled');
    });
  }

  function setZoom(val) {
    currentZoom = Math.min(2.5, Math.max(0.2, val));
    canvasContainer.style.transform = `scale(${currentZoom})`;
    zoomValueLabel.textContent = `${Math.round(currentZoom * 100)}%`;
  }

  function fitToScreen() {
    if (!canvasWrapper) return;
    const availW = canvasWrapper.clientWidth - 80;
    const availH = canvasWrapper.clientHeight - 80;
    const scaleX = availW / engine.width;
    const scaleY = availH / engine.height;
    const fitScale = Math.min(scaleX, scaleY, 1.0);
    setZoom(fitScale);
  }

  // Tabs
  function bindTabs() {
    const tabInspector = document.getElementById('tab-btn-inspector');
    const tabLayers = document.getElementById('tab-btn-layers');
    const contentInspector = document.getElementById('tab-content-inspector');
    const contentLayers = document.getElementById('tab-content-layers');

    tabInspector.addEventListener('click', () => {
      tabInspector.classList.add('active');
      tabLayers.classList.remove('active');
      contentInspector.style.display = 'block';
      contentLayers.style.display = 'none';
      editor.renderInspector();
    });

    tabLayers.addEventListener('click', () => {
      tabLayers.classList.add('active');
      tabInspector.classList.remove('active');
      contentInspector.style.display = 'none';
      contentLayers.style.display = 'block';
      editor.renderLayersList();
    });
  }

  // Modals (Projects, Settings, Export)
  function bindModalEvents() {
    // Projects Modal
    const modalProjects = document.getElementById('modal-projects');
    document.getElementById('btn-open-projects').addEventListener('click', async () => {
      modalProjects.classList.add('open');
      await renderProjectsGrid();
    });
    document.getElementById('btn-close-projects-modal').addEventListener('click', () => {
      modalProjects.classList.remove('open');
    });

    // New Project
    document.getElementById('btn-new-project').addEventListener('click', () => {
      activeProjectId = 'proj_' + Date.now();
      projectTitleInput.value = 'Untitled Thumbnail';
      promptInput.value = 'Create a futuristic cybersecurity thumbnail about an AI agent breaching a secure data vault. Headline "AI ESCAPED?"';
      document.getElementById('btn-generate').click();
      modalProjects.classList.remove('open');
    });

    // Import Project JSON
    const fileImportJson = document.getElementById('file-import-json');
    document.getElementById('btn-import-project-json').addEventListener('click', () => fileImportJson.click());
    fileImportJson.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const projectData = JSON.parse(evt.target.result);
          if (projectData.layers || projectData.spec) {
            engine.loadProject(projectData);
            projectTitleInput.value = projectData.title || 'Imported Project';
            updateCanvas();
            editor.renderLayersList();
            editor.renderInspector();
            modalProjects.classList.remove('open');
            pushHistoryState();
            showToast('Project JSON imported successfully', 'success');
          }
        } catch (err) {
          showToast('Invalid JSON file', 'error');
        }
      };
      reader.readAsText(file);
      fileImportJson.value = '';
    });

    // Settings Modal
    const modalSettings = document.getElementById('modal-settings');
    const selectProvider = document.getElementById('setting-provider-mode');
    const groqGroup = document.getElementById('settings-groq-group');
    const geminiGroup = document.getElementById('settings-gemini-group');
    const groqKeyInput = document.getElementById('setting-groq-key');
    const geminiKeyInput = document.getElementById('setting-gemini-key');

    const groqModelSelect = document.getElementById('setting-groq-model');

    document.getElementById('btn-open-settings').addEventListener('click', () => {
      const cfg = LLMProvider.getConfig();
      selectProvider.value = cfg.mode || 'local';
      groqKeyInput.value = cfg.groqApiKey || '';
      if (groqModelSelect) groqModelSelect.value = cfg.groqModel || 'llama-3.1-8b-instant';
      geminiKeyInput.value = cfg.geminiApiKey || '';
      updateSettingsVisibility();
      modalSettings.classList.add('open');
    });

    selectProvider.addEventListener('change', updateSettingsVisibility);

    function updateSettingsVisibility() {
      const val = selectProvider.value;
      groqGroup.style.display = val === 'groq' ? 'block' : 'none';
      geminiGroup.style.display = val === 'gemini' ? 'block' : 'none';
    }

    document.getElementById('btn-close-settings-modal').addEventListener('click', () => {
      modalSettings.classList.remove('open');
    });

    document.getElementById('btn-save-settings').addEventListener('click', () => {
      LLMProvider.saveConfig({
        mode: selectProvider.value,
        groqApiKey: groqKeyInput.value.trim(),
        groqModel: groqModelSelect ? groqModelSelect.value : 'llama-3.1-8b-instant',
        geminiApiKey: geminiKeyInput.value.trim()
      });
      updateGenModeBadge();
      modalSettings.classList.remove('open');
      showToast('Settings saved successfully', 'success');
    });

    // Export Modal
    const modalExport = document.getElementById('modal-export');
    const exportFormatSelect = document.getElementById('export-format-select');
    const exportScaleSelect = document.getElementById('export-scale-select');
    const exportTransparentBg = document.getElementById('export-transparent-bg');
    const exportScaleGroup = document.getElementById('export-scale-group');
    const exportTranspGroup = document.getElementById('export-transparent-group');

    document.getElementById('btn-open-export').addEventListener('click', () => {
      modalExport.classList.add('open');
    });
    document.getElementById('btn-close-export-modal').addEventListener('click', () => {
      modalExport.classList.remove('open');
    });
    document.getElementById('btn-close-export-btn').addEventListener('click', () => {
      modalExport.classList.remove('open');
    });

    exportFormatSelect.addEventListener('change', () => {
      const fmt = exportFormatSelect.value;
      exportScaleGroup.style.display = (fmt === 'png' || fmt === 'jpeg') ? 'block' : 'none';
      exportTranspGroup.style.display = (fmt === 'png' || fmt === 'svg') ? 'block' : 'none';
    });

    document.getElementById('btn-do-export').addEventListener('click', async () => {
      const fmt = exportFormatSelect.value;
      const scale = parseFloat(exportScaleSelect.value) || 1;
      const transparent = exportTransparentBg.checked;
      const baseName = (projectTitleInput.value.trim() || 'thumbnail').replace(/[^a-zA-Z0-9_-]/g, '_');

      try {
        if (fmt === 'png') {
          await StudioExport.exportPng(engine, `${baseName}.png`, scale, transparent);
        } else if (fmt === 'jpeg') {
          await StudioExport.exportJpeg(engine, `${baseName}.jpg`, 0.92, scale);
        } else if (fmt === 'svg') {
          await StudioExport.exportSvg(engine, `${baseName}.svg`, transparent);
          const projectData = {
            title: projectTitleInput.value.trim(),
            format: engine.currentFormat,
            spec: engine.spec,
            theme: engine.theme,
            layers: engine.layers.map(l => ({
              id: l.id,
              name: l.name,
              type: l.type,
              visible: l.visible,
              locked: l.locked,
              x: l.x,
              y: l.y,
              scale: l.scale,
              rotation: l.rotation,
              text: l.text,
              fontFamily: l.fontFamily,
              fontSize: l.fontSize,
              fontWeight: l.fontWeight,
              color: l.color,
              highlightWord: l.highlightWord,
              highlightColor: l.highlightColor,
              letterSpacing: l.letterSpacing,
              metaphor: l.metaphor,
              dataUrl: l.dataUrl,
              opacity: l.opacity
            }))
          };
          StudioExport.exportProjectJson(projectData, `${baseName}.json`);
        }

        modalExport.classList.remove('open');
        showToast(`Exported as ${fmt.toUpperCase()}`, 'success');
      } catch (err) {
        showToast('Export failed: ' + err.message, 'error');
      }
    });
  }

  // Render recent projects list in modal
  async function renderProjectsGrid() {
    const grid = document.getElementById('modal-projects-grid');
    if (!grid) return;

    const projects = await StudioStorage.listProjects();
    if (projects.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-dim); grid-column: span 2; text-align: center; padding: 20px;">No saved projects yet. Edits save automatically!</p>';
      return;
    }

    grid.innerHTML = projects.map(p => `
      <div class="project-card" data-proj-id="${p.id}">
        <img src="${p.thumbnail || ''}" class="project-thumb" alt="${p.title}">
        <div class="project-meta">
          <h5>${p.title}</h5>
          <span>${new Date(p.updatedAt).toLocaleDateString()} &bull; ${p.format || '16:9'}</span>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', async () => {
        const id = card.dataset.projId;
        const project = projects.find(p => p.id === id);
        if (project) {
          activeProjectId = project.id;
          projectTitleInput.value = project.title || 'Untitled Thumbnail';
          engine.loadProject(project);
          updateCanvas();
          editor.renderLayersList();
          editor.renderInspector();
          fitToScreen();
          document.getElementById('modal-projects').classList.remove('open');
          showToast(`Opened project: ${project.title}`);
        }
      });
    });
  }

  // Toast Notification
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => container.removeChild(toast), 300);
    }, 3200);
  }

  // Bootstrap when DOM is ready
  window.addEventListener('DOMContentLoaded', init);
  window.addEventListener('resize', fitToScreen);

})();
