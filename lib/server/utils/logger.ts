export type Logger = {
  info: (message: string, meta?: unknown) => void;
  warn: (message: string, meta?: unknown) => void;
  error: (message: string, meta?: unknown) => void;
};

export function createLogger(scope: string): Logger {
  return {
    info(message, meta) {
      console.info(`[${scope}] ${message}`, meta ?? "");
    },
    warn(message, meta) {
      console.warn(`[${scope}] ${message}`, meta ?? "");
    },
    error(message, meta) {
      console.error(`[${scope}] ${message}`, meta ?? "");
    },
  };
}

