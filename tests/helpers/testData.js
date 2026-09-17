// Small, predictable dataset used by the integration tests. Kept separate
// from prisma/seed.js (which is the larger, realistic dataset for local
// development) so tests don't depend on that data changing over time.

const prisma = require("../../src/utils/prismaClient");

const TEST_PHONES = [
  {
    brand: "Samsung",
    model: "Galaxy Test One",
    slug: "test-samsung-galaxy-test-one",
    price: 999.99,
    ram: 8,
    storage: 128,
    operatingSystem: "Android 14",
    rating: 4.5,
  },
  {
    brand: "Samsung",
    model: "Galaxy Test Two",
    slug: "test-samsung-galaxy-test-two",
    price: 499.99,
    ram: 6,
    storage: 128,
    operatingSystem: "Android 14",
    rating: 4.0,
  },
  {
    brand: "Apple",
    model: "iPhone Test",
    slug: "test-apple-iphone-test",
    price: 1099.0,
    ram: 8,
    storage: 256,
    operatingSystem: "iOS 18",
    rating: 4.7,
  },
];

async function seedTestData() {
  await clearTestData();
  const created = [];
  for (const phone of TEST_PHONES) {
    created.push(await prisma.phone.create({ data: phone }));
  }
  return created;
}

async function clearTestData() {
  await prisma.phone.deleteMany({
    where: { slug: { startsWith: "test-" } },
  });
}

module.exports = { seedTestData, clearTestData, TEST_PHONES };
