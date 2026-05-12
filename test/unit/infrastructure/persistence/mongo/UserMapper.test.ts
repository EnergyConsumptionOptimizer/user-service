import { User } from "@domain/entity/User";
import {
	toDomain,
	toPersistence,
} from "@infrastructure/persistence/mongo/UserMapper";
import type { UserDoc } from "@infrastructure/persistence/mongo/UserSchema";
import { aUser, HOUSEHOLD_ROLE } from "@test/domainFactories";
import { describe, expect, it } from "vitest";

describe("UserMapper", () => {
	describe("toDomain()", () => {
		it("should map a UserDoc to a domain User", () => {
			const doc: UserDoc = {
				_id: "user-1",
				username: "testuser",
				password: "hashed-pass",
				role: HOUSEHOLD_ROLE,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = toDomain(doc);

			expect(result).toBeInstanceOf(User);
			expect(result.id.value).toBe("user-1");
			expect(result.username.value).toBe("testuser");
			expect(result.hashedPassword.value).toBe("hashed-pass");
			expect(result.role).toBe(HOUSEHOLD_ROLE);
			expect(result.pullDomainEvents()).toHaveLength(0);
		});
	});

	describe("toPersistence()", () => {
		it("should map a domain User to a persistence object", () => {
			const user = aUser();

			const result = toPersistence(user);

			expect(result).toEqual({
				_id: "user-1",
				username: "testuser",
				password: "hashed-pass",
				role: HOUSEHOLD_ROLE,
			});
		});
	});
});
