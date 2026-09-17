// Protects /api/admin/* routes. The caller must send the header:
//   x-admin-api-key: <ADMIN_API_KEY>
// The key lives only in the backend's .env file and is never sent to
// or readable by the frontend — the frontend server/build (not client
// JS) should be the only thing that ever holds this value, and only
// if it needs to perform admin actions.

const crypto = require("crypto");
const ApiError = require("../utils/ApiError");
const { UNAUTHORIZED } = require("../utils/errorCodes");

function safeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function adminAuth(req, res, next) {
  const providedKey = req.header("x-admin-api-key");
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    // Misconfiguration on the server's side - fail closed, not open.
    return next(ApiError.internal("Admin authentication is not configured on the server"));
  }

  if (!providedKey || !safeCompare(providedKey, expectedKey)) {
    return next(ApiError.unauthorized(UNAUTHORIZED, "Missing or invalid admin API key"));
  }

  next();
}

module.exports = adminAuth;
