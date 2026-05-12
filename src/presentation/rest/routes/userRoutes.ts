import { UserRoles } from "@domain/value/UserRole";
import type { UserController } from "@presentation/rest/controllers/UserController";
import {
	forwardAuth,
	requireOwnershipOrAdmin,
	requireRole,
} from "@presentation/rest/middleware/auth";
import { validate } from "@presentation/rest/middleware/validate";
import {
	CreateUserSchema,
	UpdatePasswordSchema,
	UpdateUsernameSchema,
	UserIdParamSchema,
} from "@presentation/rest/schemas/user";
import { Router } from "express";

export function userRoutes(userController: UserController): Router {
	const router = Router();

	router.use(forwardAuth);

	router
		.route("/")
		.get(requireRole(UserRoles.ADMIN), (req, res) =>
			userController.getHouseholdUsers(req, res),
		)
		.post(
			requireRole(UserRoles.ADMIN),
			validate(CreateUserSchema),
			(req, res) => userController.createHouseholdUser(req, res),
		);

	router
		.route("/:id")
		.get(validate(UserIdParamSchema), (req, res) =>
			userController.getUser(req, res),
		)
		.delete(requireRole(UserRoles.ADMIN), (req, res) =>
			userController.deleteHouseholdUser(req, res),
		);

	router.patch(
		"/:id/username",
		requireOwnershipOrAdmin,
		validate(UpdateUsernameSchema),
		(req, res) => userController.updateUsername(req, res),
	);

	router.patch(
		"/:id/password",
		requireOwnershipOrAdmin,
		validate(UpdatePasswordSchema),
		(req, res) => userController.updatePassword(req, res),
	);

	return router;
}
