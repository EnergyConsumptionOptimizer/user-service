import { InvalidPasswordError } from "@domain/errors";

export class PlainPassword {
	private constructor(public readonly value: string) {}

	static of(password: string): PlainPassword | InvalidPasswordError {
		if (!password) {
			return new InvalidPasswordError(
				"PASSWORD_EMPTY",
				"Password must not be empty",
			);
		}
		return new PlainPassword(password);
	}
}
