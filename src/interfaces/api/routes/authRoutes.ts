import { Router } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { AuthController } from "../controllers/AuthController";

export function authRoutes(
  authController: AuthController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.post("/login", authController.login);

  router.post("/logout", authMiddleware.authenticate, authController.logout);

  router.post("/refresh", authController.refresh);

  return router;
}
