// Thin controllers: parse request input, delegate to the service layer,
// serialize the result, and send a consistent success response.
// All errors are thrown and caught by asyncHandler -> errorHandler.

const phoneService = require("../services/phoneService");
const { sendSuccess } = require("../utils/apiResponse");
const { serializePhone, serializePhones } = require("../utils/serializePhone");
const asyncHandler = require("../utils/asyncHandler");

const listPhones = asyncHandler(async (req, res) => {
  const { page, limit, search, brand, minPrice, maxPrice, ram, storage, operatingSystem, sort } = req.query;

  const { phones, pagination } = await phoneService.listPhones({
    page,
    limit,
    search,
    brand,
    minPrice,
    maxPrice,
    ram,
    storage,
    operatingSystem,
    sort,
  });

  sendSuccess(res, serializePhones(phones), 200, { pagination });
});

const searchPhones = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;
  const { phones, pagination } = await phoneService.searchPhones({ q, page, limit });
  sendSuccess(res, serializePhones(phones), 200, { pagination, query: q });
});

const getPhoneById = asyncHandler(async (req, res) => {
  const phone = await phoneService.getPhoneById(req.params.id);
  sendSuccess(res, serializePhone(phone));
});

const getPhoneBySlug = asyncHandler(async (req, res) => {
  const phone = await phoneService.getPhoneBySlug(req.params.slug);
  sendSuccess(res, serializePhone(phone));
});

const getPriceRange = asyncHandler(async (req, res) => {
  const range = await phoneService.getPriceRange();
  sendSuccess(res, range);
});

const comparePhones = asyncHandler(async (req, res) => {
  const phones = await phoneService.comparePhones(req.query.ids);
  sendSuccess(res, serializePhones(phones), 200, { count: phones.length });
});

module.exports = {
  listPhones,
  searchPhones,
  getPhoneById,
  getPhoneBySlug,
  getPriceRange,
  comparePhones,
};
