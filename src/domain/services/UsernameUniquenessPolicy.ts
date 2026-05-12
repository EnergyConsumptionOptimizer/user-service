import {
	ReservedUsernameError,
	UsernameAlreadyExistsError,
} from "@domain/errors";
import type { UserRepository } from "@domain/ports/UserRepository";
import type { UserId } from "@domain/value/UserId";
import type { Username } from "@domain/value/Username";
import type { UniqueUsernameChecker } from "./UniqueUsernameChecker";

export class UsernameUniquenessPolicy implements UniqueUsernameChecker {
	readonly #reservedNames = ["admin"];
	readonly #userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.#userRepository = userRepository;
	}

	async ensureAvailable(
		username: Username,
		excludeId?: UserId,
	): Promise<undefined | ReservedUsernameError | UsernameAlreadyExistsError> {
		const normalized = username.value.toLowerCase().trim();

		if (this.#reservedNames.includes(normalized)) {
			return new ReservedUsernameError(username.value);
		}
		const existingUser = await this.#userRepository.findByUsername(username);
		if (!existingUser) {
			return;
		}
		if (excludeId && existingUser.id.equals(excludeId)) {
			return;
		}
		return new UsernameAlreadyExistsError();
	}
}
