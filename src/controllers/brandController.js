const phoneService = require("../services/phoneService");
const { sendSuccess } = require("../utils/apiResponse");
const { serializePhones } = require("../utils/serializePhone");
const asyncHandler = require("../utils/asyncHandler");

const getBrands = asyncHandler(async (req, res) => {
  const brands = await phoneService.getAllBrands();
  sendSuccess(res, brands);
});

const getPhonesByBrand = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { phones, pagination } = await phoneService.getPhonesByBrand(req.params.brand, { page, limit });
  sendSuccess(res, serializePhones(phones), 200, { pagination, brand: req.params.brand });
});

module.exports = { getBrands, getPhonesByBrand };
