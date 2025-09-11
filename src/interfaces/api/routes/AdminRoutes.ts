import { Router } from "express";
import { UserRole } from "../../../domain/UserRole";
import { authMiddleware, userController } from "../dependencies";

const adminRouter = Router();

adminRouter.post(
  "/reset-password",
  authMiddleware.authenticate,
  authMiddleware.requireRole(UserRole.ADMIN),
  userController.resetAdminPassword,
);

export default adminRouter;
