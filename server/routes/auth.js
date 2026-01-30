const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ 
        username, 
        email: email || `${username}@example.com`, 
        password,
        role: 'user',
        wallet: {
            mainBalance: 0,
            bonusBalance: 0,
            spinCredits: {
                BRONZE: 5,
                SILVER: 0,
                GOLD: 0,
                DIAMOND: 0
            }
        }
    });
    
    await user.save();

    const payload = { user: { id: user.id } };
    
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is missing from environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) {
          console.error('JWT Sign Error:', err);
          return res.status(500).json({ error: 'Token generation failed' });
      }
      res.json({ token, user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role,
          wallet: user.wallet,
          stats: user.stats
      }});
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const payload = { user: { id: user.id } };

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is missing from environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) {
          console.error('JWT Sign Error:', err);
          return res.status(500).json({ error: 'Token generation failed' });
      }
      res.json({ token, user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role,
          wallet: user.wallet,
          stats: user.stats
      }});
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Logout (Dummy for now as it's client side token removal)
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out' });
});

// Get Me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
