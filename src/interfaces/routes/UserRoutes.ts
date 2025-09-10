import express from "express";
import { UserRole } from "../../domain/UserRole";
import { authMiddleware, userController } from "../dependencies";

const userRouter = express.Router();

// User management
userRouter.post(
  "/change-password",
  authMiddleware.authenticateToken,
  authMiddleware.authorizeRole(UserRole.HOUSEHOLD),
  userController.changePassword,
);
userRouter.post(
  "/change-username",
  authMiddleware.authenticateToken,
  authMiddleware.authorizeRole(UserRole.HOUSEHOLD),
  userController.changeUsername,
);

userRouter.post(
  "/register",
  authMiddleware.authenticateToken,
  authMiddleware.authorizeRole(UserRole.ADMIN),
  userController.createHouseholdUser,
);

userRouter.delete(
  "/:username",
  authMiddleware.authenticateToken,
  authMiddleware.authorizeRole(UserRole.ADMIN),
  userController.deleteUser,
);

userRouter.post(
  "/reset-password",
  authMiddleware.authenticateToken,
  authMiddleware.authorizeRole(UserRole.ADMIN),
  userController.resetAdminPassword,
);

userRouter.get(
  "/test",
  // AuthenticateToken,
  authMiddleware.authorizeRole(UserRole.ADMIN, UserRole.HOUSEHOLD),
  userController.test,
);

export default userRouter;
