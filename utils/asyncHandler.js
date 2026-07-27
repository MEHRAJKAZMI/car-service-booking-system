// Wraps an async controller function so any thrown error automatically
// gets passed to next(error) - which triggers our global error handler.
// This lets us skip writing try/catch in every single controller function.
//
// Usage: exports.getSomething = asyncHandler(async (req, res) => { ... });
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;