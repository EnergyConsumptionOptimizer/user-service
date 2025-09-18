import { Router } from "express";
import { AuthController } from "../../controllers/AuthController";
import { AuthMiddleware } from "../../middleware/AuthMiddleware";
import { verificationRoutes } from "./verificationRoutes";

export function internalRoutes(
  authController: AuthController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.use("/auth", verificationRoutes(authController, authMiddleware));

  return router;
}
