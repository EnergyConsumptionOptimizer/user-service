import express from "express";
import { authController } from "../dependencies";

const authRouter = express.Router();

authRouter.post("/login", authController.login);

export default authRouter;
