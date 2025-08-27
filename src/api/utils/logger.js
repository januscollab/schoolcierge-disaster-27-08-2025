// Simple logger implementation for CommonJS compatibility
const logger = {
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args),
  info: (...args) => console.info(...args),
  debug: (...args) => console.debug(...args),
  trace: (...args) => console.trace(...args),
  fatal: (...args) => console.error(...args)
};

module.exports = logger;