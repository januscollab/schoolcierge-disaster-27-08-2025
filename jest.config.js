module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/src/__tests__/**/*.js',
    '**/src/__tests__/**/*.ts',
    '**/src/tests/**/*.test.js',
    '**/src/tests/**/*.test.ts',
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.js',
    '**/__tests__/**/*.spec.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/api/**/*.(js|ts)',
    'src/lib/**/*.(js|ts)',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/*.test.(js|ts)',
    '!**/*.spec.(js|ts)',
    '!src/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 0,  // Disabled - infrastructure tests don't execute source code
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  verbose: true,
  testTimeout: 10000
};