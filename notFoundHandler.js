// Catches any request that didn't match a defined route and turns it
// into our consistent error shape instead of Express's default HTML page.

const ApiError = require("../utils/ApiError");
const { ROUTE_NOT_FOUND } = require("../utils/errorCodes");

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(ROUTE_NOT_FOUND, `Route ${req.method} ${req.originalUrl} not found`));
}

module.exports = notFoundHandler;
