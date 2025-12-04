import { type NextFunction, type Request, type Response } from "express";
import { AuthService } from "@domain/ports/AuthService";
import { UserRole } from "@domain/UserRole";
import { AccessTokenPayload } from "@domain/AccessTokenPayload";
import {
  AuthRequiredError,
  ForbiddenError,
  InvalidAccessTokenError,
} from "@domain/errors/errors";

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}

export class AuthMiddleware {
  constructor(private readonly authService: AuthService) {}

  authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = req.cookies["authToken"];
      if (!token) {
        return next(new AuthRequiredError());
      }
      const user = await this.authService.verify(token);
      if (!user) return next(new InvalidAccessTokenError());
      (req as AuthenticatedRequest).user = user;
      next();
    } catch (error) {
      next(error);
    }
  };

  requireRole = (...roles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
      try {
        const user = (req as AuthenticatedRequest).user;
        if (!user) return next(new AuthRequiredError());
        if (!roles.includes(user.role)) return next(new ForbiddenError());
        next();
      } catch (error) {
        next(error);
      }
    };
  };

  requireOwnershipOrAdmin = (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { id } = req.params;
      if (!user) return next(new AuthRequiredError());
      const isOwner = user.id.value === id;
      const isAdmin = user.role === UserRole.ADMIN;
      if (!isOwner && !isAdmin) return next(new ForbiddenError());
      next();
    } catch (error) {
      next(error);
    }
  };
}
