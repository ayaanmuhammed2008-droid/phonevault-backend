const express = require("express");
const adminController = require("../controllers/adminController");
const adminAuth = require("../middleware/adminAuth");
const validate = require("../middleware/validate");
const { phoneIdParamValidator } = require("../validators/phoneQueryValidators");
const { createPhoneValidators, updatePhoneValidators } = require("../validators/phoneBodyValidators");

const router = express.Router();

// Every route below requires a valid x-admin-api-key header.
router.use(adminAuth);

// GET /api/admin/phones
router.get("/phones", adminController.listPhonesAdmin);

// POST /api/admin/phones
router.post("/phones", createPhoneValidators, validate, adminController.createPhone);

// PUT /api/admin/phones/:id
router.put(
  "/phones/:id",
  [...phoneIdParamValidator, ...updatePhoneValidators],
  validate,
  adminController.updatePhone
);

// DELETE /api/admin/phones/:id
router.delete("/phones/:id", phoneIdParamValidator, validate, adminController.deletePhone);

module.exports = router;
