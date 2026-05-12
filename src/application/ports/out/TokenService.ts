import type { InvalidTokenError } from "@application/errors";
import type {
	AccessToken,
	AccessTokenPayload,
	RefreshToken,
} from "@application/ports/in/AuthService";

export interface TokenService {
	generateAccessToken(payload: AccessTokenPayload): Promise<AccessToken>;

	generateRefreshToken(payload: AccessTokenPayload): Promise<RefreshToken>;

	verifyToken(
		token: AccessToken,
	): Promise<AccessTokenPayload | InvalidTokenError>;
}
