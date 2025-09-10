import express from "express";
import userRoutes from "./UserRoutes";
import authRoutes from "./AuthRoutes";

const router = express.Router();

router.use("/auth", authRoutes);

router.use("/users", userRoutes);

export default router;
