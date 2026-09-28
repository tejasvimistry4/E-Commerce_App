export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  GUEST_CART: "guest_cart",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
