// Unit tests for the error handler middleware itself, isolated from the
// database. This covers how Prisma errors and unexpected errors are
// mapped to the API's consistent error shape without needing a live DB
// failure to occur.

const { Prisma } = require("@prisma/client");
const errorHandler = require("../src/middleware/errorHandler");
const ApiError = require("../src/utils/ApiError");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("errorHandler middleware", () => {
  it("formats a known ApiError", () => {
    const res = mockRes();
    const err = ApiError.notFound("PHONE_NOT_FOUND", "Phone not found");
    errorHandler(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "PHONE_NOT_FOUND", message: "Phone not found" },
    });
  });

  it("maps a Prisma unique constraint violation (P2002) to 409 DUPLICATE_SLUG", () => {
    const res = mockRes();
    const err = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "5.20.0",
      meta: { target: ["slug"] },
    });
    errorHandler(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(409);
    const body = res.json.mock.calls[0][0];
    expect(body.error.code).toBe("DUPLICATE_SLUG");
  });

  it("maps a Prisma record-not-found (P2025) to 404 PHONE_NOT_FOUND", () => {
    const res = mockRes();
    const err = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "5.20.0",
    });
    errorHandler(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].error.code).toBe("PHONE_NOT_FOUND");
  });

  it("maps an unexpected error to 500 without leaking internals in production", () => {
    const res = mockRes();
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const err = new Error("some internal detail that should not leak");
    errorHandler(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(body.error.message).not.toMatch(/internal detail/);

    process.env.NODE_ENV = originalEnv;
  });
});
