import { Router } from "express";
import { UserController } from "../controllers/UserController";

export function userRoutes(userController: UserController): Router {
  const router = Router();

  router.get("/:id", userController.getUser);

  router.patch("/:id/password", userController.updatePassword);

  return router;
}
