import { InvalidTokenError } from "@application/errors";
import type { TokenService } from "@application/ports/out/TokenService";
import { UserRoles } from "@domain/value/UserRole";
import { AuthRequiredError, ForbiddenError } from "@presentation/errors";
import {
	type AppLocals,
	createTokenAuth,
	forwardAuth,
	requireOwnershipOrAdmin,
	requireRole,
} from "@presentation/rest/middleware/auth";
import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type MockProxy, mock } from "vitest-mock-extended";

function mockRequest(overrides?: Partial<Request>): Request {
	return {
		params: {},
		body: {},
		cookies: {},
		headers: {},
		...overrides,
	} as Request;
}

function mockResponse(): Response<unknown, AppLocals> {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		locals: {} as AppLocals,
		headersSent: false,
	};
	return res as unknown as Response<unknown, AppLocals>;
}

describe("Auth Middleware", () => {
	describe("forwardAuth()", () => {
		it("should set user in locals from headers and call next", () => {
			const req = mockRequest({
				headers: {
					"x-user-id": "user-1",
					"x-user-role": "ADMIN",
					"x-user-username": "admin",
				},
			});
			const res = mockResponse();
			const next: NextFunction = vi.fn();

			forwardAuth(req, res as Response<unknown, AppLocals>, next);

			expect(res.locals.user).toEqual({
				id: "user-1",
				username: "admin",
				role: "ADMIN",
			});
			expect(next).toHaveBeenCalled();
		});

		it("should default to HOUSEHOLD role when x-user-role header is missing", () => {
			const req = mockRequest({
				headers: {
					"x-user-id": "user-1",
					"x-user-username": "bob",
				},
			});
			const res = mockResponse();
			const next: NextFunction = vi.fn();

			forwardAuth(req, res as Response<unknown, AppLocals>, next);

			expect(res.locals.user).toMatchObject({ role: "HOUSEHOLD" });
			expect(next).toHaveBeenCalled();
		});

		it("should default username to empty string when x-user-username header is missing", () => {
			const req = mockRequest({
				headers: {
					"x-user-id": "user-1",
				},
			});
			const res = mockResponse();
			const next: NextFunction = vi.fn();

			forwardAuth(req, res as Response<unknown, AppLocals>, next);

			expect(res.locals.user).toMatchObject({ username: "" });
			expect(next).toHaveBeenCalled();
		});

		it("should throw AuthRequiredError when x-user-id header is missing", () => {
			const req = mockRequest({ headers: {} });
			const res = mockResponse();
			const next: NextFunction = vi.fn();

			expect(() =>
				forwardAuth(req, res as Response<unknown, AppLocals>, next),
			).toThrow(AuthRequiredError);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("createTokenAuth()", () => {
		let tokenService: MockProxy<TokenService>;

		beforeEach(() => {
			tokenService = mock<TokenService>();
		});

		it("should set user in locals from token payload and call next", async () => {
			tokenService.verifyToken.mockResolvedValue({
				id: "user-1",
				username: "testuser",
				role: "HOUSEHOLD",
			});
			const req = mockRequest({ cookies: { authToken: "valid-token" } });
			const res = mockResponse();
			const next: NextFunction = vi.fn();
			const middleware = createTokenAuth(tokenService);

			await middleware(req, res as Response<unknown, AppLocals>, next);

			expect(tokenService.verifyToken).toHaveBeenCalledWith("valid-token");
			expect(res.locals.user).toEqual({
				id: "user-1",
				username: "testuser",
				role: "HOUSEHOLD",
			});
			expect(next).toHaveBeenCalled();
		});

		it("should throw AuthRequiredError when authToken cookie is missing", async () => {
			const req = mockRequest({ cookies: {} });
			const res = mockResponse();
			const next: NextFunction = vi.fn();
			const middleware = createTokenAuth(tokenService);

			await expect(
				middleware(req, res as Response<unknown, AppLocals>, next),
			).rejects.toThrow(AuthRequiredError);
			expect(next).not.toHaveBeenCalled();
		});

		it("should throw InvalidTokenError when token verification fails", async () => {
			const error = new InvalidTokenError();
			tokenService.verifyToken.mockResolvedValue(error);
			const req = mockRequest({ cookies: { authToken: "invalid-token" } });
			const res = mockResponse();
			const next: NextFunction = vi.fn();
			const middleware = createTokenAuth(tokenService);

			await expect(
				middleware(req, res as Response<unknown, AppLocals>, next),
			).rejects.toThrow(InvalidTokenError);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("requireRole()", () => {
		it("should call next when user has the required role", () => {
			const middleware = requireRole(UserRoles.ADMIN);
			const req = mockRequest();
			const res = mockResponse();
			res.locals.user = { id: "user-1", username: "admin", role: "ADMIN" };
			const next: NextFunction = vi.fn();

			middleware(req, res, next);

			expect(next).toHaveBeenCalled();
		});

		it("should allow multiple roles", () => {
			const middleware = requireRole(UserRoles.ADMIN, UserRoles.HOUSEHOLD);
			const req = mockRequest();
			const res = mockResponse();
			res.locals.user = { id: "user-1", username: "bob", role: "HOUSEHOLD" };
			const next: NextFunction = vi.fn();

			middleware(req, res, next);

			expect(next).toHaveBeenCalled();
		});

		it("should throw ForbiddenError when user has a different role", () => {
			const middleware = requireRole(UserRoles.ADMIN);
			const req = mockRequest();
			const res = mockResponse();
			res.locals.user = { id: "user-1", username: "bob", role: "HOUSEHOLD" };
			const next: NextFunction = vi.fn();

			expect(() => middleware(req, res, next)).toThrow(ForbiddenError);
			expect(next).not.toHaveBeenCalled();
		});

		it("should throw ForbiddenError when user is not set", () => {
			const middleware = requireRole(UserRoles.ADMIN);
			const req = mockRequest();
			const res = mockResponse();
			res.locals.user = undefined as unknown as AppLocals["user"];
			const next: NextFunction = vi.fn();

			expect(() => middleware(req, res, next)).toThrow(ForbiddenError);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("requireOwnershipOrAdmin()", () => {
		it("should call next when user is the owner of the resource", () => {
			const req = mockRequest({ params: { id: "user-1" } });
			const res = mockResponse();
			res.locals.user = { id: "user-1", username: "alice", role: "HOUSEHOLD" };
			const next: NextFunction = vi.fn();

			requireOwnershipOrAdmin(req, res, next);

			expect(next).toHaveBeenCalled();
		});

		it("should call next when user is an admin", () => {
			const req = mockRequest({ params: { id: "user-2" } });
			const res = mockResponse();
			res.locals.user = { id: "user-1", username: "admin", role: "ADMIN" };
			const next: NextFunction = vi.fn();

			requireOwnershipOrAdmin(req, res, next);

			expect(next).toHaveBeenCalled();
		});

		it("should throw ForbiddenError when user is neither owner nor admin", () => {
			const req = mockRequest({ params: { id: "user-2" } });
			const res = mockResponse();
			res.locals.user = { id: "user-1", username: "alice", role: "HOUSEHOLD" };
			const next: NextFunction = vi.fn();

			expect(() => requireOwnershipOrAdmin(req, res, next)).toThrow(
				ForbiddenError,
			);
			expect(next).not.toHaveBeenCalled();
		});

		it("should throw AuthRequiredError when user is not set", () => {
			const req = mockRequest({ params: { id: "user-1" } });
			const res = mockResponse();
			res.locals.user = undefined as unknown as AppLocals["user"];
			const next: NextFunction = vi.fn();

			expect(() => requireOwnershipOrAdmin(req, res, next)).toThrow(
				AuthRequiredError,
			);
			expect(next).not.toHaveBeenCalled();
		});
	});
});
