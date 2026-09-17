// Centralized error handler. Every error in the app should end up here
// (thrown inside an asyncHandler-wrapped route, or passed to next(err)).
// Produces the consistent shape:
//   { success: false, error: { code, message, details? } }
// and never leaks stack traces / raw DB errors in production.

const { Prisma } = require("@prisma/client");
const ApiError = require("../utils/ApiError");
const { DATABASE_ERROR, INTERNAL_SERVER_ERROR, VALIDATION_ERROR } = require("../utils/errorCodes");

function formatError(res, statusCode, code, message, details) {
  const body = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === "production";

  // 1) Our own, intentional ApiError instances
  if (err instanceof ApiError) {
    return formatError(res, err.statusCode, err.code, err.message, err.details);
  }

  // 2) Known Prisma errors -> map to safe, useful responses
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      // Unique constraint violation (e.g. duplicate slug)
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : err.meta?.target;
      return formatError(
        res,
        409,
        "DUPLICATE_SLUG",
        `A phone with this ${target || "value"} already exists`
      );
    }
    if (err.code === "P2025") {
      // Record to update/delete was not found
      return formatError(res, 404, "PHONE_NOT_FOUND", "Phone not found");
    }
    // Any other known Prisma error -> generic database error, no internals leaked
    return formatError(
      res,
      500,
      DATABASE_ERROR,
      "A database error occurred while processing your request"
    );
  }

  if (
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientInitializationError
  ) {
    return formatError(
      res,
      500,
      DATABASE_ERROR,
      "A database error occurred while processing your request"
    );
  }

  // 3) express-validator / body-parser JSON syntax errors
  if (err.type === "entity.parse.failed") {
    return formatError(res, 400, VALIDATION_ERROR, "Request body contains invalid JSON");
  }

  // 4) Fallback: unexpected error
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  return formatError(
    res,
    500,
    INTERNAL_SERVER_ERROR,
    isProd ? "An unexpected error occurred" : err.message || "An unexpected error occurred"
  );
}

module.exports = errorHandler;
