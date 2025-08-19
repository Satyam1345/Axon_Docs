// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// --- Graceful shutdown cleanup ---
const uploadsDir = path.join(__dirname, 'uploads');
const frontendPdfsDir = path.resolve(__dirname, '../frontend/public/pdfs');

function clearFrontendPdfs() {
  try {
    if (!fs.existsSync(frontendPdfsDir)) return { deleted: 0 };
    const entries = fs.readdirSync(frontendPdfsDir);
    let deleted = 0;
    for (const entry of entries) {
      if (entry.toLowerCase().endsWith('.pdf')) {
        try {
          fs.unlinkSync(path.join(frontendPdfsDir, entry));
          deleted++;
        } catch (e) {
          console.warn('Could not delete PDF on shutdown:', entry, e && e.message ? e.message : String(e));
        }
      }
    }
    return { deleted };
  } catch (e) {
    console.warn('Error clearing frontend PDFs on shutdown:', e && e.message ? e.message : String(e));
    return { deleted: 0 };
  }
}

function clearUploadsDir() {
  try {
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }
    // Recreate empty uploads dir for next start
    fs.mkdirSync(uploadsDir, { recursive: true });
    return true;
  } catch (e) {
    console.warn('Error clearing uploads dir on shutdown:', e && e.message ? e.message : String(e));
    return false;
  }
}

function shutdown(signal) {
  console.log(`\nReceived ${signal}. Cleaning up files before exit...`);
  const front = clearFrontendPdfs();
  const back = clearUploadsDir();
  console.log(`Cleanup complete. Frontend PDFs deleted: ${front.deleted}. Uploads cleared: ${back}.`);

  server.close(() => {
    console.log('HTTP server closed. Exiting.');
    process.exit(0);
  });
  // Fallback exit if server doesn't close quickly
  setTimeout(() => process.exit(0), 1500).unref();
}

['SIGINT', 'SIGTERM'].forEach((sig) => {
  process.on(sig, () => shutdown(sig));
});
