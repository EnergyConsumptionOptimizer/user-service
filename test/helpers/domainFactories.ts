import { User } from "@domain/entity/User";
import { HashedPassword } from "@domain/value/HashedPassword";
import { UserId } from "@domain/value/UserId";
import { Username } from "@domain/value/Username";
import { type UserRole, UserRoles } from "@domain/value/UserRole";

export function validId(value = "user-1"): UserId {
	return UserId.of(value) as UserId;
}

export function validUsername(value = "testuser"): Username {
	return Username.of(value) as Username;
}

export function validPassword(value = "hashed-pass"): HashedPassword {
	return HashedPassword.of(value) as HashedPassword;
}

export const ROLE = UserRoles.HOUSEHOLD;

export function aUser(overrides?: {
	id?: UserId;
	username?: Username;
	role?: UserRole;
}): User {
	return User.restore(
		overrides?.id ?? validId(),
		overrides?.username ?? validUsername(),
		validPassword(),
		overrides?.role ?? ROLE,
	);
}

export function aNewUser(overrides?: {
	id?: UserId;
	username?: Username;
	role?: UserRole;
}): User {
	return User.create(
		overrides?.id ?? validId(),
		overrides?.username ?? validUsername(),
		validPassword(),
		overrides?.role ?? ROLE,
	);
}
