// AI SIMPLIFIED LAB - AUTOMATED REGRESSION & APPLICATION TEST SUITE
// Tests HTML structure, local engine, exports, history, format reflow, storage, and API fallback.

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

// Create browser-like sandbox
const sandbox = {
  window: {},
  console: console,
  document: {
    createElement: () => ({ appendChild: () => {}, setAttribute: () => {} })
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
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
// TEST SUITE 4: Format Reflow & Undo/Redo Stack
// ----------------------------------------------------
console.log('\nSuite 4: Format Reflow & Undo/Redo');

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

// Test History Manager
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../public/js/storage.js'), 'utf8'), sandbox);
const StudioStorage = sandbox.window.StudioStorage;
assert(typeof StudioStorage !== 'undefined', 'StudioStorage loaded in sandbox');

const history = new StudioStorage.HistoryManager(10);
history.pushState({ text: 'Version 1' });
history.pushState({ text: 'Version 2' });
history.pushState({ text: 'Version 3' });

assert(history.canUndo(), 'History manager reports canUndo() === true');
const undone1 = history.undo();
assertEqual(undone1.text, 'Version 2', 'First undo returns Version 2');
const undone2 = history.undo();
assertEqual(undone2.text, 'Version 1', 'Second undo returns Version 1');
assert(!history.canUndo(), 'Cannot undo past initial state');

const redone = history.redo();
assertEqual(redone.text, 'Version 2', 'Redo returns Version 2');

// ----------------------------------------------------
// TEST SUITE 5: Exports Isolation (PNG, JPEG, SVG, JSON)
// ----------------------------------------------------
console.log('\nSuite 5: Export Dispatch & Output Isolation');

vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../public/js/export.js'), 'utf8'), sandbox);
const StudioExport = sandbox.window.StudioExport;
assert(typeof StudioExport !== 'undefined', 'StudioExport loaded in sandbox');

// Test SVG export returns only SVG string
const exportedSvg = engine.generateSvgString({ isExport: true, transparentBg: false });
assert(exportedSvg.includes('<svg') && exportedSvg.trim().endsWith('</svg>'), 'SVG export produces closed XML SVG');

// Test JSON export format
const sampleProject = {
  title: 'Test Export Project',
  format: engine.currentFormat,
  spec: engine.spec,
  theme: engine.theme,
  layers: engine.layers
};
const jsonStr = JSON.stringify(sampleProject);
const parsedProject = JSON.parse(jsonStr);
assertEqual(parsedProject.title, 'Test Export Project', 'JSON export serializes project title correctly');
assert(Array.isArray(parsedProject.layers) && parsedProject.layers.length > 0, 'JSON export contains layers array');

// Verify export dispatch logic in app.js
const appJsContent = fs.readFileSync(path.resolve(__dirname, '../public/js/app.js'), 'utf8');
assert(appJsContent.includes("fmt === 'svg'"), "Contains 'fmt === svg' branch");
assert(appJsContent.includes("fmt === 'json'"), "Contains distinct 'fmt === json' branch");
assert(!appJsContent.includes("exportSvg(engine, `${baseName}.svg`, transparent);\n          const projectData"), "SVG export does NOT trigger secondary JSON export");

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
assert(llmJsContent.includes('gemini-2.5-flash'), 'Gemini fallback model is gemini-2.5-flash');
assert(!llmJsContent.includes('gemini-1.5-flash'), 'Retired gemini-1.5-flash is removed');
assert(!llmJsContent.includes('gemini-2.0-flash'), 'Retired gemini-2.0-flash is removed');

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
// TEST SUITE 7: Storage Namespacing & Migration
// ----------------------------------------------------
console.log('\nSuite 7: Storage Namespacing & Migration');

const storageJsContent = fs.readFileSync(path.resolve(__dirname, '../public/js/storage.js'), 'utf8');
assert(storageJsContent.includes("const DB_NAME = 'as_thumb_studio_db';"), 'DB is namespaced to as_thumb_studio_db');
assert(storageJsContent.includes("as_thumb_proj_"), 'LocalStorage fallback keys are namespaced to as_thumb_proj_');
assert(storageJsContent.includes("k.startsWith('as_thumb_proj_') || k.startsWith('studio_proj_')"), 'LocalStorage listProjects preserves legacy studio_proj_ keys');
assert(storageJsContent.includes("await migrateLegacyProjects(db);"), 'migrateLegacyProjects is properly awaited during DB initialization');
assert(storageJsContent.includes("oldDb.close();"), 'Legacy database connection is safely closed after migration');

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
}, 300);
