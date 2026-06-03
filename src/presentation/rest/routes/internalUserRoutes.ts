import type { UserController } from "@presentation/rest/controllers/UserController";
import { validate } from "@presentation/rest/middleware/validate";
import { GetUserByUsernameSchema } from "@presentation/rest/schemas/user";
import { Router } from "express";

export function internalUserRoutes(userController: UserController): Router {
	const router = Router();

	router.get("/", (req, res) => userController.getHouseholdUsers(req, res));

	router.get("/:username", validate(GetUserByUsernameSchema), (req, res) =>
		userController.getUserByUsername(req, res),
	);

	return router;
}
