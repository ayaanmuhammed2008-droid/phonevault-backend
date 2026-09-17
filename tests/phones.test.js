const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/utils/prismaClient");
const { seedTestData, clearTestData } = require("./helpers/testData");

let testPhones;

beforeAll(async () => {
  testPhones = await seedTestData();
});

afterAll(async () => {
  await clearTestData();
  await prisma.$disconnect();
});

describe("GET /api/phones", () => {
  it("returns a paginated list of phones", async () => {
    const res = await request(app).get("/api/phones");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.pagination).toHaveProperty("total");
  });

  it("filters phones by brand", async () => {
    const res = await request(app).get("/api/phones?brand=Samsung");
    expect(res.status).toBe(200);
    expect(res.body.data.every((p) => p.brand === "Samsung")).toBe(true);
  });

  it("rejects an invalid page parameter", async () => {
    const res = await request(app).get("/api/phones?page=0");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an invalid limit parameter", async () => {
    const res = await request(app).get("/api/phones?limit=abc");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/phones/search", () => {
  it("finds phones matching a Samsung search query", async () => {
    const res = await request(app).get("/api/phones/search?q=Samsung");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((p) => p.brand === "Samsung")).toBe(true);
  });

  it("requires a query parameter", async () => {
    const res = await request(app).get("/api/phones/search");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/phones/:id", () => {
  it("returns a single phone by id", async () => {
    const target = testPhones[0];
    const res = await request(app).get(`/api/phones/${target.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(target.id);
    expect(res.body.data.slug).toBe(target.slug);
  });

  it("returns 404 for a non-existent phone", async () => {
    const res = await request(app).get("/api/phones/999999999");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PHONE_NOT_FOUND");
  });

  it("returns 400 for an invalid (non-numeric) id", async () => {
    const res = await request(app).get("/api/phones/not-a-number");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/phones/slug/:slug", () => {
  it("returns a phone by slug", async () => {
    const target = testPhones[0];
    const res = await request(app).get(`/api/phones/slug/${target.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(target.id);
  });
});

describe("GET /api/phones/compare", () => {
  it("compares 2 phones successfully", async () => {
    const ids = `${testPhones[0].id},${testPhones[1].id}`;
    const res = await request(app).get(`/api/phones/compare?ids=${ids}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it("compares 3 phones successfully", async () => {
    const ids = testPhones.map((p) => p.id).join(",");
    const res = await request(app).get(`/api/phones/compare?ids=${ids}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  it("rejects comparison of more than 3 phones", async () => {
    const res = await request(app).get("/api/phones/compare?ids=1,2,3,4");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("TOO_MANY_COMPARE_IDS");
  });

  it("returns an error when a compared phone doesn't exist", async () => {
    const res = await request(app).get(
      `/api/phones/compare?ids=${testPhones[0].id},999999999`
    );
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PHONE_NOT_FOUND");
  });

  it("rejects invalid phone ids", async () => {
    const res = await request(app).get("/api/phones/compare?ids=abc,def");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_PHONE_IDS");
  });
});

describe("GET /api/phones/price-range", () => {
  it("returns price range statistics", async () => {
    const res = await request(app).get("/api/phones/price-range");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("min");
    expect(res.body.data).toHaveProperty("max");
    expect(res.body.data).toHaveProperty("byBrand");
  });
});
