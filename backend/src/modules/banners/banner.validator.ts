import { body, param, query } from "express-validator";

const BANNER_TYPES = ["FESTIVAL", "SEASONAL", "SALE", "PROMOTIONAL", "GENERAL"];

export const createBannerValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Banner title is required.")
    .isLength({ max: 150 })
    .withMessage("Banner title cannot exceed 150 characters."),

  body("subtitle")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Subtitle cannot exceed 200 characters."),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters."),

  body("type")
    .optional()
    .isIn(BANNER_TYPES)
    .withMessage(`Type must be one of: ${BANNER_TYPES.join(", ")}`),

  body("badgeText")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 60 })
    .withMessage("Badge text cannot exceed 60 characters."),

  body("buttonText")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage("Button text cannot exceed 50 characters."),

  body("link")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage("Link cannot exceed 255 characters."),

  body("image")
    .optional({ nullable: true })
    .trim(),

  body("mobileImage")
    .optional({ nullable: true })
    .trim(),

  body("bgGradient")
    .optional({ nullable: true })
    .trim(),

  body("textColor")
    .optional({ nullable: true })
    .trim(),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean.")
    .toBoolean(),

  body("priority")
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage("Priority must be an integer between 0 and 10000.")
    .toInt(),

  body("startDate")
    .optional({ nullable: true })
    .custom((val) => {
      if (!val) return true;
      if (isNaN(Date.parse(val))) {
        throw new Error("startDate must be a valid ISO Date string.");
      }
      return true;
    }),

  body("endDate")
    .optional({ nullable: true })
    .custom((val, { req }) => {
      if (!val) return true;
      if (isNaN(Date.parse(val))) {
        throw new Error("endDate must be a valid ISO Date string.");
      }
      if (req.body.startDate && new Date(val) < new Date(req.body.startDate)) {
        throw new Error("endDate cannot be earlier than startDate.");
      }
      return true;
    }),
];

export const updateBannerValidator = [
  param("id")
    .trim()
    .isUUID()
    .withMessage("Invalid banner ID parameter."),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Banner title cannot be empty.")
    .isLength({ max: 150 })
    .withMessage("Banner title cannot exceed 150 characters."),

  body("subtitle")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Subtitle cannot exceed 200 characters."),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters."),

  body("type")
    .optional()
    .isIn(BANNER_TYPES)
    .withMessage(`Type must be one of: ${BANNER_TYPES.join(", ")}`),

  body("badgeText")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 60 })
    .withMessage("Badge text cannot exceed 60 characters."),

  body("buttonText")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage("Button text cannot exceed 50 characters."),

  body("link")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage("Link cannot exceed 255 characters."),

  body("image")
    .optional({ nullable: true })
    .trim(),

  body("mobileImage")
    .optional({ nullable: true })
    .trim(),

  body("bgGradient")
    .optional({ nullable: true })
    .trim(),

  body("textColor")
    .optional({ nullable: true })
    .trim(),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean.")
    .toBoolean(),

  body("priority")
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage("Priority must be an integer between 0 and 10000.")
    .toInt(),

  body("startDate")
    .optional({ nullable: true })
    .custom((val) => {
      if (!val) return true;
      if (isNaN(Date.parse(val))) {
        throw new Error("startDate must be a valid ISO Date string.");
      }
      return true;
    }),

  body("endDate")
    .optional({ nullable: true })
    .custom((val, { req }) => {
      if (!val) return true;
      if (isNaN(Date.parse(val))) {
        throw new Error("endDate must be a valid ISO Date string.");
      }
      if (req.body.startDate && new Date(val) < new Date(req.body.startDate)) {
        throw new Error("endDate cannot be earlier than startDate.");
      }
      return true;
    }),
];

export const bannerIdParamValidator = [
  param("id")
    .trim()
    .isUUID()
    .withMessage("Invalid banner ID format (UUID expected)."),
];

export const bannerFilterQueryValidator = [
  query("type")
    .optional()
    .isIn(BANNER_TYPES)
    .withMessage(`Type filter must be one of: ${BANNER_TYPES.join(", ")}`),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive filter must be a boolean."),

  query("search")
    .optional()
    .trim()
    .isString(),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt(),
];
