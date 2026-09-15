// Runs after a list of express-validator rules. If any rule failed,
// collects the messages and forwards a single, consistently-shaped
// ApiError(VALIDATION_ERROR) to the error handler instead of letting
// each controller deal with validation results itself.

const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");
const { VALIDATION_ERROR } = require("../utils/errorCodes");

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return next(
      ApiError.badRequest(VALIDATION_ERROR, "One or more request parameters are invalid", details)
    );
  }
  next();
}

module.exports = handleValidationErrors;
