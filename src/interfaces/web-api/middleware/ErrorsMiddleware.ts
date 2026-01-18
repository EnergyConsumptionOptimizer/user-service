import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  UsernameConflictError,
  UserNotFoundError,
  InvalidIDError,
  InvalidResetCodeError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  AuthRequiredError,
  InvalidAccessTokenError,
  ForbiddenError,
} from "@domain/errors/errors";

interface ErrorConfig {
  status: number;
  code: string;
  field?: string;
}

const ERROR_MAP = new Map<string, ErrorConfig>([
  [
    UsernameConflictError.name,
    { status: 409, code: "CONFLICT", field: "username" },
  ],
  [UserNotFoundError.name, { status: 404, code: "RESOURCE_NOT_FOUND" }],
  [InvalidIDError.name, { status: 400, code: "BAD_REQUEST" }],
  [
    InvalidResetCodeError.name,
    { status: 400, code: "BAD_REQUEST", field: "resetCode" },
  ],
  [InvalidCredentialsError.name, { status: 401, code: "UNAUTHORIZED" }],
  [InvalidRefreshTokenError.name, { status: 401, code: "UNAUTHORIZED" }],
  [AuthRequiredError.name, { status: 401, code: "UNAUTHORIZED" }],
  [InvalidAccessTokenError.name, { status: 401, code: "UNAUTHORIZED" }],
  [ForbiddenError.name, { status: 403, code: "FORBIDDEN" }],
]);

export const errorsHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    error.issues.forEach((issue) => {
      fieldErrors[issue.path.join(".")] = issue.message;
    });
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Invalid request payload",
      errors: fieldErrors,
    });
  }

  const config = ERROR_MAP.get(error.name);

  if (config) {
    const errorsPayload = config.field ? { [config.field]: error.message } : {};

    return res.status(config.status).json({
      code: config.code,
      message: config.field ? "Validation failed" : error.message,
      errors: errorsPayload,
    });
  }

  console.error("Unhandled error:", error);

  return res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Internal Server Error",
    errors: {},
  });
};
