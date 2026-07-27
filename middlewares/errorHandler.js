// Global error-handling middleware
// Express recognizes this as an error handler because it takes 4 parameters (err, req, res, next)
// This must be added LAST in server.js, after all routes
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Default to a 500 (Internal Server Error) unless the error already has a status code
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server';

  // Handle specific known Mongoose error types with clearer messages

  // Invalid MongoDB ObjectId (e.g., someone passes a malformed :id in the URL)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose validation errors (e.g., required field missing, enum mismatch)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // Duplicate key error (e.g., trying to create a user/role/permission with a name that must be unique)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value entered for field: ${field}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = errorHandler;