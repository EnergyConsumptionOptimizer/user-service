import { Router } from "express";

import { healthCheck } from "./healthCheck";
import { adminRoutes } from "@interfaces/web-api/routes/adminRoutes";
import { UserController } from "@interfaces/web-api/controllers/UserController";
import { householdUserRoutes } from "@interfaces/web-api/routes/householdUserRoutes";
import { userRoutes } from "@interfaces/web-api/routes/userRoutes";

export function router(userController: UserController): Router {
  const router = Router();

  router.get("/health", healthCheck);

  router.use("/api/admin", adminRoutes(userController));

  router.use("/api/users", userRoutes(userController));

  router.use("/api/household-users", householdUserRoutes(userController));
  return router;
}
