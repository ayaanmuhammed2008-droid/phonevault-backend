// Business logic + database access for phones. Controllers stay thin and
// call into this layer, which is the only place that talks to Prisma for
// phone-related operations. Keeping this separate makes it easy to test
// and to reuse logic (e.g. compare uses the same "select" shape as list).

const prisma = require("../utils/prismaClient");
const ApiError = require("../utils/ApiError");
const { PHONE_NOT_FOUND, INVALID_PHONE_IDS, TOO_MANY_COMPARE_IDS, NOT_ENOUGH_COMPARE_IDS } = require("../utils/errorCodes");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_COMPARE_IDS = 3;

/**
 * Build a Prisma `where` clause from validated query filters.
 */
function buildWhereClause({ search, brand, minPrice, maxPrice, ram, storage, operatingSystem }) {
  const where = {};
  const AND = [];

  if (search) {
    AND.push({
      OR: [
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (brand) {
    where.brand = { equals: brand, mode: "insensitive" };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  if (ram !== undefined) {
    where.ram = ram;
  }

  if (storage !== undefined) {
    where.storage = storage;
  }

  if (operatingSystem) {
    where.operatingSystem = { contains: operatingSystem, mode: "insensitive" };
  }

  if (AND.length > 0) {
    where.AND = AND;
  }

  return where;
}

/**
 * Build a Prisma `orderBy` clause from a "sort" query param such as
 * "price", "-price", "releaseDate", "-rating", etc.
 */
function buildOrderBy(sort) {
  if (!sort) return { createdAt: "desc" };
  const direction = sort.startsWith("-") ? "desc" : "asc";
  const field = sort.replace(/^-/, "");
  return { [field]: direction };
}

async function listPhones(filters) {
  const page = filters.page || DEFAULT_PAGE;
  const limit = filters.limit || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(filters.sort);

  const [phones, total] = await Promise.all([
    prisma.phone.findMany({ where, orderBy, skip, take: limit }),
    prisma.phone.count({ where }),
  ]);

  return {
    phones,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}

async function searchPhones({ q, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT }) {
  return listPhones({ search: q, page, limit });
}

async function getPhoneById(id) {
  const phone = await prisma.phone.findUnique({ where: { id } });
  if (!phone) {
    throw ApiError.notFound(PHONE_NOT_FOUND, `Phone with id ${id} not found`);
  }
  return phone;
}

async function getPhoneBySlug(slug) {
  const phone = await prisma.phone.findUnique({ where: { slug } });
  if (!phone) {
    throw ApiError.notFound(PHONE_NOT_FOUND, `Phone with slug "${slug}" not found`);
  }
  return phone;
}

async function getAllBrands() {
  // Pull distinct brands directly from the data - never hard-coded -
  // so newly-added brands automatically show up here.
  const rows = await prisma.phone.findMany({
    distinct: ["brand"],
    select: { brand: true },
    orderBy: { brand: "asc" },
  });
  return rows.map((r) => r.brand);
}

async function getPhonesByBrand(brand, { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) {
  // Case-insensitive match against the brand as actually stored,
  // since a brand only "exists" if it has at least one phone.
  const skip = (page - 1) * limit;
  const where = { brand: { equals: brand, mode: "insensitive" } };

  const [phones, total] = await Promise.all([
    prisma.phone.findMany({ where, skip, take: limit, orderBy: { model: "asc" } }),
    prisma.phone.count({ where }),
  ]);

  if (total === 0) {
    const { BRAND_NOT_FOUND } = require("../utils/errorCodes");
    throw ApiError.notFound(BRAND_NOT_FOUND, `Brand "${brand}" not found`);
  }

  return {
    phones,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}

async function getPriceRange() {
  const [aggregate, brandBuckets] = await Promise.all([
    prisma.phone.aggregate({ _min: { price: true }, _max: { price: true }, _avg: { price: true } }),
    prisma.phone.groupBy({ by: ["brand"], _min: { price: true }, _max: { price: true } }),
  ]);

  return {
    min: aggregate._min.price !== null ? Number(aggregate._min.price) : null,
    max: aggregate._max.price !== null ? Number(aggregate._max.price) : null,
    average: aggregate._avg.price !== null ? Number(aggregate._avg.price.toFixed(2)) : null,
    byBrand: brandBuckets.map((b) => ({
      brand: b.brand,
      min: b._min.price !== null ? Number(b._min.price) : null,
      max: b._max.price !== null ? Number(b._max.price) : null,
    })),
  };
}

/**
 * Parse and validate a comma-separated "ids" query string, e.g. "1,2,3".
 * Throws ApiError for malformed input, too many, or too few ids.
 */
function parseCompareIds(idsParam) {
  const rawIds = idsParam.split(",").map((s) => s.trim()).filter(Boolean);

  if (rawIds.length === 0) {
    throw ApiError.badRequest(NOT_ENOUGH_COMPARE_IDS, "Provide at least 2 phone ids to compare, e.g. ?ids=1,2");
  }

  if (rawIds.length > MAX_COMPARE_IDS) {
    throw ApiError.badRequest(
      TOO_MANY_COMPARE_IDS,
      `You can compare at most ${MAX_COMPARE_IDS} phones at a time`
    );
  }

  const ids = rawIds.map((raw) => {
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) {
      throw ApiError.badRequest(INVALID_PHONE_IDS, `Invalid phone id: "${raw}"`);
    }
    return n;
  });

  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length < 2) {
    throw ApiError.badRequest(NOT_ENOUGH_COMPARE_IDS, "Provide at least 2 different phone ids to compare");
  }

  return uniqueIds;
}

async function comparePhones(idsParam) {
  const ids = parseCompareIds(idsParam);

  const phones = await prisma.phone.findMany({ where: { id: { in: ids } } });

  if (phones.length !== ids.length) {
    const foundIds = new Set(phones.map((p) => p.id));
    const missing = ids.filter((id) => !foundIds.has(id));
    throw ApiError.notFound(
      PHONE_NOT_FOUND,
      `Phone(s) not found: ${missing.join(", ")}`
    );
  }

  // Preserve the order the caller requested
  const byId = new Map(phones.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id));
}

async function createPhone(data) {
  return prisma.phone.create({ data });
}

async function updatePhone(id, data) {
  // Ensure the phone exists first so we can return our own 404 shape
  // instead of relying solely on Prisma's P2025 mapping.
  const existing = await prisma.phone.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound(PHONE_NOT_FOUND, `Phone with id ${id} not found`);
  }
  return prisma.phone.update({ where: { id }, data });
}

async function deletePhone(id) {
  const existing = await prisma.phone.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound(PHONE_NOT_FOUND, `Phone with id ${id} not found`);
  }
  await prisma.phone.delete({ where: { id } });
}

async function listPhonesAdmin({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) {
  const skip = (page - 1) * limit;
  const [phones, total] = await Promise.all([
    prisma.phone.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.phone.count(),
  ]);
  return {
    phones,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

module.exports = {
  listPhones,
  searchPhones,
  getPhoneById,
  getPhoneBySlug,
  getAllBrands,
  getPhonesByBrand,
  getPriceRange,
  comparePhones,
  createPhone,
  updatePhone,
  deletePhone,
  listPhonesAdmin,
  MAX_COMPARE_IDS,
};
