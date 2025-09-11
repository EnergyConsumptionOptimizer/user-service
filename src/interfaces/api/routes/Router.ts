import express from "express";
import userRoutes from "./UserRoutes";
import authRoutes from "./AuthRoutes";
import adminRouter from "./AdminRoutes";
import householdUserRouter from "./HouseholdUserRoutes";

const router = express.Router();

router.use("/auth", authRoutes);

router.use("/users", userRoutes);

router.use("/admin", adminRouter);

router.use("/household-user", householdUserRouter);

export default router;
