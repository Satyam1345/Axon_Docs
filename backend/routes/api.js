    // backend/routes/api.js
    const express = require('express');
    const router = express.Router();
    const multer = require('multer');
    const { spawn, spawnSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');
  // const DocumentCollection = require('../models/DocumentCollection');
  // const auth = require('../middleware/authMiddleware');


    // Ensure uploads directory always exists
    const uploadsDir = path.join(__dirname, '../uploads/');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const upload = multer({ dest: uploadsDir });

    // Resolve a usable Python executable on the host system
    function resolvePythonExecutable() {
      const envPython = process.env.PYTHON_EXECUTABLE && process.env.PYTHON_EXECUTABLE.trim();
      const candidates = [];
      if (envPython) {
        candidates.push({ cmd: envPython, argsPrefix: [] });
      }
      // Prefer Windows launcher when available
      candidates.push({ cmd: 'py', argsPrefix: ['-3'] });
      // Generic fallbacks
      candidates.push({ cmd: 'python', argsPrefix: [] });
      candidates.push({ cmd: 'python3', argsPrefix: [] });

      for (const candidate of candidates) {
        try {
          const check = spawnSync(candidate.cmd, [...candidate.argsPrefix, '--version'], { stdio: 'ignore' });
          if (check && check.status === 0) {
            return candidate;
          }
        } catch (_) {
          // Ignore and try next candidate
        }
      }
      return null;
    }

  router.post('/upload', upload.array('pdfs'), async (req, res) => {
      // Create a unique folder for this upload to isolate PDFs per request
      const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const collectionPath = path.join(uploadsDir, uniqueId);
      const pdfsDir = path.join(collectionPath, 'PDFs');
      fs.mkdirSync(pdfsDir, { recursive: true });
      // Copy each uploaded PDF to frontend/public/pdfs for frontend access
      const frontendPdfsDir = path.resolve(__dirname, '../../frontend/public/pdfs');
      fs.mkdirSync(frontendPdfsDir, { recursive: true });
      req.files.forEach(file => {
        const destPath = path.join(pdfsDir, file.originalname);
        // Move the uploaded temp file into this collection's PDFs folder
        try {
          fs.renameSync(file.path, destPath);
        } catch (_) {
          // If rename across devices fails, fallback to copy+unlink
          fs.copyFileSync(file.path, destPath);
          fs.unlinkSync(file.path);
        }
        // Copy to frontend/public/pdfs
        const frontendDest = path.join(frontendPdfsDir, file.originalname);
        fs.copyFileSync(destPath, frontendDest);
      });

      // Also include all existing PDFs in frontend/public/pdfs into this collection for analysis
      try {
        const existing = fs.readdirSync(frontendPdfsDir).filter((f) => f.toLowerCase().endsWith('.pdf'));
        for (const pdfName of existing) {
          const src = path.join(frontendPdfsDir, pdfName);
          const dest = path.join(pdfsDir, pdfName);
          if (!fs.existsSync(dest)) {
            fs.copyFileSync(src, dest);
          }
        }
      } catch (e) {
        console.warn('Warning: Could not enumerate existing PDFs:', e.message || e);
      }

      const collectionName = req.body.collectionName;
      const personaData = { 
        persona: { role: req.body.personaRole }, 
        job_to_be_done: { task: req.body.jobTask } 
      };
      fs.writeFileSync(path.join(collectionPath, 'challenge1b_input.json'), JSON.stringify(personaData));

      try {
        const pythonScriptPath = path.resolve(__dirname, '../../round_1b/run.py');
        const pythonScriptDir = path.resolve(__dirname, '../../round_1b');
        const outputPath = path.join(collectionPath, 'challenge1b_output.json');

        const resolved = resolvePythonExecutable();
        if (!resolved) {
          return res.status(500).json({
            error: 'Python not found',
            details: 'Could not locate a Python 3 interpreter. Install Python 3 and ensure it is on PATH, or set PYTHON_EXECUTABLE to the full path.'
          });
        }
        const { cmd: pythonExecutable, argsPrefix } = resolved;

        const pythonProcess = spawn(
          pythonExecutable,
          [...argsPrefix, pythonScriptPath, '--input_dir', collectionPath, '--output_path', outputPath],
          { cwd: pythonScriptDir }
        );

        // Handle spawn errors (e.g., ENOENT) to avoid crashing the server
        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          return res.status(500).json({
            error: 'Failed to start Python process',
            details: err && err.message ? err.message : String(err),
            attemptedCommand: `${pythonExecutable} ${[...argsPrefix, pythonScriptPath].join(' ')}`
          });
        });

        let stderr = '';
        pythonProcess.stdout.on('data', data => console.log(`Python STDOUT: ${data}`));
        pythonProcess.stderr.on('data', data => {
          console.error(`Python STDERR: ${data}`);
          stderr += data.toString();
        });

        pythonProcess.on('close', async (code) => {
          if (code !== 0) {
            return res.status(500).json({ error: 'Python script failed.', details: stderr });
          }
          const analysisResult = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
          // Persist a copy at uploads root for UI/direct access
          try {
            const uploadsOutput = path.join(uploadsDir, 'challenge1b_output.json');
            fs.writeFileSync(uploadsOutput, JSON.stringify(analysisResult, null, 2));
          } catch (e) {
            console.warn('Warning: could not write uploads root output copy:', e.message || e);
          }
          // No DB, just return analysis result
          res.status(201).json({
            collectionName,
            analysisData: analysisResult
          });
          // Only delete if collectionPath is a subfolder of uploadsDir
          if (collectionPath !== uploadsDir && collectionPath.startsWith(uploadsDir)) {
            fs.rm(collectionPath, { recursive: true, force: true }, () => {});
          }
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to process upload.' });
      }
    });

    router.get('/history', async (req, res) => {
      // No DB, no auth, return empty array or placeholder
      res.json([]);
    });

    // Expose the latest analysis output for the frontend when session data is missing
    router.get('/output', async (req, res) => {
      try {
        const outPath = path.join(uploadsDir, 'challenge1b_output.json');
        if (!fs.existsSync(outPath)) {
          return res.status(404).json({ error: 'No analysis output found' });
        }
        const data = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
        res.json(data);
      } catch (e) {
        res.status(500).json({ error: 'Failed to read output', details: e && e.message ? e.message : String(e) });
      }
    });

    module.exports = router;
    