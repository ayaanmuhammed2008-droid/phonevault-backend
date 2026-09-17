// Express app setup: security middleware, parsers, routes, and error
// handling. Exported (not started) so tests can import it directly with
// supertest without binding to a real port.

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const apiRoutes = require("./routes");
const apiLimiter = require("./middleware/rateLimiter");
const notFoundHandler = require("./middleware/notFoundHandler");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Trust proxy (needed for correct client IPs / rate limiting behind
// platforms like Render, Railway, Heroku, etc.)
app.set("trust proxy", 1);

// ---------- Security & core middleware ----------
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no origin, e.g. curl/Postman) and
      // requests from any explicitly configured origin.
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  })
);

app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use("/api", apiLimiter);

// ---------- Routes ----------
app.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      name: "PhoneVault API",
      status: "running",
      docs: "See README.md for full endpoint documentation",
    },
  });
});

app.use("/api", apiRoutes);

// ---------- 404 + error handling (must be last) ----------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
