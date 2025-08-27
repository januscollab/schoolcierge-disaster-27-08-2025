const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: {
      message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}

module.exports = errorHandler;
