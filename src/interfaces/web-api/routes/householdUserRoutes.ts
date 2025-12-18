import { Router } from "express";

import { UserController } from "../controllers/UserController";
import { AuthMiddleware } from "@interfaces/web-api/middleware/AuthMiddleware";
import { UserRole } from "@domain/UserRole";

export function householdUserRoutes(
  userController: UserController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router
    .route("/")
    .get(authMiddleware.authenticate, userController.getHouseholdUsers)
    .post(
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
