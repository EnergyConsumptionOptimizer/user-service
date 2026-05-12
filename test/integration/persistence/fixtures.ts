import type { UserRole } from "@domain/value/UserRole";
import { UserModel } from "@infrastructure/persistence/mongo/UserSchema";
import {
	aNewUser,
	aUser,
	HOUSEHOLD_ROLE,
	validId,
	validPassword,
	validUsername,
} from "@test/domainFactories";

export {
	aNewUser,
	aUser,
	HOUSEHOLD_ROLE,
	validId,
	validPassword,
	validUsername,
};

export async function seedUser(
	id = "user-1",
	username = "testuser",
	role: UserRole = HOUSEHOLD_ROLE,
): Promise<void> {
	await UserModel.create({ _id: id, username, password: "hashed-pass", role });
}
