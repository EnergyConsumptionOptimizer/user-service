import { InvalidPasswordError } from "@domain/errors";

export class HashedPassword {
	private constructor(public readonly value: string) {}

	static of(hashedValue: string): HashedPassword | InvalidPasswordError {
		if (!hashedValue) {
			return new InvalidPasswordError(
				"PASSWORD_EMPTY",
				"Hashed password must not be empty",
			);
		}
		return new HashedPassword(hashedValue);
	}

	equals(other: HashedPassword): boolean {
		return this.value === other.value;
	}
}
