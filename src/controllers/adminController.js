const phoneService = require("../services/phoneService");
const { sendSuccess } = require("../utils/apiResponse");
const { serializePhone, serializePhones } = require("../utils/serializePhone");
const asyncHandler = require("../utils/asyncHandler");

const listPhonesAdmin = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { phones, pagination } = await phoneService.listPhonesAdmin({ page, limit });
  sendSuccess(res, serializePhones(phones), 200, { pagination });
});

const createPhone = asyncHandler(async (req, res) => {
  const phone = await phoneService.createPhone(req.body);
  sendSuccess(res, serializePhone(phone), 201);
});

const updatePhone = asyncHandler(async (req, res) => {
  const phone = await phoneService.updatePhone(req.params.id, req.body);
  sendSuccess(res, serializePhone(phone));
});

const deletePhone = asyncHandler(async (req, res) => {
  await phoneService.deletePhone(req.params.id);
  sendSuccess(res, { id: req.params.id, deleted: true });
});

module.exports = { listPhonesAdmin, createPhone, updatePhone, deletePhone };
