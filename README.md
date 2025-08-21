# Axon Docs

End-to-end PDF intelligence app: upload and view PDFs, extract AI insights, and generate a podcast—all behind a single container on port 8080.

• Frontend: Next.js (App Router) + Tailwind
• Backend: Express (file upload, related content, Python orchestration)
• Reverse proxy: Nginx (serves everything on port 8080)
• Python: local models + PDF/search pipeline (round_1b)

Open http://localhost:8080 after running the container.

## Screenshots

Add your screenshots to `docs/screenshots/` with these filenames to render below. Each image has a short caption to match the requested order.

1. Landing Page

![WhatsApp Image 2025-08-20 at 06 12 32_9e2e0603](https://github.com/user-attachments/assets/9ba55ad0-c163-4d1e-b468-ca9881b443e5)

2. PDF Viewer with highlighted sections and subsection analysis (Allows click to jump to that specific page)

![WhatsApp Image 2025-08-20 at 06 31 39_6c11f163](https://github.com/user-attachments/assets/f07feccb-3a1a-4f2e-b088-a9e44bf1955c)


3. AI Insights page

![WhatsApp Image 2025-08-20 at 06 30 06_4ad8e35b](https://github.com/user-attachments/assets/2f40252d-4ee5-4ef1-93d6-841716b5f564)

4. Podcast page

![WhatsApp Image 2025-08-20 at 06 29 22_dcc8f3b8](https://github.com/user-attachments/assets/f6990057-7d35-47f5-9880-3a1549a699fb)

5. Upload PDF page

![WhatsApp Image 2025-08-20 at 06 12 42_34bbff38](https://github.com/user-attachments/assets/0a184ec1-3b2d-45f7-84c4-351fdabfefa0)
![WhatsApp Image 2025-08-20 at 06 12 55_9fc7d069](https://github.com/user-attachments/assets/d7041c79-aac2-4144-a8d5-dce1eedd89f2)

6. Related Findings for selected texts   (Allows click to jump to that specific page)

![WhatsApp Image 2025-08-20 at 06 31 00_6bda6bda](https://github.com/user-attachments/assets/762129f6-b142-4405-a94f-11f076ce3736)


## Quick Start (Docker)

Build (linux/amd64):

```bash
docker build --platform linux/amd64 -t yourimageidentifier .
```

Run (env vars inline):

```bash
docker run --rm --name axon-docs \
  -e ADOBE_EMBED_API_KEY=8f94cb51c25d45b6ad598687c409fdcb \
  -e LLM_PROVIDER=gemini \
  -e GEMINI_MODEL=gemini-2.5-flash \
  -e GEMINI_API_KEY=<GEMINI_API_KEY> \
  -e TTS_PROVIDER=azure \
  -e AZURE_TTS_KEY=<AZURE_TTS_KEY> \
  -e AZURE_TTS_ENDPOINT=<AZURE_TTS_ENDPOINT> \
  -p 8080:8080 \
  yourimageidentifier
```

Then open http://localhost:8080

## What you get

- Upload PDFs: Drag-and-drop or pick files to place under `frontend/public/pdfs` for serving.
- PDF Viewer: In-browser view with highlighted sections and sub-section analysis.
- AI Insights: Gemini-based structured insights across single or multiple PDFs.
- Podcast: Gemini-created two-speaker script synthesized via Azure TTS to MP3.

## Architecture

- Nginx on 8080
  - Proxies Next.js on 3000 and Express on 5001
  - Serves static assets and `/runtime-env.js` (browser runtime configuration)
- Next.js (App Router)
  - Pages under `frontend/app`
  - API routes for AI features:
    - `POST /api/generate-insights`
    - `POST /api/generate-overview-insights`
    - `POST /api/generate-podcast`
    - `POST /api/generate-overview-podcast`
- Express backend (5001)
  - Uploads, related content, Python process orchestration
- Python pipeline (`round_1b/`)
  - Local models + PDF/text embedding, ranking, and inference

## Environment variables

Required for core features:

- ADOBE_EMBED_API_KEY: Adobe PDF Embed (client-side)
- LLM_PROVIDER: Must be `gemini` for current implementation
- GEMINI_MODEL: e.g., `gemini-2.5-flash`
- GEMINI_API_KEY: Google Generative AI key
- TTS_PROVIDER: Must be `azure`
- AZURE_TTS_KEY: Azure Cognitive Services Speech key
- AZURE_TTS_ENDPOINT: e.g., `https://eastus.tts.speech.microsoft.com/cognitiveservices/v1`
  - Alternatively, set `AZURE_TTS_REGION` (e.g., `eastus`) and omit endpoint

Runtime config is exposed to the browser via `/runtime-env.js` (generated at container start). To match the Adobe-style pattern, `window.__ENV` includes keys like `ADOBE_EMBED_API_KEY`, `GEMINI_API_KEY`, and others.

## Project structure (high level)

```
backend/                 # Express server (5001)
frontend/                # Next.js app (3000)
  app/
    api/                 # Next.js route handlers (AI endpoints)
    pdfviewer/, upload/  # Main pages
    components/          # UI components (Header, Sidebar, PDFViewer, etc.)
  public/pdfs/           # PDFs served to the browser
nginx/                   # Nginx config (reverse proxy)
round_1b/                # Python models, requirements, and scripts
Dockerfile               # Multi-stage build and runtime setup
```

## How it works (flow)

1) Browser sends API calls to `/api/*` on port 8080.
2) Nginx routes `generate-*` to Next.js; other `/api/*` to Express.
3) Next.js APIs call Gemini to generate insights/scripts; Podcast endpoints call Azure TTS.
4) Express endpoints handle uploads/related content and optionally call Python.
5) Static PDFs are read from `frontend/public/pdfs` when needed.
