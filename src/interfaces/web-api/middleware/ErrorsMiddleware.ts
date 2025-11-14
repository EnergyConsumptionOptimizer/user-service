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

export const errorsHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction, // <-- Add this parameter
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Invalid request payload",
      code: "VALIDATION_ERROR",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      })),
    });
  }

  if (error instanceof AuthRequiredError) {
    return res.status(401).json({ error: error.message });
  }

  if (error instanceof InvalidAccessTokenError) {
    return res.status(401).json({ error: error.message });
  }

  if (error instanceof ForbiddenError) {
    return res.status(403).json({ error: error.message });
  }

  if (error instanceof UsernameConflictError) {
    return res.status(409).json({ error: error.message });
  }

  if (error instanceof UserNotFoundError) {
    return res.status(404).json({ error: error.message });
  }

  if (
    error instanceof InvalidIDError ||
    error instanceof InvalidResetCodeError
  ) {
    return res.status(400).json({ error: error.message });
  }

  if (
    error instanceof InvalidCredentialsError ||
    error instanceof InvalidRefreshTokenError
  ) {
    return res.status(401).json({ error: error.message });
  }

  console.error("Unhandled error:", error);
  return res.status(500).json({ error: "Internal Server Error" });
};
