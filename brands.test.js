const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/utils/prismaClient");
const { seedTestData, clearTestData } = require("./helpers/testData");

beforeAll(async () => {
  await seedTestData();
});

afterAll(async () => {
  await clearTestData();
  await prisma.$disconnect();
});

describe("GET /api/brands", () => {
  it("returns a list of brands that exist in the database", async () => {
    const res = await request(app).get("/api/brands");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(expect.arrayContaining(["Samsung", "Apple"]));
  });
});

describe("GET /api/brands/:brand/phones", () => {
  it("returns phones for an existing brand", async () => {
    const res = await request(app).get("/api/brands/Samsung/phones");
    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.brand === "Samsung")).toBe(true);
  });

  it("is case-insensitive", async () => {
    const res = await request(app).get("/api/brands/samsung/phones");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("returns 404 for a brand that doesn't exist", async () => {
    const res = await request(app).get("/api/brands/NotARealBrandXYZ/phones");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("BRAND_NOT_FOUND");
  });
});
