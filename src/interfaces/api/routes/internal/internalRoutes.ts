import { Router } from "express";
import { AuthController } from "../../controllers/AuthController";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
import { authRoutes } from "../authRoutes";

export function internalRoutes(
  authController: AuthController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.use(
    "/api-internal/verification",
    authRoutes(authController, authMiddleware),
  );

  return router;
}
