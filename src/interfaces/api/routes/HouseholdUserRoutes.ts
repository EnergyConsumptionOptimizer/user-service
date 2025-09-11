import { Router } from "express";

import { UserRole } from "../../../domain/UserRole";
import { authMiddleware, userController } from "../dependencies";

const householdUserRouter = Router();

householdUserRouter.get(
  "/",
  authMiddleware.authenticate,
  authMiddleware.requireRole(UserRole.ADMIN),
  userController.getHouseholdUsers,
);

householdUserRouter.post(
  "/",
  authMiddleware.authenticate,
  authMiddleware.requireRole(UserRole.ADMIN),
  userController.createHouseholdUser,
);

householdUserRouter.put(
  "/:id/username",
  authMiddleware.authenticate,
  authMiddleware.requireOwnershipOrAdmin,
  userController.updateUsername,
);

householdUserRouter.delete("/:id", userController.deleteHouseholdUser);

export default householdUserRouter;
