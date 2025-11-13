import { Router } from "express";
import { UserRole } from "@domain/UserRole";
import { AuthController } from "@interfaces/web-api/controllers/AuthController";
import { AuthMiddleware } from "@interfaces/web-api/middleware/AuthMiddleware";

export function verificationRoutes(
  authController: AuthController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.get("/verify", authMiddleware.authenticate, authController.verify);

  router.get(
    "/verify-admin",
    authMiddleware.authenticate,
    authMiddleware.requireRole(UserRole.ADMIN),
    authController.verify,
  );

  return router;
}
