# AI Simplified Lab — Thumbnail Studio

> A high-performance, prompt-driven YouTube thumbnail creation studio built with Vanilla JavaScript, HTML5, SVG, and Canvas. 100% free, client-side, zero paid API or image-generation credits required.

![Studio Preview](https://raw.githubusercontent.com/aisimplified280-png/Thumnail-generator/main/public/preview.png)

---

## ⚡ Core Philosophy & Zero-Cost Architecture

- **Zero-Credit Local Rendering (Mode A — Default)**:
  Natural language descriptions (e.g. *"Create a dramatic thumbnail about an AI agent breaching Hugging Face..."*) are interpreted entirely in-browser by a client-side NLP engine and mapped to a rich SVG scene library featuring procedural tech data vaults, shattered digital sandboxes, quantum orbitals, developer terminals, and cinematic lighting.
- **No API Key, No Account, No Subscription**:
  The core studio works immediately out-of-the-box and fully offline after initial page load.
- **Real Editable Vector & Text Layers**:
  Every headline, badge, subtitle, and graphic element is an interactive layer that can be directly dragged on-canvas, resized, recolored, reordered, hidden, or deleted.
- **Intelligent Multi-Aspect Reflow**:
  - `16:9` YouTube Landscape (1280 × 720)
  - `9:16` YouTube Shorts / Reels (1080 × 1920)
  - `1:1` Square / Instagram (1080 × 1080)
  Switching formats reflows the visual composition instead of merely cropping the image.
- **Client-Side Persistence**:
  Projects and uploaded logo assets are stored locally in the browser via **IndexedDB** with automatic saving and 30-step Undo/Redo history.
- **Multi-Format Vector & Raster Export**:
  - PNG (Standard 1x and Ultra HD 2x Retina)
  - JPEG with quality compression
  - Pure SVG vector (fully scalable and editable in Illustrator/Figma)
  - Project JSON backup & import
  - Transparent background toggle

---

## 🚀 Two Generation Modes

### Mode A: Local Prompt-to-Design (Default)
Works 100% offline with zero latency and zero cost:
- Keyword & entity detection (e.g. "Hugging Face", "Cloud Vault", "Quantum", "Python Terminal", "Automation").
- Context-aware color palette matching (Cyberpunk Cyan/Red, Matrix Lime, Deep Neural Violet, Warning Amber, Quantum Pink).
- Intelligent headline extraction & word-level neon accent highlighting.
- Procedural SVG component assembly.
- Deterministic **Remix** button to cycle through layout seeds and compositions.

### Mode B: Optional LLM-Assisted Design
- Add an optional Groq (`llama-3.3-70b-versatile`) or Google Gemini (`gemini-2.0-flash`) API key in Settings.
- The LLM returns a structured, strictly validated JSON design specification (never code, never images).
- If offline, unconfigured, or rate-limited, the studio automatically falls back to Mode A seamlessly.

---

## 📁 Project Structure

```text
├── public/                       # Static web application
│   ├── index.html                # Creative studio UI & structure
│   ├── css/
│   │   └── styles.css            # Dark glassmorphic studio styling
│   └── js/
│       ├── app.js                # Studio controller & viewport events
│       ├── prompt-interpreter.js # Client-side NLP & entity parser
│       ├── scene-library.js      # Procedural SVG components & shaders
│       ├── scene-engine.js       # Layer compositor & aspect ratio reflow
│       ├── layer-editor.js       # On-canvas drag, inspector & layers
│       ├── storage.js            # IndexedDB persistence & Undo/Redo
│       ├── export.js             # SVG-to-Canvas rasterizer & file downloads
│       └── llm-provider.js       # Optional Groq/Gemini adapter
├── functions/                    # Cloudflare Pages Functions
│   └── api/
│       └── design.js             # Optional serverless endpoint with secrets
├── server.js                     # Zero-dependency local dev server
├── package.json
├── .env.example
└── README.md
```

---

## 💻 Running Locally

### Option 1: Zero-Dependency Node.js Server
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Python HTTP Server
```bash
python -m http.server -d public 3000
```

---

## 🌐 Free Deployment on Cloudflare Pages

### Deploying via Git (Recommended)
1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: AI Simplified Lab Thumbnail Studio"
   git remote add origin https://github.com/aisimplified280-png/Thumnail-generator.git
   git branch -M main
   git push -u origin main
   ```
2. In your [Cloudflare Dashboard](https://dash.cloudflare.com/):
   - Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   - Select the `Thumnail-generator` repository.
   - Set **Build output directory** to: `public`
   - Set **Build command**: *(leave empty)*
   - Click **Save and Deploy**.
3. Your studio will be live instantly on a free `*.pages.dev` domain with unlimited bandwidth!

### (Optional) Configuring Server-Side AI Secrets
If you want to use Cloudflare Pages Function `/api/design` without entering keys into client browsers:
1. In Cloudflare Pages project settings, navigate to **Settings** > **Environment variables**.
2. Add:
   - `GROQ_API_KEY`: *(your Groq API key)* OR
   - `GEMINI_API_KEY`: *(your Google Gemini API key)*
3. Redeploy. The `/api/design` function will securely sign requests server-side.

---

## 🎨 Keyboard Shortcuts & Tips

- **Drag Elements**: Click and drag any text or graphic element directly on the canvas.
- **Nudge**: Use Arrow keys (`←`, `↑`, `→`, `↓`) to nudge the selected element by 2px (hold `Shift` for 10px).
- **Undo / Redo**: `Ctrl + Z` / `Ctrl + Y`.
- **Safe Area Guides**: Click the target icon on the canvas toolbar to display YouTube's timestamp and cards safe zones.
- **Remix**: Hit the `Remix` button to test alternate visual arrangements for the same prompt.

---

## 📄 License
MIT License. Created for **AI Simplified Lab**.
