import { type NextFunction, type Response, type Request } from "express";
import { AccessTokenPayload } from "../../domain/AccessTokenPayload";
import { JWTService } from "../../application/JWTService";
import { UserRole } from "../../domain/UserRole";

export interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

export class AuthMiddleware {
  private readonly tokenService: JWTService;

  constructor(tokenService: JWTService) {
    this.tokenService = tokenService;
  }

  public authenticateToken = async (
    request: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Access token is required" });
    }

    try {
      request.user = await this.tokenService.verifyToken(token);
      next();
    } catch {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid or expired token" });
    }
  };

  public authorizeRole = (...requiredRoles: UserRole[]) => {
    return (
      request: AuthenticatedRequest,
      res: Response,
      next: NextFunction,
    ) => {
      if (!request.user?.role || requiredRoles.length === 0) {
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient permissions" });
      }

      if (!requiredRoles.includes(request.user.role as UserRole)) {
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient permissions" });
      }

      next();
    };
  };
}
