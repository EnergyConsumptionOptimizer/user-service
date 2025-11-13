import { type NextFunction, type Request, type Response } from "express";
import { AccessTokenPayload } from "@domain/AccessTokenPayload";
import { AuthService } from "@domain/ports/AuthService";
import { UserRole } from "@domain/UserRole";

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}

export const AuthenticationRequired = { error: "Authentication required" };
export const Forbidden = { error: "Forbidden: Insufficient permissions" };

export class AuthMiddleware {
  constructor(private readonly authService: AuthService) {}

  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Access token is required" });
        return;
      }

      const token = authHeader.split(" ")[1];

      const user = await this.authService.verify(token);

      if (!user) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }

      (req as AuthenticatedRequest).user = user; // Attach user
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  requireRole =
    (...roles: UserRole[]) =>
    (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        res.status(401).json(AuthenticationRequired);
        return;
      }

      if (!roles.includes(user.role)) {
        res.status(403).json(Forbidden);
        return;
      }

      next();
    };

  requireOwnershipOrAdmin = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const user = (req as AuthenticatedRequest).user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json(AuthenticationRequired);
      return;
    }

    if (user.role === UserRole.ADMIN || user.id.value == id) {
      next();
      return;
    }

    res.status(403).json(Forbidden);
  };
}
