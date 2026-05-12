import type {
	InvalidCredentialsError,
	InvalidTokenError,
} from "@application/errors";

export type AccessToken = string;
export type RefreshToken = string;

export interface AuthenticatedUser {
	readonly id: string;
	readonly username: string;
	readonly role: string;
}

export type AccessTokenPayload = AuthenticatedUser;

export interface LoginResult {
	readonly accessToken: AccessToken;
	readonly refreshToken: RefreshToken;
	readonly user: AuthenticatedUser;
}

export type LoginResponse = LoginResult | InvalidCredentialsError;

export type RefreshResponse = LoginResult | InvalidTokenError;

export type VerifyTokenResponse = AccessTokenPayload | InvalidTokenError;

export interface AuthService {
	login(args: {
		readonly username: string;
		readonly password: string;
	}): Promise<LoginResponse>;

	refresh(args: { readonly token: RefreshToken }): Promise<RefreshResponse>;

	verifyToken(args: {
		readonly token: AccessToken;
	}): Promise<VerifyTokenResponse>;
}
