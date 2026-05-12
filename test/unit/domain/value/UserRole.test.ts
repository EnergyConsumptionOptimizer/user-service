import { type UserRole, UserRoles } from "@domain/value/UserRole";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("UserRoles", () => {
	it("should define the exact supported runtime role values", () => {
		expect(UserRoles).toEqual({
			ADMIN: "ADMIN",
			HOUSEHOLD: "HOUSEHOLD",
		});
	});

	it("should enforce strict literal typing for the UserRole type", () => {
		expectTypeOf<UserRole>().toEqualTypeOf<"ADMIN" | "HOUSEHOLD">();
	});

	it("should prevent runtime mutation by being read-only", () => {
		expect(Object.isFrozen(UserRoles.ADMIN)).toBe(true);
	});
});
