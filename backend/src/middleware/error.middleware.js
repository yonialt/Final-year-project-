/**
 * Central error handler — must be registered last in app.js.
 * Converts operational errors (with statusCode) and unexpected errors.
 */
const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode < 500 ? err.message : 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json({ message });
};

module.exports = { errorHandler };
