import { REGEX } from "../constants/regex";

export const isValidEmail = (email: string): boolean => {
  return REGEX.EMAIL.test(email.trim());
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const isValidSlug = (slug: string): boolean => {
  return REGEX.SLUG.test(slug.trim());
};

export const isValidPrice = (price: number | string): boolean => {
  const num = Number(price);
  return !isNaN(num) && num >= 0;
};
