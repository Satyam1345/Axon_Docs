    // backend/server.js
    require('dotenv').config();
    const express = require('express');
    const mongoose = require('mongoose');
    const cors = require('cors');
    const path = require('path');
    const passport = require('passport');
    require('./config/passport');

    const app = express();

    app.use(cors({
      origin: [ 'http://localhost:3000', 'http://127.0.0.1:3000' ],
      credentials: true,
      allowedHeaders: ['Content-Type', 'x-auth-token']
    }));
    app.use(express.json());
    app.use(passport.initialize());

    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('✅ MongoDB connected.'))
      .catch(err => console.error('❌ MongoDB connection error:', err));

    const authRoutes = require('./routes/auth');
    const apiRoutes = require('./routes/api');

    // Public auth routes first
    app.use('/api/auth', authRoutes);
    // Protected app routes second
    app.use('/api', apiRoutes);

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    