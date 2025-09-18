import { Router } from "express";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
import { AuthController } from "../../controllers/AuthController";
import { UserRole } from "../../../../domain/UserRole";

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
