const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Authentication Middleware
 * Supports JWT bearer tokens and developer credentials header.
 * Attaches decoded user payload { email, role } to req.user.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Also check dev/faculty API key or token header
  const apiKey = req.headers['x-api-key'];
  if (apiKey && (apiKey === config.auth.jwtSecret || apiKey === config.nvidia.apiKey)) {
    req.user = { email: config.auth.adminEmail, role: 'faculty' };
    return next();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Missing Bearer token or authorization header.'
    });
  }

  jwt.verify(token, config.auth.jwtSecret, (err, user) => {
    if (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token.'
      });
    }
    req.user = user;
    next();
  });
}

/**
 * Faculty/Admin Role Guard
 * Enforces that authenticated user holds faculty or admin authority.
 */
function requireFaculty(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.'
    });
  }

  const role = (req.user.role || '').toLowerCase();
  if (role !== 'faculty' && role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Faculty or administrator privileges required.'
    });
  }

  next();
}

/**
 * Generate standard token for faculty/admin users
 */
function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, config.auth.jwtSecret, { expiresIn });
}

module.exports = {
  authenticateToken,
  requireFaculty,
  generateToken
};

