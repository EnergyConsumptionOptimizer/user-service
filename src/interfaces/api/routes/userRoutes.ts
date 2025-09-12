import { Router } from "express";

import { UserRole } from "../../../domain/UserRole";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { UserController } from "../controllers/UserController";

export function userRoutes(
  authMiddleware: AuthMiddleware,
  userController: UserController,
): Router {
  const router = Router();

  router.get(
    "/:id",
    authMiddleware.authenticate,
    authMiddleware.requireRole(UserRole.ADMIN),
    userController.getUser,
  );

  router.put(
    "/:id/password",
    authMiddleware.authenticate,
    authMiddleware.requireOwnershipOrAdmin,
    userController.updatePassword,
  );

  return router;
}
