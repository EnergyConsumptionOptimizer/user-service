import { Router } from "express";

import { UserRole } from "../../../domain/UserRole";

import { authMiddleware, userController } from "../dependencies";

const userRouter = Router();

userRouter.get(
  "/:id",
  authMiddleware.authenticate,
  authMiddleware.requireRole(UserRole.ADMIN),
  userController.getUser,
);

userRouter.put(
  "/:id/password",
  authMiddleware.authenticate,
  authMiddleware.requireOwnershipOrAdmin,
  userController.updatePassword,
);

export default userRouter;
