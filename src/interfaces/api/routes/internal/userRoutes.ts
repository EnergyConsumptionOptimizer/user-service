import { Router } from "express";
import { UserController } from "../../controllers/UserController";

export function userRoutes(userController: UserController): Router {
  const router = Router();

  router.get("/:username", userController.getUserFromUsername);

  return router;
}
