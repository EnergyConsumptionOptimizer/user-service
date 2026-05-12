import type { User } from "@domain/entity/User";
import type { UserId } from "@domain/value/UserId";
import type { Username } from "@domain/value/Username";
import type { UserRole } from "@domain/value/UserRole";

export interface UserRepository {
	findById(id: UserId): Promise<User | undefined>;
	findByUsername(username: Username): Promise<User | undefined>;
	findByRole(role: UserRole): Promise<User[]>;
	save(user: User): Promise<void>;
	remove(user: User): Promise<void>;
}
