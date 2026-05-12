import type {
	InvalidResetCodeError,
	UserNotFoundError,
} from "@application/errors";
import type {
	InvalidPasswordError,
	InvalidUserIdError,
	InvalidUsernameError,
	ReservedUsernameError,
	UsernameAlreadyExistsError,
} from "@domain/errors";

export interface UserOutput {
	readonly id: string;
	readonly username: string;
	readonly role: string;
}

export type CreateUserResponse =
	| UserOutput
	| UsernameAlreadyExistsError
	| ReservedUsernameError
	| InvalidUsernameError
	| InvalidPasswordError
	| InvalidUserIdError;

export type GetUserByIdResponse =
	| UserOutput
	| UserNotFoundError
	| InvalidUserIdError;

export type GetUserByUsernameResponse =
	| UserOutput
	| UserNotFoundError
	| InvalidUsernameError;

export type UpdateUsernameResponse =
	| UserOutput
	| InvalidUserIdError
	| InvalidUsernameError
	| ReservedUsernameError
	| UsernameAlreadyExistsError
	| UserNotFoundError;

export type DeleteUserResponse =
	| undefined
	| InvalidUserIdError
	| UserNotFoundError;

export type ChangePasswordResponse =
	| UserOutput
	| InvalidUserIdError
	| UserNotFoundError
	| InvalidPasswordError;

export type ResetAdminPasswordResponse =
	| undefined
	| UserNotFoundError
	| InvalidResetCodeError
	| InvalidPasswordError
	| InvalidUsernameError;

export interface UserService {
	createHouseholdUser(args: {
		readonly username: string;
		readonly password: string;
	}): Promise<CreateUserResponse>;

	getUser(args: { readonly id: string }): Promise<GetUserByIdResponse>;

	getUserByUsername(args: {
		readonly username: string;
	}): Promise<GetUserByUsernameResponse>;

	getHouseholdUsers(): Promise<UserOutput[]>;

	updateUsername(args: {
		readonly id: string;
		readonly newUsername: string;
	}): Promise<UpdateUsernameResponse>;

	deleteHouseholdUser(args: {
		readonly id: string;
	}): Promise<DeleteUserResponse>;

	changePassword(args: {
		readonly id: string;
		readonly newPassword: string;
	}): Promise<ChangePasswordResponse>;

	resetAdminPassword(args: {
		readonly resetCode: string;
		readonly newPassword: string;
	}): Promise<ResetAdminPasswordResponse>;
}
