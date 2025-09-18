import { Router } from "express";
import { AuthController } from "../../controllers/AuthController";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
import { authRoutes } from "../authRoutes";

export function internalRouter(
  authController: AuthController,
  authMiddleware: AuthMiddleware,
): Router {
  const internalRouter = Router();

  internalRouter.use(
    "/api-internal/verification",
    authRoutes(authController, authMiddleware),
  );

  return internalRouter;
}
