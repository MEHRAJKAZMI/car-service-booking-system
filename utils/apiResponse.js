// Standard success response helper
// Usage: sendSuccess(res, 200, "User created successfully", { user })
const sendSuccess = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message
  };

  // Only include "data" key if something was actually passed
  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Standard error response helper
// Usage: sendError(res, 400, "Email already registered")
const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = { sendSuccess, sendError };