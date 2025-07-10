// Production-safe logging utility
const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    // Always log errors
    console.error(`[ERROR] ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};

// API logging helper
export const logApiCall = (
  endpoint: string,
  status: "start" | "success" | "error",
  details?: unknown
) => {
  if (status === "start") {
    logger.info(`API Call: ${endpoint}`);
  } else if (status === "success") {
    logger.info(`API Success: ${endpoint}`, details);
  } else {
    logger.error(`API Error: ${endpoint}`, details);
  }
};
