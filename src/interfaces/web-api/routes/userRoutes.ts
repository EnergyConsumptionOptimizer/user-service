import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { AuthMiddleware } from "@interfaces/web-api/middleware/AuthMiddleware";

export function userRoutes(
  userController: UserController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.get("/:id", authMiddleware.authenticate, userController.getUser);

  router.patch(
    "/:id/password",
    authMiddleware.authenticate,
    authMiddleware.requireOwnershipOrAdmin,
    userController.updatePassword,
  );

  return router;
}
