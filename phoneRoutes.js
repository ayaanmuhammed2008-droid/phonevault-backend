const express = require("express");
const phoneController = require("../controllers/phoneController");
const validate = require("../middleware/validate");
const {
  listPhonesValidators,
  searchPhonesValidators,
  phoneIdParamValidator,
  phoneSlugParamValidator,
  comparePhonesValidators,
} = require("../validators/phoneQueryValidators");

const router = express.Router();

// IMPORTANT: specific routes (search, compare, price-range, slug/:slug)
// must be declared BEFORE the generic "/:id" route, otherwise Express
// would try to match "search", "compare" etc. as an :id value.

// GET /api/phones/search?q=...
router.get("/search", searchPhonesValidators, validate, phoneController.searchPhones);

// GET /api/phones/compare?ids=1,2,3
router.get("/compare", comparePhonesValidators, validate, phoneController.comparePhones);

// GET /api/phones/price-range
router.get("/price-range", phoneController.getPriceRange);

// GET /api/phones/slug/:slug
router.get("/slug/:slug", phoneSlugParamValidator, validate, phoneController.getPhoneBySlug);

// GET /api/phones
router.get("/", listPhonesValidators, validate, phoneController.listPhones);

// GET /api/phones/:id
router.get("/:id", phoneIdParamValidator, validate, phoneController.getPhoneById);

module.exports = router;
