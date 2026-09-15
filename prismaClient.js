// Single shared Prisma Client instance used across the whole app.
// Prevents exhausting DB connections by re-instantiating PrismaClient everywhere.

const { PrismaClient } = require("@prisma/client");

const prisma =
  global.__phonevaultPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Reuse the same instance across hot-reloads in development
if (process.env.NODE_ENV === "development") {
  global.__phonevaultPrisma = prisma;
}

module.exports = prisma;
