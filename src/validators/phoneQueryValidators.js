// Validation rules for GET /api/phones and GET /api/phones/search
// Uses express-validator. Rules run, then `handleValidationErrors`
// middleware (see middleware/validate.js) turns any failures into
// a consistent ApiError(VALIDATION_ERROR).

const { query, param } = require("express-validator");

const ALLOWED_SORT_FIELDS = [
  "price",
  "-price",
  "releaseDate",
  "-releaseDate",
  "rating",
  "-rating",
  "brand",
  "-brand",
  "model",
  "-model",
];

const listPhonesValidators = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be an integer between 1 and 100")
    .toInt(),
  query("search").optional().isString().trim().isLength({ max: 200 }),
  query("brand").optional().isString().trim().isLength({ max: 100 }),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("minPrice must be a non-negative number")
    .toFloat(),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("maxPrice must be a non-negative number")
    .toFloat(),
  query("ram")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ram must be a positive integer (in GB)")
    .toInt(),
  query("storage")
    .optional()
    .isInt({ min: 1 })
    .withMessage("storage must be a positive integer (in GB)")
    .toInt(),
  query("operatingSystem").optional().isString().trim().isLength({ max: 100 }),
  query("sort")
    .optional()
    .isIn(ALLOWED_SORT_FIELDS)
    .withMessage(`sort must be one of: ${ALLOWED_SORT_FIELDS.join(", ")}`),
];

const searchPhonesValidators = [
  query("q")
    .exists({ checkFalsy: true })
    .withMessage("Query parameter 'q' is required")
    .bail()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("'q' must be between 1 and 200 characters"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

const phoneIdParamValidator = [
  param("id")
    .exists()
    .withMessage("Phone id is required")
    .bail()
    .isInt({ min: 1 })
    .withMessage("Phone id must be a positive integer")
    .toInt(),
];

const phoneSlugParamValidator = [
  param("slug")
    .exists({ checkFalsy: true })
    .withMessage("Phone slug is required")
    .isString()
    .trim(),
];

const brandParamValidator = [
  param("brand")
    .exists({ checkFalsy: true })
    .withMessage("Brand is required")
    .isString()
    .trim(),
];

const comparePhonesValidators = [
  query("ids")
    .exists({ checkFalsy: true })
    .withMessage("Query parameter 'ids' is required, e.g. ?ids=1,2,3")
    .bail()
    .isString(),
];

module.exports = {
  listPhonesValidators,
  searchPhonesValidators,
  phoneIdParamValidator,
  phoneSlugParamValidator,
  brandParamValidator,
  comparePhonesValidators,
  ALLOWED_SORT_FIELDS,
};
