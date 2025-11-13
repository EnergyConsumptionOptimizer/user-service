import { Router } from "express";

import { healthCheck } from "./healthCheck";

export function router(): Router {
  const router = Router();

  router.get("/health", healthCheck);

  return router;
}
