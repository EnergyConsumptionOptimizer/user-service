import type { AuthController } from "@presentation/rest/controllers/AuthController";
import type { createTokenAuth } from "@presentation/rest/middleware/auth";
import { Router } from "express";

export function internalAuthRoutes(
	authController: AuthController,
	tokenAuth: ReturnType<typeof createTokenAuth>,
): Router {
	const router = Router();

	router.get("/verify", tokenAuth, (req, res) =>
		authController.verify(req, res),
	);

	return router;
}
