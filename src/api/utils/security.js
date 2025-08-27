// CommonJS wrapper for security utilities
const escapeHtml = require('escape-html');

const sanitizeHtml = (input) => {
  if (!input) return '';
  return escapeHtml(String(input));
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        result[key] = sanitizeHtml(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
};

const sanitizeArray = (items) => {
  if (!items) return [];
  if (!Array.isArray(items)) return [];
  
  return items.map(item => {
    if (typeof item === 'string') {
      return sanitizeHtml(item);
    } else if (item && typeof item === 'object') {
      return sanitizeObject(item);
    }
    return item;
  });
};

const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const sanitizePath = (filepath) => {
  if (!filepath) return '';
  if (typeof filepath !== 'string') return '';
  
  // Remove directory traversal attempts and clean up
  let cleaned = filepath
    .replace(/\.\./g, '') // Remove all .. sequences (literal dots)
    .replace(/[^a-zA-Z0-9\-_\.\/\\]/g, ''); // Keep only safe characters
  
  // Clean up multiple slashes
  cleaned = cleaned
    .replace(/\/+/g, '/') // Replace multiple forward slashes with single
    .replace(/\\+/g, '\\'); // Replace multiple backslashes with single
  
  return cleaned;
};

const getRateLimitKey = (req) => {
  if (!req) return 'ratelimit:unknown';
  return `ratelimit:${req.ip || 'unknown'}`;
};

const removeSensitiveFields = (obj, sensitiveFields = ['password', 'apiKey', 'token', 'secret', 'refreshToken']) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  sensitiveFields.forEach(field => {
    if (field in result) {
      delete result[field];
    }
  });
  
  // Also check for fields containing these sensitive words
  Object.keys(result).forEach(key => {
    if (sensitiveFields.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      delete result[key];
    }
  });
  
  return result;
};

module.exports = {
  sanitizeHtml,
  sanitizeObject,
  sanitizeArray,
  isValidUUID,
  sanitizePath,
  getRateLimitKey,
  removeSensitiveFields
};