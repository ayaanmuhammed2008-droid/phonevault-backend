const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/utils/prismaClient");
const { clearTestData } = require("./helpers/testData");

const ADMIN_KEY = process.env.ADMIN_API_KEY;
const TEST_SLUG = "test-admin-created-phone";

afterAll(async () => {
  await clearTestData();
  await prisma.$disconnect();
});

describe("Admin authentication", () => {
  it("rejects requests with no admin key", async () => {
    const res = await request(app).get("/api/admin/phones");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects requests with a wrong admin key", async () => {
    const res = await request(app).get("/api/admin/phones").set("x-admin-api-key", "wrong-key");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("Admin phone CRUD", () => {
  let createdId;

  it("creates a phone", async () => {
    const res = await request(app)
      .post("/api/admin/phones")
      .set("x-admin-api-key", ADMIN_KEY)
      .send({
        brand: "TestBrand",
        model: "Admin Created Phone",
        slug: TEST_SLUG,
        price: 199.99,
        ram: 4,
        storage: 64,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe(TEST_SLUG);
    createdId = res.body.data.id;
  });

  it("rejects creating a phone with missing required fields", async () => {
    const res = await request(app)
      .post("/api/admin/phones")
      .set("x-admin-api-key", ADMIN_KEY)
      .send({ brand: "OnlyBrand" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a duplicate slug", async () => {
    const res = await request(app)
      .post("/api/admin/phones")
      .set("x-admin-api-key", ADMIN_KEY)
      .send({ brand: "TestBrand", model: "Duplicate", slug: TEST_SLUG, price: 1 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_SLUG");
  });

  it("updates a phone", async () => {
    const res = await request(app)
      .put(`/api/admin/phones/${createdId}`)
      .set("x-admin-api-key", ADMIN_KEY)
      .send({ price: 179.99 });

    expect(res.status).toBe(200);
    expect(Number(res.body.data.price)).toBe(179.99);
  });

  it("returns 404 when updating a non-existent phone", async () => {
    const res = await request(app)
      .put("/api/admin/phones/999999999")
      .set("x-admin-api-key", ADMIN_KEY)
      .send({ price: 10 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PHONE_NOT_FOUND");
  });

  it("lists phones via the admin endpoint", async () => {
    const res = await request(app).get("/api/admin/phones").set("x-admin-api-key", ADMIN_KEY);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("deletes a phone", async () => {
    const res = await request(app)
      .delete(`/api/admin/phones/${createdId}`)
      .set("x-admin-api-key", ADMIN_KEY);
    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
  });

  it("returns 404 when deleting a non-existent phone", async () => {
    const res = await request(app)
      .delete("/api/admin/phones/999999999")
      .set("x-admin-api-key", ADMIN_KEY);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PHONE_NOT_FOUND");
  });
});
