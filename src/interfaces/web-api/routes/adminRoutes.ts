import { Router } from "express";
import { UserController } from "../controllers/UserController";

export function adminRoutes(userController: UserController): Router {
  const router = Router();

  router.post("/reset-password", userController.resetAdminPassword);

  return router;
}
