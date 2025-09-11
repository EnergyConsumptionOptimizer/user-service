import express from "express";

import { AuthRouter } from "./AuthRouter";
import { UserRouter } from "./UserRouter";
import { AdminRouter } from "./AdminRouter";
import { HouseholdUserRouter } from "./HouseholdUserRouter";
import { authMiddleware, authController, userController } from "../dependencies";
const router = express.Router();

router.use("/api/auth", AuthRouter(authController, authMiddleware));

router.use("/api/users", UserRouter(authMiddleware, userController));

router.use("/api/admin", AdminRouter(userController, authMiddleware));

router.use(
  "/api/household-users",
  HouseholdUserRouter(authMiddleware, userController),
);

export default router;
