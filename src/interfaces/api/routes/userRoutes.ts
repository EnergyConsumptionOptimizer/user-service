import { Router } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { UserController } from "../controllers/UserController";

export function userRoutes(
  authMiddleware: AuthMiddleware,
  userController: UserController,
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
