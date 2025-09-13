import { Router } from "express";

import { UserRole } from "../../../domain/UserRole";

import { UserController } from "../controllers/UserController";
import { AuthMiddleware } from "../middleware/AuthMiddleware";

export function householdUserRoutes(
  authMiddleware: AuthMiddleware,
  userController: UserController,
): Router {
  const router = Router();

  router.get(
    "/",
    authMiddleware.authenticate,
    authMiddleware.requireRole(UserRole.ADMIN),
    userController.getHouseholdUsers,
  );

  router.post(
    "/",
    authMiddleware.authenticate,
    authMiddleware.requireRole(UserRole.ADMIN),
    userController.createHouseholdUser,
  );

  router.patch(
    "/:id/username",
    authMiddleware.authenticate,
    authMiddleware.requireOwnershipOrAdmin,
    userController.updateUsername,
  );

  router.delete(
    "/:id",
    authMiddleware.authenticate,
    authMiddleware.requireRole(UserRole.ADMIN),
    userController.deleteHouseholdUser,
  );

  return router;
}
