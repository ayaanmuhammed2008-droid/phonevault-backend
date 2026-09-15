// Loads .env before any test file runs (jest config: setupFiles).
// Tests expect NODE_ENV=test and a reachable DATABASE_URL (ideally a
// separate test database - see README "Running tests").
process.env.NODE_ENV = "test";
require("dotenv").config();
