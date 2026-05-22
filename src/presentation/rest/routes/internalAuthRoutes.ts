import type { AuthController } from "@presentation/rest/controllers/AuthController";
import type { AppLocals } from "@presentation/rest/middleware/auth";
import { type Response, Router } from "express";

export function internalAuthRoutes(authController: AuthController): Router {
	const router = Router();

	router.get("/verify", (req, res: Response<unknown, AppLocals>) =>
		authController.verify(req, res),
	);

	return router;
}
