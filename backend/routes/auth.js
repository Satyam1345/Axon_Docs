// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Auth with Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Auth Callback
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/', session: false }), (req, res) => {
    const payload = { user: { id: req.user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
        if (err) throw err;
        res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
    });
});

// Guest Login
router.post('/guest', async (req, res) => {
    try {
        const guestUser = new User({
            email: `guest_${Date.now()}@axondocs.com`,
            displayName: 'Guest User',
            isGuest: true,
        });
        await guestUser.save();
        const payload = { user: { id: guestUser.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
