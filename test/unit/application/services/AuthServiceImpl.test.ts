import {
	InvalidCredentialsError,
	InvalidTokenError,
} from "@application/errors";
import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import type { PasswordHasher } from "@application/ports/out/PasswordHasher";
import type { TokenService } from "@application/ports/out/TokenService";
import { AuthServiceImpl } from "@application/services/AuthServiceImpl";
import type { UserRepository } from "@domain/ports/UserRepository";
import { aUser } from "@test/domainFactories";
import { beforeEach, describe, expect, it } from "vitest";
import { type MockProxy, mock } from "vitest-mock-extended";

const PAYLOAD = { id: "user-1", username: "testuser", role: "HOUSEHOLD" };

describe("AuthServiceImpl", () => {
	let repository: MockProxy<UserRepository>;
	let passwordHasher: MockProxy<PasswordHasher>;
	let tokenService: MockProxy<TokenService>;
	let metrics: MockProxy<BusinessMetricsPort>;
	let service: AuthServiceImpl;

	beforeEach(() => {
		repository = mock<UserRepository>();
		passwordHasher = mock<PasswordHasher>();
		tokenService = mock<TokenService>();
		metrics = mock<BusinessMetricsPort>();
		service = new AuthServiceImpl(
			repository,
			passwordHasher,
			tokenService,
			metrics,
		);
	});

	describe("login()", () => {
		it("should return tokens and user payload on success", async () => {
			const user = aUser();
			repository.findByUsername.mockResolvedValue(user);
			passwordHasher.compare.mockResolvedValue(true);
			tokenService.generateAccessToken.mockResolvedValue("access-token");
			tokenService.generateRefreshToken.mockResolvedValue("refresh-token");

			const result = await service.login({
				username: "testuser",
				password: "plain-password",
			});

			expect(result).toEqual({
				accessToken: "access-token",
				refreshToken: "refresh-token",
				user: PAYLOAD,
			});
			expect(passwordHasher.compare).toHaveBeenCalledWith(
				"plain-password",
				"hashed-pass",
			);
			expect(metrics.recordUserLogin).toHaveBeenCalled();
		});

		it("should return InvalidCredentialsError when username is empty", async () => {
			const result = await service.login({
				username: "",
				password: "plain-password",
			});

			expect(result).toBeInstanceOf(InvalidCredentialsError);
			expect((result as InvalidCredentialsError).code).toBe(
				"INVALID_CREDENTIALS",
			);
		});

		it("should return InvalidCredentialsError when user is not found", async () => {
			repository.findByUsername.mockResolvedValue(undefined);

			const result = await service.login({
				username: "unknown",
				password: "plain-password",
			});

			expect(result).toBeInstanceOf(InvalidCredentialsError);
			expect((result as InvalidCredentialsError).code).toBe(
				"INVALID_CREDENTIALS",
			);
		});

		it("should return InvalidCredentialsError when password does not match", async () => {
			const user = aUser();
			repository.findByUsername.mockResolvedValue(user);
			passwordHasher.compare.mockResolvedValue(false);

			const result = await service.login({
				username: "testuser",
				password: "wrong-password",
			});

			expect(result).toBeInstanceOf(InvalidCredentialsError);
			expect((result as InvalidCredentialsError).code).toBe(
				"INVALID_CREDENTIALS",
			);
		});
	});

	describe("refresh()", () => {
		it("should return new tokens when refresh token is valid", async () => {
			tokenService.verifyToken.mockResolvedValue(PAYLOAD);
			tokenService.generateAccessToken.mockResolvedValue("new-access-token");
			tokenService.generateRefreshToken.mockResolvedValue("new-refresh-token");

			const result = await service.refresh({ token: "valid-refresh-token" });

			expect(result).toEqual({
				accessToken: "new-access-token",
				refreshToken: "new-refresh-token",
				user: PAYLOAD,
			});
			expect(tokenService.verifyToken).toHaveBeenCalledWith(
				"valid-refresh-token",
			);
		});

		it("should return InvalidTokenError when refresh token is invalid", async () => {
			tokenService.verifyToken.mockResolvedValue(new InvalidTokenError());

			const result = await service.refresh({ token: "invalid-token" });

			expect(result).toBeInstanceOf(InvalidTokenError);
			expect((result as InvalidTokenError).code).toBe("INVALID_TOKEN");
		});
	});

	describe("verifyToken()", () => {
		it("should return payload when token is valid", async () => {
			tokenService.verifyToken.mockResolvedValue(PAYLOAD);

			const result = await service.verifyToken({ token: "valid-token" });

			expect(result).toEqual(PAYLOAD);
		});

		it("should return InvalidTokenError when token is invalid", async () => {
			tokenService.verifyToken.mockResolvedValue(new InvalidTokenError());

			const result = await service.verifyToken({ token: "invalid-token" });

			expect(result).toBeInstanceOf(InvalidTokenError);
			expect((result as InvalidTokenError).code).toBe("INVALID_TOKEN");
		});
	});
});
