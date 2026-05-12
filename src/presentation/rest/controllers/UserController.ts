import type { UserService } from "@application/ports/in/UserService";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export class UserController {
	readonly #userService: UserService;

	constructor(userService: UserService) {
		this.#userService = userService;
	}

	async getHouseholdUsers(_req: Request, res: Response) {
		const users = await this.#userService.getHouseholdUsers();
		res.status(StatusCodes.OK).json(users);
	}

	async getUser(req: Request, res: Response) {
		const user = await this.#userService.getUser({ id: req.params.id });
		if (user instanceof Error) throw user;
		res.status(StatusCodes.OK).json(user);
	}

	async createHouseholdUser(req: Request, res: Response) {
		const { username, password } = req.body;
		const user = await this.#userService.createHouseholdUser({
			username,
			password,
		});
		if (user instanceof Error) throw user;
		res.status(StatusCodes.CREATED).json(user);
	}

	async updateUsername(req: Request, res: Response) {
		const updated = await this.#userService.updateUsername({
			id: req.params.id,
			newUsername: req.body.username,
		});
		if (updated instanceof Error) throw updated;
		res.status(StatusCodes.OK).json(updated);
	}

	async updatePassword(req: Request, res: Response) {
		const user = await this.#userService.changePassword({
			id: req.params.id,
			newPassword: req.body.password,
		});
		if (user instanceof Error) throw user;
		res.status(StatusCodes.OK).json(user);
	}

	async deleteHouseholdUser(req: Request, res: Response) {
		const result = await this.#userService.deleteHouseholdUser({
			id: req.params.id,
		});
		if (result instanceof Error) throw result;
		res.sendStatus(StatusCodes.NO_CONTENT);
	}

	async resetAdminPassword(req: Request, res: Response) {
		const { resetCode, password } = req.body;
		const result = await this.#userService.resetAdminPassword({
			resetCode,
			newPassword: password,
		});
		if (result instanceof Error) throw result;
		res.sendStatus(StatusCodes.NO_CONTENT);
	}

	async getUserByUsername(req: Request, res: Response) {
		const { username } = req.params;
		const user = await this.#userService.getUserByUsername({ username });
		if (user instanceof Error) throw user;
		res.status(StatusCodes.OK).json(user);
	}
}
