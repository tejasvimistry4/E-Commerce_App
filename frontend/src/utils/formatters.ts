import { APP_CONFIG } from "../config/constants";

export const formatPrice = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return `${APP_CONFIG.CURRENCY_SYMBOL}0.00`;
  const num = Number(amount);
  if (isNaN(num)) return `${APP_CONFIG.CURRENCY_SYMBOL}0.00`;
  return `${APP_CONFIG.CURRENCY_SYMBOL}${num.toFixed(2)}`;
};

export const calculateDiscountPercentage = (
  originalPrice: number,
  salePrice: number
): number | null => {
  if (originalPrice <= salePrice || originalPrice <= 0) return null;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
