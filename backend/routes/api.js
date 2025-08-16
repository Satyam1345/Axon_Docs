    // backend/routes/api.js
    const express = require('express');
    const router = express.Router();
    const multer = require('multer');
    const { spawn } = require('child_process');
    const fs = require('fs');
    const path = require('path');
  // const DocumentCollection = require('../models/DocumentCollection');
  // const auth = require('../middleware/authMiddleware');

    const upload = multer({ dest: path.join(__dirname, '../uploads/') });

  router.post('/upload', upload.array('pdfs'), async (req, res) => {
      const collectionPath = path.dirname(req.files[0].path);
      const pdfsDir = path.join(collectionPath, 'PDFs');
      fs.mkdirSync(pdfsDir, { recursive: true });
      // Copy each uploaded PDF to frontend/public/pdfs for frontend access
      const frontendPdfsDir = path.resolve(__dirname, '../../frontend/public/pdfs');
      fs.mkdirSync(frontendPdfsDir, { recursive: true });
      req.files.forEach(file => {
        const destPath = path.join(pdfsDir, file.originalname);
        fs.renameSync(file.path, destPath);
        // Copy to frontend/public/pdfs
        const frontendDest = path.join(frontendPdfsDir, file.originalname);
        fs.copyFileSync(destPath, frontendDest);
      });

      const collectionName = req.body.collectionName;
      const personaData = { 
        persona: { role: req.body.personaRole }, 
        job_to_be_done: { task: req.body.jobTask } 
      };
      fs.writeFileSync(path.join(collectionPath, 'challenge1b_input.json'), JSON.stringify(personaData));

      try {
        const pythonScriptPath = path.resolve(__dirname, '../../round_1b/run.py');
        const pythonScriptDir = path.resolve(__dirname, '../../round_1b');
        const outputPath = path.join(collectionPath, 'round1b_output.json');

  // Use system Python path from env or fallback
  const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'C:/Python312/python.exe';
        const pythonProcess = spawn(pythonExecutable, 
          [pythonScriptPath, '--input_dir', collectionPath, '--output_path', outputPath],
          { cwd: pythonScriptDir }
        );

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
          // No DB, just return analysis result
          res.status(201).json({
            collectionName,
            analysisData: analysisResult
          });
          fs.rm(collectionPath, { recursive: true, force: true }, () => {});
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to process upload.' });
      }
    });

    router.get('/history', async (req, res) => {
      // No DB, no auth, return empty array or placeholder
      res.json([]);
    });

    module.exports = router;
    