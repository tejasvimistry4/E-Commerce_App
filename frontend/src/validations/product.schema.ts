import { CreateProductPayload } from "../types/product";
import { ValidationResult } from "./auth.schema";

export const validateProduct = (data: Partial<CreateProductPayload>): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.name || !data.name.trim()) {
    errors.name = "Product name is required";
  } else if (data.name.trim().length < 2) {
    errors.name = "Product name must be at least 2 characters long";
  }

  if (data.price === undefined || data.price === null || isNaN(Number(data.price))) {
    errors.price = "Valid product price is required";
  } else if (Number(data.price) < 0) {
    errors.price = "Price cannot be negative";
  }

  if (data.comparePrice !== undefined && data.comparePrice !== null) {
    if (isNaN(Number(data.comparePrice)) || Number(data.comparePrice) < 0) {
      errors.comparePrice = "Compare price must be a positive number";
    }
  }

  if (!data.categoryId) {
    errors.categoryId = "Category selection is required";
  }

  if (data.stock !== undefined && data.stock !== null) {
    if (isNaN(Number(data.stock)) || Number(data.stock) < 0) {
      errors.stock = "Stock quantity must be zero or a positive integer";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
