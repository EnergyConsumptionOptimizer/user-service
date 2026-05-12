import { UserNotFoundError } from "@application/errors";
import type {
	UserOutput,
	UserService,
} from "@application/ports/in/UserService";
import {
	InvalidPasswordError,
	InvalidUsernameError,
	UsernameAlreadyExistsError,
} from "@domain/errors";
import { UserController } from "@presentation/rest/controllers/UserController";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type MockProxy, mock } from "vitest-mock-extended";

function mockRequest(overrides?: Partial<Request>): Request {
	return {
		params: {},
		body: {},
		cookies: {},
		secure: false,
		...overrides,
	} as Request;
}

function mockResponse(): Response {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		sendStatus: vi.fn().mockReturnThis(),
		cookie: vi.fn().mockReturnThis(),
		clearCookie: vi.fn().mockReturnThis(),
		setHeader: vi.fn().mockReturnThis(),
		locals: {} as Record<string, unknown>,
		headersSent: false,
	};
	return res as unknown as Response;
}

const USER_OUTPUT: UserOutput = {
	id: "user-1",
	username: "testuser",
	role: "HOUSEHOLD",
};

describe("UserController", () => {
	let userService: MockProxy<UserService>;
	let controller: UserController;

	beforeEach(() => {
		userService = mock<UserService>();
		controller = new UserController(userService);
	});

	describe("getHouseholdUsers()", () => {
		it("should return list of household users with status 200", async () => {
			const users: UserOutput[] = [
				{ id: "id-1", username: "alice", role: "HOUSEHOLD" },
				{ id: "id-2", username: "bob", role: "HOUSEHOLD" },
			];
			userService.getHouseholdUsers.mockResolvedValue(users);
			const req = mockRequest();
			const res = mockResponse();

			await controller.getHouseholdUsers(req, res);

			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(users);
		});
	});

	describe("getUser()", () => {
		it("should return user with status 200 when found", async () => {
			userService.getUser.mockResolvedValue(USER_OUTPUT);
			const req = mockRequest({ params: { id: "user-1" } });
			const res = mockResponse();

			await controller.getUser(req, res);

			expect(userService.getUser).toHaveBeenCalledWith({ id: "user-1" });
			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(USER_OUTPUT);
		});

		it("should throw UserNotFoundError when user is not found", async () => {
			const error = new UserNotFoundError();
			userService.getUser.mockResolvedValue(error);
			const req = mockRequest({ params: { id: "unknown-id" } });
			const res = mockResponse();

			await expect(controller.getUser(req, res)).rejects.toThrow(
				UserNotFoundError,
			);
			expect(userService.getUser).toHaveBeenCalledWith({ id: "unknown-id" });
		});
	});

	describe("createHouseholdUser()", () => {
		it("should create user and return status 201", async () => {
			userService.createHouseholdUser.mockResolvedValue(USER_OUTPUT);
			const req = mockRequest({
				body: { username: "testuser", password: "secret" },
			});
			const res = mockResponse();

			await controller.createHouseholdUser(req, res);

			expect(userService.createHouseholdUser).toHaveBeenCalledWith({
				username: "testuser",
				password: "secret",
			});
			expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
			expect(res.json).toHaveBeenCalledWith(USER_OUTPUT);
		});

		it("should throw InvalidUsernameError when username is invalid", async () => {
			const error = new InvalidUsernameError(
				"USERNAME_EMPTY",
				"Username cannot be empty",
			);
			userService.createHouseholdUser.mockResolvedValue(error);
			const req = mockRequest({ body: { username: "", password: "secret" } });
			const res = mockResponse();

			await expect(controller.createHouseholdUser(req, res)).rejects.toThrow(
				InvalidUsernameError,
			);
		});

		it("should throw UsernameAlreadyExistsError when username is taken", async () => {
			const error = new UsernameAlreadyExistsError();
			userService.createHouseholdUser.mockResolvedValue(error);
			const req = mockRequest({
				body: { username: "taken", password: "secret" },
			});
			const res = mockResponse();

			await expect(controller.createHouseholdUser(req, res)).rejects.toThrow(
				UsernameAlreadyExistsError,
			);
		});
	});

	describe("updateUsername()", () => {
		it("should update username and return status 200", async () => {
			const updated: UserOutput = {
				id: "user-1",
				username: "newname",
				role: "HOUSEHOLD",
			};
			userService.updateUsername.mockResolvedValue(updated);
			const req = mockRequest({
				params: { id: "user-1" },
				body: { username: "newname" },
			});
			const res = mockResponse();

			await controller.updateUsername(req, res);

			expect(userService.updateUsername).toHaveBeenCalledWith({
				id: "user-1",
				newUsername: "newname",
			});
			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(updated);
		});

		it("should throw UserNotFoundError when user does not exist", async () => {
			const error = new UserNotFoundError();
			userService.updateUsername.mockResolvedValue(error);
			const req = mockRequest({
				params: { id: "unknown-id" },
				body: { username: "newname" },
			});
			const res = mockResponse();

			await expect(controller.updateUsername(req, res)).rejects.toThrow(
				UserNotFoundError,
			);
		});
	});

	describe("updatePassword()", () => {
		it("should update password and return status 200", async () => {
			userService.changePassword.mockResolvedValue(USER_OUTPUT);
			const req = mockRequest({
				params: { id: "user-1" },
				body: { password: "newpassword" },
			});
			const res = mockResponse();

			await controller.updatePassword(req, res);

			expect(userService.changePassword).toHaveBeenCalledWith({
				id: "user-1",
				newPassword: "newpassword",
			});
			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(USER_OUTPUT);
		});

		it("should throw InvalidPasswordError when password is invalid", async () => {
			const error = new InvalidPasswordError(
				"PASSWORD_EMPTY",
				"Password cannot be empty",
			);
			userService.changePassword.mockResolvedValue(error);
			const req = mockRequest({
				params: { id: "user-1" },
				body: { password: "" },
			});
			const res = mockResponse();

			await expect(controller.updatePassword(req, res)).rejects.toThrow(
				InvalidPasswordError,
			);
		});
	});

	describe("deleteHouseholdUser()", () => {
		it("should delete user and return status 204", async () => {
			userService.deleteHouseholdUser.mockResolvedValue(undefined);
			const req = mockRequest({ params: { id: "user-1" } });
			const res = mockResponse();

			await controller.deleteHouseholdUser(req, res);

			expect(userService.deleteHouseholdUser).toHaveBeenCalledWith({
				id: "user-1",
			});
			expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
		});

		it("should throw UserNotFoundError when user does not exist", async () => {
			const error = new UserNotFoundError();
			userService.deleteHouseholdUser.mockResolvedValue(error);
			const req = mockRequest({ params: { id: "unknown-id" } });
			const res = mockResponse();

			await expect(controller.deleteHouseholdUser(req, res)).rejects.toThrow(
				UserNotFoundError,
			);
		});
	});

	describe("resetAdminPassword()", () => {
		it("should reset admin password and return status 204", async () => {
			userService.resetAdminPassword.mockResolvedValue(undefined);
			const req = mockRequest({
				body: { resetCode: "valid-code", password: "newpassword" },
			});
			const res = mockResponse();

			await controller.resetAdminPassword(req, res);

			expect(userService.resetAdminPassword).toHaveBeenCalledWith({
				resetCode: "valid-code",
				newPassword: "newpassword",
			});
			expect(res.sendStatus).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
		});

		it("should throw error when reset code is invalid", async () => {
			const error = new UserNotFoundError();
			userService.resetAdminPassword.mockResolvedValue(error);
			const req = mockRequest({
				body: { resetCode: "wrong-code", password: "newpassword" },
			});
			const res = mockResponse();

			await expect(controller.resetAdminPassword(req, res)).rejects.toThrow(
				UserNotFoundError,
			);
		});
	});

	describe("getUserByUsername()", () => {
		it("should return user when found", async () => {
			userService.getUserByUsername.mockResolvedValue(USER_OUTPUT);
			const req = mockRequest({ params: { username: "testuser" } });
			const res = mockResponse();

			await controller.getUserByUsername(req, res);

			expect(userService.getUserByUsername).toHaveBeenCalledWith({
				username: "testuser",
			});
			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(USER_OUTPUT);
		});

		it("should throw UserNotFoundError when user is not found", async () => {
			const error = new UserNotFoundError();
			userService.getUserByUsername.mockResolvedValue(error);
			const req = mockRequest({ params: { username: "unknown" } });
			const res = mockResponse();

			await expect(controller.getUserByUsername(req, res)).rejects.toThrow(
				UserNotFoundError,
			);
		});
	});
});
