const express = require("express");
const brandController = require("../controllers/brandController");
const validate = require("../middleware/validate");
const { brandParamValidator } = require("../validators/phoneQueryValidators");

const router = express.Router();

// GET /api/brands
router.get("/", brandController.getBrands);

// GET /api/brands/:brand/phones
router.get("/:brand/phones", brandParamValidator, validate, brandController.getPhonesByBrand);

module.exports = router;
