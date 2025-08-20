// backend/combinedServer.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const next = require('next');

const dev = false; // production in Docker
const app = next({ dev, dir: path.resolve(__dirname, '../frontend') });
const handle = app.getRequestHandler();

const apiRoutes = require('./routes/api');

const PORT = process.env.PORT || 8080;

app.prepare().then(() => {
  const server = express();

  // JSON parsing for API
  server.use(express.json({ limit: '10mb' }));

  // Expose runtime env to the browser without baking into bundle
  server.get('/runtime-env.js', (_req, res) => {
    const env = {
      ADOBE_EMBED_API_KEY: process.env.ADOBE_EMBED_API_KEY || '',
      LLM_PROVIDER: process.env.LLM_PROVIDER || '',
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
      GEMINI_MODEL: process.env.GEMINI_MODEL || '',
      TTS_PROVIDER: process.env.TTS_PROVIDER || '',
      AZURE_TTS_KEY: process.env.AZURE_TTS_KEY || '',
      AZURE_TTS_ENDPOINT: process.env.AZURE_TTS_ENDPOINT || process.env.NEXT_PUBLIC_AZURE_TTS_ENDPOINT || '',
      AZURE_TTS_REGION: process.env.AZURE_TTS_REGION || process.env.NEXT_PUBLIC_AZURE_TTS_REGION || '',
    };
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`window.__ENV = ${JSON.stringify(env)};`);
  });

  // Serve PDFs (uploaded/copied) from frontend/public/pdfs
  const pdfsDir = path.resolve(__dirname, '../frontend/public/pdfs');
  server.use('/pdfs', express.static(pdfsDir, { maxAge: '1y', immutable: true }));

  // Backend API mounted at /api
  server.use('/api', apiRoutes);

  // Let Next handle everything else
  server.all('*', (req, res) => handle(req, res));

  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
