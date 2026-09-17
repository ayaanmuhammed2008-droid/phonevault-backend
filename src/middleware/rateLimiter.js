// General-purpose rate limiter applied to the whole API to reduce abuse.
// Configurable via env vars so it can be tuned per environment without
// code changes.

const rateLimit = require("express-rate-limit");
const { RATE_LIMIT_EXCEEDED } = require("../utils/errorCodes");

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const max = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200;

const apiLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: RATE_LIMIT_EXCEEDED,
        message: "Too many requests, please try again later",
      },
    });
  },
});

module.exports = apiLimiter;
