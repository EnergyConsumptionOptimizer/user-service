import type { AuthController } from "@presentation/rest/controllers/AuthController";
import type { UserController } from "@presentation/rest/controllers/UserController";
import type { createTokenAuth } from "@presentation/rest/middleware/auth";
import { validate } from "@presentation/rest/middleware/validate";
import { authRoutes } from "@presentation/rest/routes/authRoutes";
import { internalAuthRoutes } from "@presentation/rest/routes/internalAuthRoutes";
import { internalUserRoutes } from "@presentation/rest/routes/internalUserRoutes";
import { userRoutes } from "@presentation/rest/routes/userRoutes";
import { ResetAdminPasswordSchema } from "@presentation/rest/schemas/user";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

export function createMainRouter(
	userController: UserController,
	authController: AuthController,
	tokenAuth: ReturnType<typeof createTokenAuth>,
): Router {
	const router = Router();

	router.get("/health", (_req, res) => {
		res.status(StatusCodes.OK).json({
			status: "ok",
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
		});
	});

	router.use("/api/auth", authRoutes(authController));
	router.use("/api/users", userRoutes(userController));

	router.post(
		"/api/admin/reset-password",
		validate(ResetAdminPasswordSchema),
		(req, res) => userController.resetAdminPassword(req, res),
	);

	router.use(
		"/api/internal/auth",
		internalAuthRoutes(authController, tokenAuth),
	);
	router.use("/api/internal/users", internalUserRoutes(userController));

	return router;
}
