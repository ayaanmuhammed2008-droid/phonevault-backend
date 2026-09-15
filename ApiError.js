// Custom error class carrying an HTTP status code and a machine-readable
// error "code" string, so every part of the app can throw errors the
// same way and the error handler middleware can format them consistently.

class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code, e.g. 404
   * @param {string} code - machine-readable error code, e.g. "PHONE_NOT_FOUND"
   * @param {string} message - human-readable message
   * @param {object|null} details - optional extra details (e.g. validation errors)
   */
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(code, message, details = null) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(code = "UNAUTHORIZED", message = "Unauthorized") {
    return new ApiError(401, code, message);
  }

  static forbidden(code = "FORBIDDEN", message = "Forbidden") {
    return new ApiError(403, code, message);
  }

  static notFound(code, message) {
    return new ApiError(404, code, message);
  }

  static conflict(code, message) {
    return new ApiError(409, code, message);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, "INTERNAL_SERVER_ERROR", message);
  }
}

module.exports = ApiError;
