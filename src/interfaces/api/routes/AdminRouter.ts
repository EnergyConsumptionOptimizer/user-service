import { Router } from "express";
import { UserRole } from "../../../domain/UserRole";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { UserController } from "../controllers/UserController";

export function AdminRouter(
  userController: UserController,
  authMiddleware: AuthMiddleware,
): Router {
  const adminRouter = Router();

  adminRouter.post(
    "/reset-password",
    authMiddleware.authenticate,
    authMiddleware.requireRole(UserRole.ADMIN),
    userController.resetAdminPassword,
  );

  return adminRouter;
}
