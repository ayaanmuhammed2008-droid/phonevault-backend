// Validation rules for admin write endpoints (create / update a phone).
// `createPhoneValidators` requires the core fields; `updatePhoneValidators`
// makes every field optional since PUT here is used as a partial update.

const { body } = require("express-validator");

const baseFieldRules = [
  body("brand").optional().isString().trim().isLength({ min: 1, max: 100 }),
  body("model").optional().isString().trim().isLength({ min: 1, max: 150 }),
  body("slug")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("slug must be lowercase, alphanumeric, and hyphen-separated (e.g. 'iphone-16-pro')"),
  body("price").optional().isFloat({ min: 0 }).withMessage("price must be a non-negative number"),
  body("releaseDate").optional({ nullable: true }).isISO8601().withMessage("releaseDate must be a valid date (ISO 8601)"),
  body("description").optional({ nullable: true }).isString(),
  body("imageUrl").optional({ nullable: true }).isString().isLength({ max: 2000 }),

  body("displaySize").optional({ nullable: true }).isFloat({ min: 0 }),
  body("displayType").optional({ nullable: true }).isString(),
  body("resolution").optional({ nullable: true }).isString(),
  body("refreshRate").optional({ nullable: true }).isInt({ min: 0 }),

  body("processor").optional({ nullable: true }).isString(),
  body("gpu").optional({ nullable: true }).isString(),
  body("ram").optional({ nullable: true }).isInt({ min: 0 }),
  body("storage").optional({ nullable: true }).isInt({ min: 0 }),
  body("operatingSystem").optional({ nullable: true }).isString(),

  body("mainCamera").optional({ nullable: true }).isString(),
  body("ultrawideCamera").optional({ nullable: true }).isString(),
  body("telephotoCamera").optional({ nullable: true }).isString(),
  body("frontCamera").optional({ nullable: true }).isString(),
  body("videoRecording").optional({ nullable: true }).isString(),

  body("batteryCapacity").optional({ nullable: true }).isInt({ min: 0 }),
  body("chargingSpeed").optional({ nullable: true }).isString(),
  body("wirelessCharging").optional().isBoolean().toBoolean(),

  body("network").optional({ nullable: true }).isString(),
  body("wifi").optional({ nullable: true }).isString(),
  body("bluetooth").optional({ nullable: true }).isString(),
  body("nfc").optional().isBoolean().toBoolean(),
  body("usb").optional({ nullable: true }).isString(),
  body("fiveG").optional().isBoolean().toBoolean(),

  body("dimensions").optional({ nullable: true }).isString(),
  body("weight").optional({ nullable: true }).isFloat({ min: 0 }),

  body("rating").optional({ nullable: true }).isFloat({ min: 0, max: 5 }),
];

const createPhoneValidators = [
  body("brand").exists({ checkFalsy: true }).withMessage("brand is required").isString().trim().isLength({ min: 1, max: 100 }),
  body("model").exists({ checkFalsy: true }).withMessage("model is required").isString().trim().isLength({ min: 1, max: 150 }),
  body("slug")
    .exists({ checkFalsy: true })
    .withMessage("slug is required")
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("slug must be lowercase, alphanumeric, and hyphen-separated (e.g. 'iphone-16-pro')"),
  body("price").exists().withMessage("price is required").isFloat({ min: 0 }).withMessage("price must be a non-negative number"),
  // Remaining optional spec fields (display, performance, camera, battery, etc.)
  // baseFieldRules[0..3] are brand/model/slug/price, already validated above.
  ...baseFieldRules.slice(4),
];

const updatePhoneValidators = [...baseFieldRules];

module.exports = { createPhoneValidators, updatePhoneValidators };
