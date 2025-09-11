import { Router } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { AuthController } from "../controllers/AuthController";

export function AuthRouter(
  authController: AuthController,
  authMiddleware: AuthMiddleware,
): Router {
  const authRouter = Router();

  authRouter.post("/login", authController.login);

  authRouter.post(
    "/logout",
    authMiddleware.authenticate,
    authController.logout,
  );

  authRouter.post(
    "/refresh",
    authMiddleware.authenticate,
    authController.refresh,
  );

  return authRouter;
}
