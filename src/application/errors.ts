export const AppErrorCode = {
	INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
	INVALID_TOKEN: "INVALID_TOKEN",
	INVALID_RESET_CODE: "INVALID_RESET_CODE",
	USER_NOT_FOUND: "USER_NOT_FOUND",
} as const;

export abstract class ApplicationError extends Error {
	public abstract readonly code: string;

	protected constructor(message: string) {
		super(message);
		this.name = this.constructor.name;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export class InvalidCredentialsError extends ApplicationError {
	public readonly code = AppErrorCode.INVALID_CREDENTIALS;

	constructor() {
		super("Invalid credentials");
	}
}

export class InvalidTokenError extends ApplicationError {
	public readonly code = AppErrorCode.INVALID_TOKEN;

	constructor() {
		super("Invalid token");
	}
}

export class InvalidResetCodeError extends ApplicationError {
	public readonly code = AppErrorCode.INVALID_RESET_CODE;

	constructor() {
		super("Invalid reset code");
	}
}

export class UserNotFoundError extends ApplicationError {
	public readonly code = AppErrorCode.USER_NOT_FOUND;

	constructor() {
		super("User not found");
	}
}
