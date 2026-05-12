import { InvalidUsernameError } from "@domain/errors";

export class Username {
	private constructor(public readonly value: string) {}

	static of(username: string): Username | InvalidUsernameError {
		const trimmed = username.trim();
		if (!trimmed) {
			return new InvalidUsernameError(
				"USERNAME_EMPTY",
				"Username must not be empty",
			);
		}
		return new Username(trimmed);
	}

	equals(other: Username): boolean {
		return this.value === other.value;
	}
}
