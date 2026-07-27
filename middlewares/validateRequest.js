const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

// This middleware runs AFTER the validation rules (defined per-route) have checked req.body.
// express-validator collects any rule violations into a "result" object - this middleware
// checks if there were any violations, and if so, stops the request with a clear error message.
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Combine all validation error messages into one readable string
    const errorMessages = errors.array().map((err) => err.msg).join(', ');
    return sendError(res, 400, errorMessages);
  }

  next();
};

module.exports = validateRequest;