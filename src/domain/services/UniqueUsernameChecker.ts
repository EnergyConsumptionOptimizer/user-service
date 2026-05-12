import type {
	ReservedUsernameError,
	UsernameAlreadyExistsError,
} from "@domain/errors";
import type { UserId } from "@domain/value/UserId";
import type { Username } from "@domain/value/Username";

export interface UniqueUsernameChecker {
	ensureAvailable(
		username: Username,
		excludeId?: UserId,
	): Promise<undefined | ReservedUsernameError | UsernameAlreadyExistsError>;
}
