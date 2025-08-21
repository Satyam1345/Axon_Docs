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

![Landing Page](docs/screenshots/01-landing.png)

2. PDF Viewer with highlighted sections and subsection analysis

![PDF Viewer](docs/screenshots/02-pdf-viewer.png)

3. AI Insights page

![AI Insights](docs/screenshots/03-ai-insights.png)

4. Podcast page

![Podcast](docs/screenshots/04-podcast.png)

5. Upload PDF page

![Upload PDF](docs/screenshots/05-upload.png)

6. Other Details page

![Other Details](docs/screenshots/06-details.png)

> If your filenames differ, update the paths above or rename your images to match.

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

## Troubleshooting

- Azure TTS endpoint error mentioning ws/wss:
  - Use an HTTPS endpoint like `https://<region>.tts.speech.microsoft.com/cognitiveservices/v1` or set `AZURE_TTS_REGION` directly.
  - The app auto-derives region from the endpoint host if provided.
- 404 on `/api/generate-*`:
  - Ensure Nginx config is in use (container) and you’re calling via `http://localhost:8080`.
- Missing keys:
  - The app will return clear errors if required env vars are not set.

## Security note

For the requested parity with Adobe, `GEMINI_API_KEY` is exposed to `window.__ENV`. In production, prefer server-only secrets where possible.
