import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((err) => ({
      field: err.type === "field" ? err.path : "field",
      message: err.msg,
    }));

    return res.status(422).json({
      success: false,
      message: errorDetails[0]?.message || "Validation failed",
      errors: errorDetails,
    });
  }

  next();
};
