import { STORAGE_KEYS } from "../constants/storageKeys";
import { AuthUser } from "../types/auth";
import { CartItem } from "../types/cart";

export const getItem = <T>(key: string, fallback: T | null = null): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const setItem = <T>(key: string, value: T): void => {
  try {
    if (typeof value === "string") {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
};

export const removeItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
};

export const clearStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};

// ==========================================
// Specialized Auth Storage Helpers
// ==========================================

export const getToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

export const setToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
};

export const getUser = (): AuthUser | null => {
  return getItem<AuthUser>(STORAGE_KEYS.USER);
};

export const setUser = (user: AuthUser): void => {
  setItem<AuthUser>(STORAGE_KEYS.USER, user);
};

export const removeUser = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

export const clearAuthStorage = (): void => {
  removeToken();
  removeUser();
};

// ==========================================
// Specialized Guest Cart Storage Helpers
// ==========================================

export const getGuestCart = (): CartItem[] => {
  return getItem<CartItem[]>(STORAGE_KEYS.GUEST_CART, []) || [];
};

export const setGuestCart = (items: CartItem[]): void => {
  setItem<CartItem[]>(STORAGE_KEYS.GUEST_CART, items);
};

export const clearGuestCart = (): void => {
  removeItem(STORAGE_KEYS.GUEST_CART);
};
