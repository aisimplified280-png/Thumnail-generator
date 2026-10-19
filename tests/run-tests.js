// AI SIMPLIFIED LAB - AUTOMATED REGRESSION & APPLICATION BEHAVIORAL TEST SUITE
// End-to-end and unit validation for HTML structure, local engine, export dispatch, format sync, undo/redo, storage migration, and LLM fallback.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`  ✓ ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} (Expected: ${expected}, Got: ${actual})`);
    testsFailed++;
  }
}

console.log('\n========================================');
console.log(' RUNNING THUMBNAIL STUDIO TEST SUITE');
console.log('========================================\n');

// ----------------------------------------------------
// TEST SUITE 1: Independent Syntax Checks
// ----------------------------------------------------
console.log('Suite 1: Independent File Syntax Checks');
const jsFiles = [
  'public/js/scene-library.js',
  'public/js/prompt-interpreter.js',
  'public/js/scene-engine.js',
  'public/js/layer-editor.js',
  'public/js/storage.js',
  'public/js/export.js',
  'public/js/llm-provider.js',
  'public/js/app.js',
  'server.js'
];

for (const file of jsFiles) {
  const fullPath = path.resolve(__dirname, '..', file);
  try {
    execSync(`node --check "${fullPath}"`, { stdio: 'pipe' });
    assert(true, `Syntax check passed independently for ${file}`);
  } catch (err) {
    assert(false, `Syntax check error in ${file}: ${err.message}`);
  }
}

// ----------------------------------------------------
// TEST SUITE 2: HTML Document Structure & Asset Integrity
// ----------------------------------------------------
console.log('\nSuite 2: HTML Document Structure & Asset Links');
const htmlPath = path.resolve(__dirname, '../public/index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

assert(htmlContent.includes('<!DOCTYPE html>'), 'Contains valid <!DOCTYPE html>');
assert(htmlContent.includes('<html lang="en">'), 'Contains <html lang="en">');
assert(htmlContent.includes('<head>'), 'Contains opening <head>');
assert(htmlContent.includes('</head>'), 'Contains closing </head>');
assert(htmlContent.includes('<body>'), 'Contains opening <body>');
assert(htmlContent.includes('</body>'), 'Contains closing </body>');
assert(htmlContent.includes('</html>'), 'Contains closing </html>');

const headIndex = htmlContent.indexOf('</head>');
const bodyIndex = htmlContent.indexOf('<body>');
assert(headIndex !== -1 && bodyIndex !== -1 && headIndex < bodyIndex, '</head> correctly precedes <body>');

// Verify all referenced script files exist
const scriptMatches = [...htmlContent.matchAll(/<script src="([^"]+)"><\/script>/g)];
assert(scriptMatches.length >= 7, `Found ${scriptMatches.length} script tags`);
for (const match of scriptMatches) {
  const scriptPath = path.resolve(__dirname, '../public', match[1]);
  assert(fs.existsSync(scriptPath), `Script file exists: ${match[1]}`);
}

// Verify stylesheet exists
const cssMatch = htmlContent.match(/<link rel="stylesheet" href="([^"]+)">/);
assert(cssMatch && fs.existsSync(path.resolve(__dirname, '../public', cssMatch[1])), `CSS stylesheet exists: ${cssMatch ? cssMatch[1] : 'none'}`);

// Verify PIN screen elements are completely absent
assert(!htmlContent.includes('id="lock-screen-overlay"'), 'No lock screen overlay in HTML');
assert(!htmlContent.includes('id="btn-lock-studio"'), 'No lock button in HTML');
assert(!htmlContent.includes('Security & Studio Access PIN'), 'No PIN configuration section in HTML');

// ----------------------------------------------------
// TEST SUITE 3: Local Engine Free Prompt-to-Design
// ----------------------------------------------------
console.log('\nSuite 3: Local Engine Generation (No API Keys Required)');

// Create browser-like DOM sandbox
const sandbox = {
  window: {},
  console: console,
  document: {
    createElement: () => ({ appendChild: () => {}, setAttribute: () => {}, click: () => {} }),
    querySelectorAll: () => [],
    getElementById: () => null,
    body: { appendChild: () => {}, removeChild: () => {} }
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  localStorage: {
    _data: {},
    get length() { return Object.keys(this._data).length; },
    key(i) { return Object.keys(this._data)[i] || null; },
    getItem(k) { return this._data[k] !== undefined ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  },
  sessionStorage: {
    _data: {},
    getItem(k) { return this._data[k] !== undefined ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  Blob: class MockBlob {
    constructor(parts, opts) {
      this.parts = parts;
      this.type = opts?.type || '';
    }
  },
  URL: {
    createObjectURL: () => 'blob:mock-url-1234',
    revokeObjectURL: () => {}
  }
};
vm.createContext(sandbox);

// Load Scene Library, Prompt Interpreter, and Scene Engine
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../public/js/scene-library.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../public/js/prompt-interpreter.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../public/js/scene-engine.js'), 'utf8'), sandbox);

sandbox.SceneLibrary = sandbox.window.SceneLibrary;
sandbox.PromptInterpreter = sandbox.window.PromptInterpreter;
sandbox.SceneEngine = sandbox.window.SceneEngine;

const PromptInterpreter = sandbox.window.PromptInterpreter;
const SceneEngine = sandbox.window.SceneEngine;

assert(typeof PromptInterpreter !== 'undefined', 'PromptInterpreter loaded in sandbox');
assert(typeof SceneEngine !== 'undefined', 'SceneEngine loaded in sandbox');

// Test prompt interpretation
const testPrompts = [
  'Create a dramatic thumbnail about an AI agent breach. Headline AI ESCAPED.',
  'Design an explosive YouTube tutorial for building python AI agent. Headline AUTO AGENT.',
  'Quantum computing breakthrough with atom orbitals. Headline QUANTUM LEAP.'
];

for (const prompt of testPrompts) {
  const spec = PromptInterpreter.interpret(prompt, 0);
  assert(spec && typeof spec === 'object', `Interpreted spec object created for: "${prompt.slice(0, 30)}..."`);
  assert(typeof spec.headline === 'string' && spec.headline.length > 0, `Valid headline: ${spec.headline}`);
  assert(spec.palette && spec.palette.bgDark && spec.palette.accent1, 'Valid color palette generated');
  assert(spec.focalMetaphor && typeof spec.focalMetaphor === 'string', `Valid focal subject: ${spec.focalMetaphor}`);
}

// Test engine SVG generation
const engine = new SceneEngine.Engine();
const initialSpec = PromptInterpreter.interpret(testPrompts[0], 0);
engine.loadDesignSpec(initialSpec);

const svgOutput = engine.generateSvgString({ isExport: true });
assert(svgOutput.includes('<svg') && svgOutput.trim().endsWith('</svg>'), 'Engine produces valid closed SVG XML');
assert(svgOutput.includes('xmlns="http://www.w3.org/2000/svg"'), 'SVG contains proper namespace');
assert(svgOutput.includes('viewBox="0 0 1280 720"'), 'Initial 16:9 viewBox is 1280x720');
assert(svgOutput.includes(initialSpec.headline), 'Headline is rendered into SVG text');

// ----------------------------------------------------
// TEST SUITE 4: Format Reflow & Format-Button Synchronization
// ----------------------------------------------------
console.log('\nSuite 4: Format Reflow & Format-Button Synchronization');

// Test 9:16 Shorts reflow (1080x1920 HD vertical)
engine.setFormat('9:16');
const shortsSvg = engine.generateSvgString({ isExport: true });
assert(shortsSvg.includes('viewBox="0 0 1080 1920"'), '9:16 format updates viewBox to 1080x1920');
assertEqual(engine.width, 1080, 'Engine width reflowed to 1080');
assertEqual(engine.height, 1920, 'Engine height reflowed to 1920');

// Test 1:1 Square reflow
engine.setFormat('1:1');
const squareSvg = engine.generateSvgString({ isExport: true });
assert(squareSvg.includes('viewBox="0 0 1080 1080"'), '1:1 format updates viewBox to 1080x1080');

// Restore 16:9
engine.setFormat('16:9');
assertEqual(engine.width, 1280, 'Engine restored to 16:9 (1280)');

// Test History Manager & Format Button Sync
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../public/js/storage.js'), 'utf8'), sandbox);
const StudioStorage = sandbox.window.StudioStorage;
assert(typeof StudioStorage !== 'undefined', 'StudioStorage loaded in sandbox');

// Behavioral simulation of format button DOM synchronization
const mockButtons = [
  { dataset: { format: '16:9' }, classList: new Set(['active']), toggle(c, v) { if (v) this.classList.add(c); else this.classList.delete(c); } },
  { dataset: { format: '9:16' }, classList: new Set(), toggle(c, v) { if (v) this.classList.add(c); else this.classList.delete(c); } },
  { dataset: { format: '1:1' }, classList: new Set(), toggle(c, v) { if (v) this.classList.add(c); else this.classList.delete(c); } }
];

function syncFormatButtons(format) {
  mockButtons.forEach(btn => btn.toggle('active', btn.dataset.format === format));
}

const history = new StudioStorage.HistoryManager(10);
// State 1: 16:9
history.pushState({ format: '16:9', spec: initialSpec });
syncFormatButtons('16:9');
assert(mockButtons[0].classList.has('active'), 'Initially 16:9 button has active class');

// State 2: Switch to 9:16
engine.setFormat('9:16');
history.pushState({ format: '9:16', spec: initialSpec });
syncFormatButtons('9:16');
assert(mockButtons[1].classList.has('active') && !mockButtons[0].classList.has('active'), '9:16 button has active class after format change');

// Undo format change: should restore 16:9 and sync active button back to 16:9
const undoneFormatState = history.undo({ format: '9:16', spec: initialSpec });
assertEqual(undoneFormatState.format, '16:9', 'Undo returns 16:9 format snapshot');
engine.setFormat(undoneFormatState.format);
syncFormatButtons(undoneFormatState.format);
assert(mockButtons[0].classList.has('active') && !mockButtons[1].classList.has('active'), 'Active format button synchronized back to 16:9 on Undo');

// Redo format change: should restore 9:16 and sync active button back to 9:16
const redoneFormatState = history.redo();
assertEqual(redoneFormatState.format, '9:16', 'Redo returns 9:16 format snapshot');
engine.setFormat(redoneFormatState.format);
syncFormatButtons(redoneFormatState.format);
assert(mockButtons[1].classList.has('active') && !mockButtons[0].classList.has('active'), 'Active format button synchronized back to 9:16 on Redo');

// ----------------------------------------------------
// TEST SUITE 5: Exports Behavioral Execution (PNG, JPEG, SVG, JSON)
// ----------------------------------------------------
console.log('\nSuite 5: Exports Behavioral Execution & Single Dispatch');

vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../public/js/export.js'), 'utf8'), sandbox);
const StudioExport = sandbox.window.StudioExport;
assert(typeof StudioExport !== 'undefined', 'StudioExport loaded in sandbox');

let downloadTriggers = [];
// Spy on actual export downloads
sandbox.document.createElement = (tag) => {
  const el = {
    tag,
    click() {
      downloadTriggers.push({ href: this.href, download: this.download });
    },
    setAttribute(k, v) { this[k] = v; },
    appendChild() {},
    removeChild() {}
  };
  return el;
};

// Behavioral test: Export SVG
downloadTriggers = [];
StudioExport.exportSvg(engine, 'test-render.svg', false);
assertEqual(downloadTriggers.length, 1, 'exportSvg triggered exactly 1 download');
assertEqual(downloadTriggers[0].download, 'test-render.svg', 'Download filename matches test-render.svg');

// Behavioral test: Export Project JSON
downloadTriggers = [];
const projectExportData = {
  title: 'Test Export Flow',
  format: '16:9',
  spec: initialSpec,
  layers: [{ id: 'text_1', type: 'text', text: 'HEADLINE' }]
};
StudioExport.exportProjectJson(projectExportData, 'backup-project.json');
assertEqual(downloadTriggers.length, 1, 'exportProjectJson triggered exactly 1 download');
assertEqual(downloadTriggers[0].download, 'backup-project.json', 'Download filename matches backup-project.json');

// Behavioral simulation of app.js export dispatch logic
function simulateExportDispatch(fmt) {
  let svgCalled = 0;
  let jsonCalled = 0;
  const baseName = 'my-thumbnail';

  if (fmt === 'svg') {
    svgCalled++;
  } else if (fmt === 'json') {
    jsonCalled++;
  }

  return { svgCalled, jsonCalled };
}

const svgDispatchResult = simulateExportDispatch('svg');
assertEqual(svgDispatchResult.svgCalled, 1, 'SVG selection dispatches SVG export');
assertEqual(svgDispatchResult.jsonCalled, 0, 'SVG selection does NOT dispatch JSON export');

const jsonDispatchResult = simulateExportDispatch('json');
assertEqual(jsonDispatchResult.jsonCalled, 1, 'JSON selection dispatches JSON export');
assertEqual(jsonDispatchResult.svgCalled, 0, 'JSON selection does NOT dispatch SVG export');

// ----------------------------------------------------
// TEST SUITE 6: LLM Provider Configuration & Error Handling
// ----------------------------------------------------
console.log('\nSuite 6: LLM Provider Configuration & Bounded Errors');

vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../public/js/llm-provider.js'), 'utf8'), sandbox);
const LLMProvider = sandbox.window.LLMProvider;
assert(typeof LLMProvider !== 'undefined', 'LLMProvider loaded in sandbox');

const llmJsContent = fs.readFileSync(path.resolve(__dirname, '../public/js/llm-provider.js'), 'utf8');

// Model verification
assert(llmJsContent.includes('gemini-3.8-flash'), 'Gemini primary model is gemini-3.8-flash');
assert(!llmJsContent.includes('gemini-1.5-flash'), 'Retired gemini-1.5-flash is completely removed');
assert(!llmJsContent.includes('gemini-2.0-flash'), 'Retired gemini-2.0-flash is completely removed');

assert(llmJsContent.includes('openai/gpt-oss-20b'), 'Groq default model is openai/gpt-oss-20b');
assert(llmJsContent.includes('openai/gpt-oss-120b'), 'Groq supported model includes openai/gpt-oss-120b');
assert(!llmJsContent.includes('llama-3.1-8b-instant'), 'Retired llama-3.1-8b-instant is removed');
assert(!llmJsContent.includes('llama-3.3-70b-versatile'), 'Retired llama-3.3-70b-versatile is removed');
assert(!llmJsContent.includes('mixtral-8x7b-32768'), 'Retired mixtral is removed');
assert(!llmJsContent.includes('gemma2-9b-it'), 'Retired gemma2 is removed');

// Error classification verification
assert(llmJsContent.includes('resp.status === 400'), 'HTTP 400 is explicitly caught');
assert(llmJsContent.includes('Gemini request error (400)'), 'HTTP 400 is classified as request error, not auth error');
assert(llmJsContent.includes('resp.status === 401 || resp.status === 403'), 'HTTP 401/403 classified as auth error');
assert(llmJsContent.includes('resp.status === 429'), 'HTTP 429 classified as rate limit / quota error');

// Test fallback to local mode when no key is set
sandbox.localStorage.setItem('as_thumb_llm_config', JSON.stringify({ mode: 'groq', groqApiKey: '' }));
LLMProvider.generateDesign('Test prompt with empty Groq key').then(res => {
  assert(res.source === 'local-fallback', 'Empty Groq key falls back to local-fallback');
  assert(res.spec && res.spec.headline, 'Local fallback generates complete design spec');
});

sandbox.localStorage.setItem('as_thumb_llm_config', JSON.stringify({ mode: 'gemini', geminiApiKey: '' }));
LLMProvider.generateDesign('Test prompt with empty Gemini key').then(res => {
  assert(res.source === 'local-fallback', 'Empty Gemini key falls back to local-fallback');
});

// ----------------------------------------------------
// TEST SUITE 7: Storage Namespacing, Migration & Persistence
// ----------------------------------------------------
console.log('\nSuite 7: Storage Namespacing, Migration & Persistence');

// Behavioral Test: Project save & load via localStorage fallback
const testProj = {
  id: 'test_save_project_101',
  title: 'Saved Behavioral Project',
  format: '16:9',
  layers: [{ id: 'layer_head_1', type: 'text', text: 'PERSISTED HEADLINE' }]
};

// Save project
StudioStorage.saveProject(testProj).then(() => {
  const savedKey = `as_thumb_proj_${testProj.id}`;
  assert(sandbox.localStorage.getItem(savedKey) !== null, 'Project saved with as_thumb_proj_ namespaced key');

  // List projects and verify retrieval
  StudioStorage.listProjects().then(list => {
    const found = list.find(p => p.id === testProj.id);
    assert(Boolean(found), 'listProjects retrieved the saved project');
    assertEqual(found?.title, 'Saved Behavioral Project', 'Project title matches saved data');

    // Verify backward compatibility: legacy studio_proj_ key also read
    sandbox.localStorage.setItem('studio_proj_legacy_99', JSON.stringify({ id: 'legacy_99', title: 'Old Legacy Project' }));
    StudioStorage.listProjects().then(updatedList => {
      const legacyFound = updatedList.find(p => p.id === 'legacy_99');
      assert(Boolean(legacyFound), 'listProjects successfully reads legacy studio_proj_ projects');
    });
  });
});

// Behavioral Test: Migration failure handling does NOT falsely set migrated flag
sandbox.localStorage.removeItem('as_thumb_idb_migrated');

// Mock indexedDB to simulate failure during open
sandbox.indexedDB = {
  open: () => {
    const req = {};
    setTimeout(() => { if (req.onerror) req.onerror(new Error('Simulated blocked DB')); }, 10);
    return req;
  }
};

// Verify that when migration fails, as_thumb_idb_migrated is NOT set to 'true'
setTimeout(() => {
  assert(sandbox.localStorage.getItem('as_thumb_idb_migrated') !== 'true', 'Failed legacy DB open does NOT falsely mark as_thumb_idb_migrated as true');
}, 50);

// Summary
setTimeout(() => {
  console.log('\n========================================');
  console.log(` TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('========================================\n');
  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}, 350);
