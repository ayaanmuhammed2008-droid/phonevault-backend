// Wraps an async Express route handler so any thrown error or rejected
// promise is automatically passed to next(), reaching our error middleware
// instead of crashing the process or requiring try/catch in every controller.

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
