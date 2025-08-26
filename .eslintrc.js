module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:security/recommended-legacy',
    'prettier'
  ],
  plugins: ['security'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Security rules
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'warn',
    
    // Best practices
    'no-console': 'off', // CLI tool needs console
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    
    // Code quality
    'complexity': ['warn', 10],
    'max-lines-per-function': ['warn', 100],
    'max-depth': ['warn', 4],
    'max-params': ['warn', 4]
  },
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    '.project/tasks/',
    '*.min.js'
  ]
};