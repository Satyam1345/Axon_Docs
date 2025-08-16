    // backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    