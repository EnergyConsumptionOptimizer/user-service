import { InvalidUserIdError } from "@domain/errors";

export class UserId {
	private constructor(readonly value: string) {}

	static of(id: string): UserId | InvalidUserIdError {
		const trimmed = id.trim();
		if (!trimmed) {
			return new InvalidUserIdError(
				"USER_ID_EMPTY",
				"User ID must not be empty",
			);
		}
		return new UserId(trimmed);
	}

	equals(other: UserId): boolean {
		return this.value === other.value;
	}
}
