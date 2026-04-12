export type AppErrorCode =
  | "INVALID_REQUEST"
  | "MODEL_UNREACHABLE"
  | "MODEL_NOT_FOUND"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

