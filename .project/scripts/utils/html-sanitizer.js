/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by properly escaping and sanitizing HTML content
 */

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize HTML to prevent XSS attacks
 * Allows only safe tags and removes all potentially dangerous content
 * 
 * @param {string} dirty - The untrusted HTML string
 * @returns {string} - Sanitized HTML string
 */
function sanitizeHTML(dirty) {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, { 
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false
  });
}

/**
 * Escape HTML entities for safe display in HTML context
 * Converts special characters to HTML entities
 * 
 * @param {string} str - The string to escape
 * @returns {string} - HTML-escaped string
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return String(str || '');
  
  const div = window.document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Escape HTML attribute values
 * Use this when inserting user data into HTML attributes
 * 
 * @param {string} str - The string to escape for attribute context
 * @returns {string} - Attribute-safe escaped string
 */
function escapeAttribute(str) {
  if (typeof str !== 'string') return String(str || '');
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize numeric values for style attributes
 * Prevents injection through style values
 * 
 * @param {any} value - The value to validate
 * @param {number} defaultValue - Default value if validation fails
 * @returns {number} - Safe numeric value
 */
function sanitizeNumber(value, defaultValue = 0) {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : Math.max(0, Math.min(100, num));
}

module.exports = {
  sanitizeHTML,
  escapeHTML,
  escapeAttribute,
  sanitizeNumber
};