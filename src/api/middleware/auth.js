const logger = require('../utils/logger');

// Mock auth middleware for testing
function auth(req, res, next) {
  // Simple mock implementation
  req.user = {
    id: 'test-user',
    role: 'user'
  };
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = {
  auth,
  requireAuth
};
