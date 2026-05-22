import { AggregateRoot } from "@domain/entity/AggregateRoot";
import { UserCreatedEvent } from "@domain/events/UserCreatedEvent";
import { UserDeletedEvent } from "@domain/events/UserDeletedEvent";
import type { HashedPassword } from "@domain/value/HashedPassword";
import type { UserId } from "@domain/value/UserId";
import type { Username } from "@domain/value/Username";
import type { UserRole } from "@domain/value/UserRole";

export class User extends AggregateRoot {
	#username: Username;
	#password: HashedPassword;
	readonly #role: UserRole;

	private constructor(
		public readonly id: UserId,
		username: Username,
		password: HashedPassword,
		role: UserRole,
	) {
		super();
		this.#username = username;
		this.#password = password;
		this.#role = role;
	}

	get username(): Username {
		return this.#username;
	}
	get hashedPassword(): HashedPassword {
		return this.#password;
	}
	get role(): UserRole {
		return this.#role;
	}

	static create(
		id: UserId,
		username: Username,
		password: HashedPassword,
		role: UserRole,
	): User {
		const user = new User(id, username, password, role);
		user.addDomainEvent(new UserCreatedEvent(id, username, role));
		return user;
	}

	static restore(
		id: UserId,
		username: Username,
		password: HashedPassword,
		role: UserRole,
	): User {
		return new User(id, username, password, role);
	}

	changeUsername(newUsername: Username): void {
		this.#username = newUsername;
	}

	changePassword(newPassword: HashedPassword): void {
		this.#password = newPassword;
	}

	prepareForDeletion(): void {
		this.addDomainEvent(new UserDeletedEvent(this.id, this.#username));
	}

	equals(other: User): boolean {
		return this.id.equals(other.id);
	}
}
