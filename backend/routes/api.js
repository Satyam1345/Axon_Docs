    // backend/routes/api.js
    const express = require('express');
    const router = express.Router();
    const multer = require('multer');
    const { spawn } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    const DocumentCollection = require('../models/DocumentCollection');
    const auth = require('../middleware/authMiddleware');

    const upload = multer({ dest: path.join(__dirname, '../uploads/') });

    router.post('/upload', auth, upload.array('pdfs'), async (req, res) => {
      const collectionPath = path.dirname(req.files[0].path);
      const pdfsDir = path.join(collectionPath, 'PDFs');
      fs.mkdirSync(pdfsDir, { recursive: true });
      req.files.forEach(file => {
        fs.renameSync(file.path, path.join(pdfsDir, file.originalname));
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
          const newCollection = new DocumentCollection({
            collectionName,
            analysisData: analysisResult,
            userId: req.user.id,
          });
          await newCollection.save();
          res.status(201).json(newCollection);
          fs.rm(collectionPath, { recursive: true, force: true }, () => {});
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to process upload.' });
      }
    });

    router.get('/history', auth, async (req, res) => {
        const collections = await DocumentCollection.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(collections);
    });

    module.exports = router;
    