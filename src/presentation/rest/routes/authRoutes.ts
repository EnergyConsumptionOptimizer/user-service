import type { AuthController } from "@presentation/rest/controllers/AuthController";
import { validate } from "@presentation/rest/middleware/validate";
import { LoginSchema } from "@presentation/rest/schemas/auth";
import { Router } from "express";

export function authRoutes(authController: AuthController): Router {
	const router = Router();

	router.post("/login", validate(LoginSchema), (req, res) =>
		authController.login(req, res),
	);

	router.post("/logout", (req, res) => authController.logout(req, res));

	router.post("/refresh", (req, res) => authController.refresh(req, res));

	return router;
}
