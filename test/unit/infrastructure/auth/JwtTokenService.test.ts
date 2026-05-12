import { InvalidTokenError } from "@application/errors";
import type { AccessTokenPayload } from "@application/ports/in/AuthService";
import { JwtTokenService } from "@infrastructure/auth/JwtTokenService";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("jsonwebtoken");

const SECRET = "test-secret";
const ACCESS_EXPIRES = 3600;
const REFRESH_EXPIRES = 86400;

function validPayload(
	overrides?: Partial<AccessTokenPayload>,
): AccessTokenPayload {
	return {
		id: "user-1",
		username: "testuser",
		role: "HOUSEHOLD",
		...overrides,
	};
}

describe("JwtTokenService", () => {
	let service: JwtTokenService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new JwtTokenService(SECRET, ACCESS_EXPIRES, REFRESH_EXPIRES);
	});

	describe("generateAccessToken()", () => {
		it("should sign the payload with secret and access expiry", async () => {
			vi.mocked(jwt.sign).mockReturnValue("access-token" as unknown as never);

			const result = await service.generateAccessToken(validPayload());

			expect(jwt.sign).toHaveBeenCalledWith(validPayload(), SECRET, {
				expiresIn: ACCESS_EXPIRES,
			});
			expect(result).toBe("access-token");
		});
	});

	describe("generateRefreshToken()", () => {
		it("should sign the payload with secret and refresh expiry", async () => {
			vi.mocked(jwt.sign).mockReturnValue("refresh-token" as unknown as never);

			const result = await service.generateRefreshToken(validPayload());

			expect(jwt.sign).toHaveBeenCalledWith(validPayload(), SECRET, {
				expiresIn: REFRESH_EXPIRES,
			});
			expect(result).toBe("refresh-token");
		});
	});

	describe("verifyToken()", () => {
		it("should return the decoded payload for a valid token", async () => {
			vi.mocked(jwt.verify).mockReturnValue({
				id: "user-1",
				username: "testuser",
				role: "HOUSEHOLD",
			} as unknown as never);

			const result = await service.verifyToken("valid-token");

			expect(jwt.verify).toHaveBeenCalledWith("valid-token", SECRET);
			expect(result).toEqual(validPayload());
		});

		it("should return InvalidTokenError when token is malformed", async () => {
			vi.mocked(jwt.verify).mockImplementation(() => {
				throw new Error("jwt malformed");
			});

			const result = await service.verifyToken("invalid-token");

			expect(result).toBeInstanceOf(InvalidTokenError);
			expect((result as InvalidTokenError).code).toBe("INVALID_TOKEN");
		});

		it("should return InvalidTokenError when token is expired", async () => {
			vi.mocked(jwt.verify).mockImplementation(() => {
				throw new Error("jwt expired");
			});

			const result = await service.verifyToken("expired-token");

			expect(result).toBeInstanceOf(InvalidTokenError);
		});
	});
});
