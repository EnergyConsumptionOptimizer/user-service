import express from "express";
import userRoutes from "./UserRoutes";

import householdUserRouter from "./HouseholdUserRoutes";
import { AuthRouter } from "./AuthRouter";
import {
  authController,
  authMiddleware,
  userController,
} from "../dependencies";
import { AdminRouter } from "./AdminRouter";

const router = express.Router();

router.use("/api/auth", AuthRouter(authController, authMiddleware));

router.use("/api/users", userRoutes);

router.use("/api/admin", AdminRouter(userController, authMiddleware));

router.use("/api/household-users", householdUserRouter);

export default router;
