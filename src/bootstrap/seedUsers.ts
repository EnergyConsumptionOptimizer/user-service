import type { IdGenerator } from "@application/ports/out/IdGenerator";
import type { PasswordHasher } from "@application/ports/out/PasswordHasher";
import { User } from "@domain/entity/User";
import type { UserRepository } from "@domain/ports/UserRepository";
import { HashedPassword } from "@domain/value/HashedPassword";
import { UserId } from "@domain/value/UserId";
import { Username } from "@domain/value/Username";
import { type UserRole, UserRoles } from "@domain/value/UserRole";
import type { Logger } from "pino";

interface SeedUser {
	readonly username: string;
	readonly password: string;
	readonly role: UserRole;
}

const DEFAULT_USERS: readonly SeedUser[] = [
	{ username: "admin", password: "admin", role: UserRoles.ADMIN },
	{ username: "usera", password: "usera", role: UserRoles.HOUSEHOLD },
	{ username: "userb", password: "userb", role: UserRoles.HOUSEHOLD },
];

function resolveSeedUsers(
	envUsers?: readonly { username: string; password: string; role: string }[],
): SeedUser[] {
	if (!envUsers || envUsers.length === 0) {
		return [...DEFAULT_USERS];
	}
	return envUsers.map((u) => ({
		username: u.username,
		password: u.password,
		role: (u.role.toUpperCase() as UserRole) || UserRoles.HOUSEHOLD,
	}));
}

export async function seedUsers(
	repository: UserRepository,
	passwordHasher: PasswordHasher,
	idGenerator: IdGenerator,
	logger: Logger,
	envUsers?: readonly { username: string; password: string; role: string }[],
): Promise<void> {
	const users = resolveSeedUsers(envUsers);

	for (const seed of users) {
		const username = Username.of(seed.username) as Username;
		const existing = await repository.findByUsername(username);
		if (existing) {
			logger.debug(
				{ username: seed.username },
				"User already exists, skipping",
			);
			continue;
		}

		const id = UserId.of(idGenerator.generate()) as UserId;
		const hashed = await passwordHasher.hash(seed.password);
		const hashedPassword = HashedPassword.of(hashed) as HashedPassword;
		const user = User.create(id, username, hashedPassword, seed.role);
		await repository.save(user);
		logger.info(
			{ username: seed.username, role: seed.role },
			"Created default user",
		);
	}
}
