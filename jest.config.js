module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/src/__tests__/**/*.js',
    '**/src/__tests__/**/*.ts',
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
    '.project/scripts/**/*.js',
    'src/**/*.(js|ts)',
    'cx',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/*.test.(js|ts)',
    '!**/*.spec.(js|ts)'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  verbose: true,
  testTimeout: 10000
};