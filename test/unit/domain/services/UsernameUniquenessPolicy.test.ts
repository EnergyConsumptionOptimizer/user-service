import {
	ReservedUsernameError,
	UsernameAlreadyExistsError,
} from "@domain/errors";
import type { UserRepository } from "@domain/ports/UserRepository";
import { UsernameUniquenessPolicy } from "@domain/services/UsernameUniquenessPolicy";
import { UserId } from "@domain/value/UserId";
import { aUser, validId, validUsername } from "@test/domainFactories";
import { beforeEach, describe, expect, it } from "vitest";
import { type MockProxy, mock } from "vitest-mock-extended";

describe("UsernameUniquenessPolicy", () => {
	let policy: UsernameUniquenessPolicy;
	let repository: MockProxy<UserRepository>;

	beforeEach(() => {
		repository = mock<UserRepository>();
		policy = new UsernameUniquenessPolicy(repository);
	});

	describe("ensureAvailable()", () => {
		it("should return undefined when username is available", async () => {
			repository.findByUsername.mockResolvedValue(undefined);

			const result = await policy.ensureAvailable(validUsername("alice"));

			expect(result).toBeUndefined();
			expect(repository.findByUsername).toHaveBeenCalledWith(
				validUsername("alice"),
			);
		});

		it.each([
			{ scenario: 'the reserved name "admin"', input: "admin" },
			{ scenario: '"admin" with surrounding whitespace', input: "   admin   " },
			{ scenario: '"Admin" with mixed case', input: "Admin" },
		])("should return ReservedUsernameError for $scenario", async ({
			input,
		}) => {
			const result = await policy.ensureAvailable(validUsername(input));

			expect(result).toBeInstanceOf(ReservedUsernameError);
			if (result instanceof ReservedUsernameError) {
				expect(result.code).toBe("RESERVED_USERNAME");
			}
			expect(repository.findByUsername).not.toHaveBeenCalled();
		});

		it("should return UsernameAlreadyExistsError when username is taken", async () => {
			repository.findByUsername.mockResolvedValue(
				aUser({ id: validId("existing-id"), username: validUsername("bob") }),
			);

			const result = await policy.ensureAvailable(validUsername("bob"));

			expect(result).toBeInstanceOf(UsernameAlreadyExistsError);
			if (result instanceof UsernameAlreadyExistsError) {
				expect(result.code).toBe("USERNAME_ALREADY_EXISTS");
			}
			expect(repository.findByUsername).toHaveBeenCalledWith(
				validUsername("bob"),
			);
		});

		it("should return undefined when username matches the excluded user (own rename)", async () => {
			const excludeId = UserId.of("existing-id") as UserId;
			repository.findByUsername.mockResolvedValue(
				aUser({ id: validId("existing-id"), username: validUsername("bob") }),
			);

			const result = await policy.ensureAvailable(
				validUsername("bob"),
				excludeId,
			);

			expect(result).toBeUndefined();
			expect(repository.findByUsername).toHaveBeenCalledWith(
				validUsername("bob"),
			);
		});

		it("should return UsernameAlreadyExistsError when username is taken by a different user", async () => {
			const differentId = UserId.of("different-id") as UserId;
			repository.findByUsername.mockResolvedValue(
				aUser({ id: validId("existing-id"), username: validUsername("bob") }),
			);

			const result = await policy.ensureAvailable(
				validUsername("bob"),
				differentId,
			);

			expect(result).toBeInstanceOf(UsernameAlreadyExistsError);
			if (result instanceof UsernameAlreadyExistsError) {
				expect(result.code).toBe("USERNAME_ALREADY_EXISTS");
			}
		});
	});
});
