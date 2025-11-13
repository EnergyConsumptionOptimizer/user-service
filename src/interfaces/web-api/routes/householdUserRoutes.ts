import { Router } from "express";

import { UserController } from "../controllers/UserController";

export function householdUserRoutes(userController: UserController): Router {
  const router = Router();

  router.get("/", userController.getHouseholdUsers);

  router.post("/", userController.createHouseholdUser);

  router.patch("/:id/username", userController.updateUsername);

  router.delete("/:id", userController.deleteHouseholdUser);

  return router;
}
