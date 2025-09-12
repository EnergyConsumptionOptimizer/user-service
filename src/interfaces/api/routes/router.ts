import { Router } from "express";

import { AuthController } from "../controllers/AuthController";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { UserController } from "../controllers/UserController";
import { authRoutes } from "./authRoutes";
import { userRoutes } from "./userRoutes";
import { adminRoutes } from "./adminRoutes";
import { householdUserRoutes } from "./householdUserRoutes";

export function router(
  authController: AuthController,
  authMiddleware: AuthMiddleware,
  userController: UserController,
): Router {
  const router = Router();

  router.use("/api/auth", authRoutes(authController, authMiddleware));

  router.use("/api/users", userRoutes(authMiddleware, userController));

  router.use("/api/admin", adminRoutes(userController, authMiddleware));

  router.use(
    "/api/household-users",
    householdUserRoutes(authMiddleware, userController),
  );
  return router;
}
