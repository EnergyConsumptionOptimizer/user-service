import express from "express";
import userRoutes from "./UserRoutes";
import authRoutes from "./AuthRoutes";
import adminRouter from "./AdminRoutes";
import householdUserRouter from "./HouseholdUserRoutes";

const router = express.Router();

router.use("/api/auth", authRoutes);

router.use("/api/users", userRoutes);

router.use("/api/admin", adminRouter);

router.use("/api/household-users", householdUserRouter);

export default router;
