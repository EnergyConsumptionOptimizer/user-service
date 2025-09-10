import express from "express";
import { UserRole } from "../../domain/UserRole";
import { authMiddleware, userController } from "../dependencies";

const userRouter = express.Router();

// User management
userRouter.post(
  "/change-password",
  authMiddleware.authenticate,
  authMiddleware.requireRole(UserRole.HOUSEHOLD),
  userController.updatePassword,
);
userRouter.post(
  "/change-username",
  authMiddleware.authenticate,
  authMiddleware.requireRole(UserRole.HOUSEHOLD),
  userController.updateUsername,
);

userRouter.post(
  "/create-household",
  authMiddleware.authenticate,
  authMiddleware.requireRole(UserRole.ADMIN),
  userController.createHouseholdUser,
);

userRouter.get(
  "/:id",
  authMiddleware.authenticate,
  authMiddleware.requireRole(UserRole.ADMIN),
  userController.getUser,
);

userRouter.get(
  "/household-users",
  authMiddleware.authenticate,
  authMiddleware.requireRole(UserRole.ADMIN),
  userController.getHouseholdUsers,
);

userRouter.delete(
  "/:id",
  authMiddleware.authenticate,
  authMiddleware.requireRole(UserRole.ADMIN),
  userController.deleteUser,
);

userRouter.post(
  "/reset-password",
  authMiddleware.authenticate,
  authMiddleware.requireRole(UserRole.ADMIN),
  userController.resetAdminPassword,
);

userRouter.get(
  "/test",
  // AuthenticateToken,
  authMiddleware.requireRole(UserRole.ADMIN, UserRole.HOUSEHOLD),
  userController.test,
);

export default userRouter;
