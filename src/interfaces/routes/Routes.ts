import express from "express";
import adminRoutes from "./AuthRoutes";
import userRoutes from "./UserRoutes";

const router = express.Router();

router.use("/admin", adminRoutes);

router.use("/users", userRoutes);

export default router;
