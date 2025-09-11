import express from "express";
import { authController, authMiddleware } from "../dependencies";

const authRouter = express.Router();

authRouter.post("/login", authController.login);

authRouter.post("/logout", authMiddleware.authenticate, authController.logout);

authRouter.post(
  "/refresh",
  authMiddleware.authenticate,
  authController.refresh,
);

export default authRouter;
