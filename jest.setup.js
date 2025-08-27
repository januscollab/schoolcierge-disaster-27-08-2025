// Jest setup file - loads environment variables for tests
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '.env');
const result = dotenv.config({ path: envPath });

// If .env doesn't exist, try .env.example with test defaults
if (result.error) {
  console.log('No .env file found, loading .env.example for testing...');
  dotenv.config({ path: path.resolve(__dirname, '.env.example') });
  
  // Override with test-safe defaults if using .env.example
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  process.env.NODE_ENV = 'test';
}

// Set test environment
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Suppress console logs during tests unless explicitly debugging
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}