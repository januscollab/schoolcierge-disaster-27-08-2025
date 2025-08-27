#!/usr/bin/env node

/**
 * Quick verification script for security fixes
 * Run this to verify that security vulnerabilities have been patched
 */

const fs = require('fs');
const path = require('path');
const escapeHtml = require('escape-html');

console.log('\n🔒 Security Fix Verification\n');
console.log('=' .repeat(50));

// Test 1: XSS Prevention in Dashboard
console.log('\n1. Testing XSS Prevention in Dashboard HTML Generator...');
const dashboardFile = path.join(__dirname, 'dashboard-html.js');
if (fs.existsSync(dashboardFile)) {
  const dashboardContent = fs.readFileSync(dashboardFile, 'utf8');
  
  // Check if escape-html is imported
  const hasEscapeImport = dashboardContent.includes("require('escape-html')");
  
  // Check if escapeHtml is used for task titles
  const escapesTaskTitle = dashboardContent.includes('escapeHtml(task.title)');
  const escapesTaskId = dashboardContent.includes('escapeHtml(task.id)');
  
  if (hasEscapeImport && escapesTaskTitle && escapesTaskId) {
    console.log('   ✅ XSS Protection: IMPLEMENTED');
    console.log('   - escape-html module imported');
    console.log('   - Task titles are escaped');
    console.log('   - Task IDs are escaped');
  } else {
    console.log('   ❌ XSS Protection: MISSING');
    if (!hasEscapeImport) console.log('   - escape-html not imported');
    if (!escapesTaskTitle) console.log('   - Task titles not escaped');
    if (!escapesTaskId) console.log('   - Task IDs not escaped');
  }
} else {
  console.log('   ⚠️  Dashboard file not found');
}

// Test 2: API Authentication
console.log('\n2. Testing API Authentication Implementation...');
const familiesRouteFile = path.join(__dirname, '../../src/api/routes/families.ts');
if (fs.existsSync(familiesRouteFile)) {
  const familiesContent = fs.readFileSync(familiesRouteFile, 'utf8');
  
  // Check if auth middleware is imported
  const hasAuthImport = familiesContent.includes("from '../middleware/auth'");
  
  // Check if authenticate middleware is used
  const hasAuthenticate = familiesContent.includes('authenticate,');
  const hasAuthorizeFamily = familiesContent.includes('authorizeFamily,');
  const hasRequireAdmin = familiesContent.includes('requireAdmin,');
  const hasAuditLog = familiesContent.includes('auditLog(');
  
  if (hasAuthImport && hasAuthenticate && hasAuthorizeFamily) {
    console.log('   ✅ API Authentication: IMPLEMENTED');
    console.log('   - Auth middleware imported');
    console.log('   - authenticate middleware applied');
    if (hasAuthorizeFamily) console.log('   - authorizeFamily middleware applied');
    if (hasRequireAdmin) console.log('   - requireAdmin middleware applied');
    if (hasAuditLog) console.log('   - Audit logging enabled');
  } else {
    console.log('   ❌ API Authentication: MISSING');
    if (!hasAuthImport) console.log('   - Auth middleware not imported');
    if (!hasAuthenticate) console.log('   - authenticate middleware not applied');
  }
} else {
  console.log('   ⚠️  Families route file not found');
}

// Test 3: Security Utilities
console.log('\n3. Testing Security Utilities...');
const securityUtilsFile = path.join(__dirname, '../../src/api/utils/security.ts');
if (fs.existsSync(securityUtilsFile)) {
  const securityContent = fs.readFileSync(securityUtilsFile, 'utf8');
  
  const hasSanitizeHtml = securityContent.includes('export const sanitizeHtml');
  const hasSanitizeObject = securityContent.includes('export const sanitizeObject');
  const hasSecurityHeaders = securityContent.includes('export const securityHeaders');
  const hasUuidValidation = securityContent.includes('export const isValidUUID');
  
  if (hasSanitizeHtml && hasSanitizeObject && hasSecurityHeaders) {
    console.log('   ✅ Security Utilities: AVAILABLE');
    console.log('   - sanitizeHtml function defined');
    console.log('   - sanitizeObject function defined');
    console.log('   - securityHeaders middleware defined');
    if (hasUuidValidation) console.log('   - UUID validation available');
  } else {
    console.log('   ❌ Security Utilities: INCOMPLETE');
    if (!hasSanitizeHtml) console.log('   - sanitizeHtml missing');
    if (!hasSanitizeObject) console.log('   - sanitizeObject missing');
    if (!hasSecurityHeaders) console.log('   - securityHeaders missing');
  }
} else {
  console.log('   ⚠️  Security utilities file not found');
}

// Test 4: Security Middleware in App
console.log('\n4. Testing Security Middleware in App...');
const appFile = path.join(__dirname, '../../src/api/app.ts');
if (fs.existsSync(appFile)) {
  const appContent = fs.readFileSync(appFile, 'utf8');
  
  const hasHelmet = appContent.includes("import helmet from 'helmet'");
  const hasMongoSanitize = appContent.includes('express-mongo-sanitize');
  const hasRateLimit = appContent.includes('rateLimit');
  const hasXss = appContent.includes("import xss from 'xss'");
  
  if (hasHelmet && hasRateLimit) {
    console.log('   ✅ Security Middleware: CONFIGURED');
    console.log('   - Helmet security headers enabled');
    console.log('   - Rate limiting configured');
    if (hasMongoSanitize) console.log('   - NoSQL injection protection enabled');
    if (hasXss) console.log('   - XSS protection enabled');
  } else {
    console.log('   ❌ Security Middleware: INCOMPLETE');
    if (!hasHelmet) console.log('   - Helmet not configured');
    if (!hasRateLimit) console.log('   - Rate limiting not configured');
  }
} else {
  console.log('   ⚠️  App file not found');
}

// Test 5: XSS Prevention Demo
console.log('\n5. XSS Prevention Demonstration...');
const maliciousInputs = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '"><script>alert(1)</script>'
];

console.log('   Testing malicious inputs:');
maliciousInputs.forEach(input => {
  const escaped = escapeHtml(input);
  const safe = !escaped.includes('<script>') && !escaped.includes('javascript:');
  console.log(`   ${safe ? '✅' : '❌'} "${input.substring(0, 30)}..." → "${escaped.substring(0, 30)}..."`);
});

// Summary
console.log('\n' + '=' .repeat(50));
console.log('📊 SECURITY FIX VERIFICATION SUMMARY\n');

const dashboardFixed = fs.existsSync(dashboardFile) && 
  fs.readFileSync(dashboardFile, 'utf8').includes('escapeHtml(task.title)');

const apiFixed = fs.existsSync(familiesRouteFile) && 
  fs.readFileSync(familiesRouteFile, 'utf8').includes('authenticate,');

const securityUtilsExists = fs.existsSync(securityUtilsFile);

const appSecured = fs.existsSync(appFile) && 
  fs.readFileSync(appFile, 'utf8').includes('helmet');

if (dashboardFixed && apiFixed) {
  console.log('✅ BOTH CRITICAL VULNERABILITIES FIXED!\n');
  console.log('1. XSS in Dashboard: FIXED ✅');
  console.log('2. Missing API Auth: FIXED ✅');
  if (securityUtilsExists) console.log('3. Security Utilities: CREATED ✅');
  if (appSecured) console.log('4. App Security: ENHANCED ✅');
  console.log('\nThe application is now significantly more secure!');
} else {
  console.log('⚠️  SECURITY ISSUES REMAIN!\n');
  if (!dashboardFixed) console.log('1. XSS in Dashboard: NOT FIXED ❌');
  if (!apiFixed) console.log('2. Missing API Auth: NOT FIXED ❌');
}

console.log('\n' + '=' .repeat(50));
console.log('Security verification complete.\n');