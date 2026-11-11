const express = require('express');
const router = express.Router();
const config = require('../config/env');
const { generateToken, authenticateToken } = require('../middleware/authMiddleware');

/**
 * POST /api/auth/login
 * Authenticates faculty / admin credentials and returns JWT bearer token
 */
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required.'
    });
  }

  // Validate against configured admin/faculty credentials
  const isValidAdmin = (email === config.auth.adminEmail && password === config.auth.adminPassword);
  
  if (!isValidAdmin) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password.'
    });
  }

  const token = generateToken({
    email: config.auth.adminEmail,
    role: 'faculty',
    name: 'Academic Review Faculty'
  }, '24h');

  res.json({
    success: true,
    message: 'Authentication successful.',
    token,
    user: {
      email: config.auth.adminEmail,
      role: 'faculty',
      name: 'Academic Review Faculty'
    }
  });
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
router.get('/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;

