import { Router } from "express";
import { AuthController } from "../../controllers/AuthController";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
import { verificationRoutes } from "./verificationRoutes";
import { userRoutes } from "./userRoutes";
import { UserController } from "../../controllers/UserController";

export function internalRoutes(
  authController: AuthController,
  authMiddleware: AuthMiddleware,
  userController: UserController,
): Router {
  const router = Router();

  router.use("/auth", verificationRoutes(authController, authMiddleware));
  router.use("/users", userRoutes(userController));

  return router;
}
