import { InvalidTokenError } from "@application/errors";
import type { AccessTokenPayload } from "@application/ports/in/AuthService";
import type { TokenService } from "@application/ports/out/TokenService";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import type { Logger } from "pino";

export class JwtTokenService implements TokenService {
	readonly #secret: string;
	readonly #accessExpiresIn: string | number;
	readonly #refreshExpiresIn: string | number;
	readonly #logger?: Logger;

	constructor(
		secret: string,
		accessExpiresIn: string | number,
		refreshExpiresIn: string | number,
		logger?: Logger,
	) {
		this.#secret = secret;
		this.#accessExpiresIn = accessExpiresIn;
		this.#refreshExpiresIn = refreshExpiresIn;
		this.#logger = logger;
	}

	async generateAccessToken(payload: AccessTokenPayload): Promise<string> {
		return jwt.sign(payload, this.#secret, {
			expiresIn: this.#accessExpiresIn as StringValue | number,
		});
	}

	async generateRefreshToken(payload: AccessTokenPayload): Promise<string> {
		return jwt.sign(payload, this.#secret, {
			expiresIn: this.#refreshExpiresIn as StringValue | number,
		});
	}

	async verifyToken(
		token: string,
	): Promise<AccessTokenPayload | InvalidTokenError> {
		try {
			const decoded = jwt.verify(token, this.#secret) as jwt.JwtPayload;
			return {
				id: decoded.id as string,
				username: decoded.username as string,
				role: decoded.role as string,
			};
		} catch (err) {
			this.#logger?.warn({ err }, "JWT token verification failed");
			return new InvalidTokenError();
		}
	}
}
