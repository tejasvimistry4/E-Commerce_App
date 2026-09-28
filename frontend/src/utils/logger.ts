import { ENV } from "../config/env";

export const logger = {
  log: (...args: any[]) => {
    if (ENV.IS_DEV) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (ENV.IS_DEV) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
};
