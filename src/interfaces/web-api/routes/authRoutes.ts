import { Router } from "express";
import { AuthController } from "@interfaces/web-api/controllers/AuthController";
import { AuthMiddleware } from "@interfaces/web-api/middleware/AuthMiddleware";

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
