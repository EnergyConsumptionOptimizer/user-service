import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { AuthMiddleware } from "@interfaces/web-api/middleware/AuthMiddleware";
import { UserRole } from "@domain/UserRole";

export function adminRoutes(
  userController: UserController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.post(
    "/reset-password",
    authMiddleware.authenticate,
    authMiddleware.requireRole(UserRole.ADMIN),
    userController.resetAdminPassword,
  );

  return router;
}
