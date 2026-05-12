import { User } from "@domain/entity/User";
import { HashedPassword } from "@domain/value/HashedPassword";
import { UserId } from "@domain/value/UserId";
import { Username } from "@domain/value/Username";
import type { UserRole } from "@domain/value/UserRole";
import type { UserDoc } from "./UserSchema.js";

export function toDomain(doc: UserDoc): User {
	return User.restore(
		UserId.of(doc._id) as UserId,
		Username.of(doc.username) as Username,
		HashedPassword.of(doc.password) as HashedPassword,
		doc.role,
	);
}

interface PersistenceUser {
	_id: string;
	username: string;
	password: string;
	role: UserRole;
}

export function toPersistence(user: User): PersistenceUser {
	return {
		_id: user.id.value,
		username: user.username.value,
		password: user.hashedPassword.value,
		role: user.role,
	};
}
