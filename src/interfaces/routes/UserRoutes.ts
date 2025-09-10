import express from "express";
import { UserRole } from "../../domain/UserRole";
import { authMiddleware, userController } from "../dependencies";

const userRouter = express.Router();

// User management
userRouter.post(
  "/change-password",
  authMiddleware.authenticateToken,
  authMiddleware.authorizeRole(UserRole.HOUSEHOLD),
  userController.updatePassword,
);
userRouter.post(
  "/change-username",
  authMiddleware.authenticateToken,
  authMiddleware.authorizeRole(UserRole.HOUSEHOLD),
  userController.updateUsername,
);

userRouter.post(
  "/create-household",
  authMiddleware.authenticateToken,
  authMiddleware.authorizeRole(UserRole.ADMIN),
  userController.createHouseholdUser,
);

userRouter.get(
  "/:id",
  authMiddleware.authenticateToken,
  authMiddleware.authorizeRole(UserRole.ADMIN),
  userController.getUser,
);

userRouter.get(
  "/household-users",
  authMiddleware.authenticateToken,
  authMiddleware.authorizeRole(UserRole.ADMIN),
  userController.getHouseholdUsers,
);

userRouter.delete(
  "/:id",
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
