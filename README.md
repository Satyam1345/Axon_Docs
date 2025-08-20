# Axon Docs

Single-container app serving Next.js UI and Express API on port 8080.

## Build

```powershell
# From repo root
docker build --platform linux/amd64 -t yourimageidentifier .
```

## Run

Mount credentials and pass required environment variables as per evaluation:

```powershell
docker run -v C:/absolute/path/to/credentials:/credentials ^
  -e ADOBE_EMBED_API_KEY=YOUR_ADOBE_KEY ^
  -e LLM_PROVIDER=gemini ^
  -e GOOGLE_APPLICATION_CREDENTIALS=/credentials/adbe-gcp.json ^
  -e GEMINI_MODEL=gemini-2.5-flash ^
  -e TTS_PROVIDER=azure ^
  -e AZURE_TTS_KEY=TTS_KEY ^
  -e AZURE_TTS_ENDPOINT=TTS_ENDPOINT ^
  -p 8080:8080 yourimageidentifier
```

Open http://localhost:8080

## Notes
- Frontend and backend share the same port via `backend/combinedServer.js`.
- Runtime env is exposed to the browser via `/runtime-env.js` so keys are not baked into the bundle.
- PDFs are served from `frontend/public/pdfs`.
