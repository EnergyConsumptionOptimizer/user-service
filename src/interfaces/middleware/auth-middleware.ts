import { type NextFunction, type Request, type Response } from "express";
import { AccessTokenPayload } from "../../domain/AccessTokenPayload";
import { JWTService } from "../../application/JWTService";
import { UserRole } from "../../domain/UserRole";

declare module "express-serve-static-core" {
  interface Request {
    user?: AccessTokenPayload;
  }
}

const tokenService = new JWTService();

export const authenticateToken = async (
  request: Request,
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
    request.user = await tokenService.verifyToken(token);
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid or expired token" });
  }
};

export const authorizeRole = (...requiredRoles: UserRole[]) => {
  return (request: Request, res: Response, next: NextFunction) => {
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
