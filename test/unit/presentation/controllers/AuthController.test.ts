import {
	InvalidCredentialsError,
	InvalidTokenError,
} from "@application/errors";
import type {
	AuthService,
	LoginResult,
} from "@application/ports/in/AuthService";
import { AuthRequiredError } from "@presentation/errors";
import { AuthController } from "@presentation/rest/controllers/AuthController";
import type { AppLocals } from "@presentation/rest/middleware/auth";
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
		locals: {} as AppLocals,
		headersSent: false,
	};
	return res as unknown as Response;
}

const LOGIN_RESULT: LoginResult = {
	accessToken: "access-token-xxx",
	refreshToken: "refresh-token-xxx",
	user: { id: "user-1", username: "testuser", role: "HOUSEHOLD" },
};

const REFRESH_RESULT: LoginResult = {
	accessToken: "new-access-token",
	refreshToken: "new-refresh-token",
	user: { id: "user-1", username: "testuser", role: "HOUSEHOLD" },
};

describe("AuthController", () => {
	let authService: MockProxy<AuthService>;
	let controller: AuthController;

	beforeEach(() => {
		authService = mock<AuthService>();
		controller = new AuthController(authService);
	});

	describe("login()", () => {
		it("should set auth cookies and return user with status 200", async () => {
			authService.login.mockResolvedValue(LOGIN_RESULT);
			const req = mockRequest({
				body: { username: "testuser", password: "secret" },
			});
			const res = mockResponse();

			await controller.login(req, res);

			expect(authService.login).toHaveBeenCalledWith({
				username: "testuser",
				password: "secret",
			});
			expect(res.cookie).toHaveBeenCalledWith(
				"authToken",
				"access-token-xxx",
				expect.objectContaining({
					httpOnly: true,
					maxAge: 60 * 60 * 1000,
				}),
			);
			expect(res.cookie).toHaveBeenCalledWith(
				"refreshToken",
				"refresh-token-xxx",
				expect.objectContaining({
					httpOnly: true,
					maxAge: 7 * 24 * 60 * 60 * 1000,
				}),
			);
			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(LOGIN_RESULT.user);
		});

		it("should set cookies with secure:true when request is secure", async () => {
			authService.login.mockResolvedValue(LOGIN_RESULT);
			const req = mockRequest({
				body: { username: "testuser", password: "secret" },
				secure: true,
			});
			const res = mockResponse();

			await controller.login(req, res);

			expect(res.cookie).toHaveBeenCalledWith(
				"authToken",
				"access-token-xxx",
				expect.objectContaining({
					secure: true,
				}),
			);
		});

		it("should throw InvalidCredentialsError when credentials are invalid", async () => {
			const error = new InvalidCredentialsError();
			authService.login.mockResolvedValue(error);
			const req = mockRequest({
				body: { username: "wrong", password: "wrong" },
			});
			const res = mockResponse();

			await expect(controller.login(req, res)).rejects.toThrow(
				InvalidCredentialsError,
			);
		});
	});

	describe("refresh()", () => {
		it("should refresh tokens and return user with status 200", async () => {
			authService.refresh.mockResolvedValue(REFRESH_RESULT);
			const req = mockRequest({
				cookies: { refreshToken: "valid-refresh-token" },
			});
			const res = mockResponse();

			await controller.refresh(req, res);

			expect(authService.refresh).toHaveBeenCalledWith({
				token: "valid-refresh-token",
			});
			expect(res.cookie).toHaveBeenCalledWith(
				"authToken",
				"new-access-token",
				expect.any(Object),
			);
			expect(res.cookie).toHaveBeenCalledWith(
				"refreshToken",
				"new-refresh-token",
				expect.any(Object),
			);
			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(REFRESH_RESULT.user);
		});

		it("should throw AuthRequiredError when refresh token cookie is missing", async () => {
			const req = mockRequest({ cookies: {} });
			const res = mockResponse();

			await expect(controller.refresh(req, res)).rejects.toThrow(
				AuthRequiredError,
			);
		});

		it("should throw InvalidTokenError when refresh token is invalid", async () => {
			const error = new InvalidTokenError();
			authService.refresh.mockResolvedValue(error);
			const req = mockRequest({ cookies: { refreshToken: "invalid-token" } });
			const res = mockResponse();

			await expect(controller.refresh(req, res)).rejects.toThrow(
				InvalidTokenError,
			);
		});
	});

	describe("verify()", () => {
		it("should set response headers and return user with status 200", async () => {
			const req = mockRequest();
			const res = mockResponse();
			res.locals.user = {
				id: "user-1",
				username: "testuser",
				role: "HOUSEHOLD",
			};

			await controller.verify(req, res as Response<unknown, AppLocals>);

			expect(res.setHeader).toHaveBeenCalledWith("X-User-Id", "user-1");
			expect(res.setHeader).toHaveBeenCalledWith("X-User-Role", "HOUSEHOLD");
			expect(res.setHeader).toHaveBeenCalledWith("X-User-Username", "testuser");
			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith(res.locals.user);
		});

		it("should throw AuthRequiredError when user is not set in locals", async () => {
			const req = mockRequest();
			const res = mockResponse();
			res.locals.user = undefined as unknown as AppLocals["user"];

			await expect(
				controller.verify(req, res as Response<unknown, AppLocals>),
			).rejects.toThrow(AuthRequiredError);
		});
	});

	describe("logout()", () => {
		it("should clear auth cookies and return message with status 200", async () => {
			const req = mockRequest();
			const res = mockResponse();

			await controller.logout(req, res);

			expect(res.clearCookie).toHaveBeenCalledWith(
				"authToken",
				expect.any(Object),
			);
			expect(res.clearCookie).toHaveBeenCalledWith(
				"refreshToken",
				expect.any(Object),
			);
			expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(res.json).toHaveBeenCalledWith({
				message: "Logged out successfully",
			});
		});

		it("should set secure:true in cookie options when request is secure", async () => {
			const req = mockRequest({ secure: true });
			const res = mockResponse();

			await controller.logout(req, res);

			expect(res.clearCookie).toHaveBeenCalledWith(
				"authToken",
				expect.objectContaining({ secure: true }),
			);
		});
	});
});
