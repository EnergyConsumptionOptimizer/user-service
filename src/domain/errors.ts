export const DomainErrorCode = {
	USER_ID_EMPTY: "USER_ID_EMPTY",
	USERNAME_EMPTY: "USERNAME_EMPTY",
	PASSWORD_EMPTY: "PASSWORD_EMPTY",
	RESERVED_USERNAME: "RESERVED_USERNAME",
	USERNAME_ALREADY_EXISTS: "USERNAME_ALREADY_EXISTS",
} as const;

export type UserIdErrorCode = typeof DomainErrorCode.USER_ID_EMPTY;
export type UsernameErrorCode = typeof DomainErrorCode.USERNAME_EMPTY;
export type PasswordErrorCode = typeof DomainErrorCode.PASSWORD_EMPTY;

export abstract class DomainError extends Error {
	public abstract readonly code: string;
	protected constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export class InvalidUserIdError extends DomainError {
	constructor(
		public readonly code: UserIdErrorCode,
		message: string,
	) {
		super(message);
	}
}

export class InvalidUsernameError extends DomainError {
	constructor(
		public readonly code: UsernameErrorCode,
		message: string,
	) {
		super(message);
	}
}

export class InvalidPasswordError extends DomainError {
	constructor(
		public readonly code: PasswordErrorCode,
		message: string,
	) {
		super(message);
	}
}

export class ReservedUsernameError extends DomainError {
	public readonly code = DomainErrorCode.RESERVED_USERNAME;

	constructor(public readonly username: string) {
		super(`Username '${username}' cannot be used`);
	}
}

export class UsernameAlreadyExistsError extends DomainError {
	public readonly code = DomainErrorCode.USERNAME_ALREADY_EXISTS;

	constructor() {
		super("Username already exists");
	}
}
