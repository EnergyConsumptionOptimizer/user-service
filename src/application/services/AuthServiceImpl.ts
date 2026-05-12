import { InvalidCredentialsError } from "@application/errors";
import type {
	AccessTokenPayload,
	AuthService,
	LoginResponse,
	LoginResult,
	RefreshResponse,
	VerifyTokenResponse,
} from "@application/ports/in/AuthService";
import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import type { PasswordHasher } from "@application/ports/out/PasswordHasher";
import type { TokenService } from "@application/ports/out/TokenService";
import type { UserRepository } from "@domain/ports/UserRepository";
import { Username } from "@domain/value/Username";

export class AuthServiceImpl implements AuthService {
	readonly #repository: UserRepository;
	readonly #passwordHasher: PasswordHasher;
	readonly #tokenService: TokenService;
	readonly #metrics: BusinessMetricsPort;

	constructor(
		repository: UserRepository,
		passwordHasher: PasswordHasher,
		tokenService: TokenService,
		metrics: BusinessMetricsPort,
	) {
		this.#repository = repository;
		this.#passwordHasher = passwordHasher;
		this.#tokenService = tokenService;
		this.#metrics = metrics;
	}

	async login(args: {
		readonly username: string;
		readonly password: string;
	}): Promise<LoginResponse> {
		const username = Username.of(args.username);
		// Domain error masked for security reasons (to prevent enumeration)
		if (username instanceof Error) return new InvalidCredentialsError();

		const user = await this.#repository.findByUsername(username);
		if (!user) return new InvalidCredentialsError();

		const match = await this.#passwordHasher.compare(
			args.password,
			user.hashedPassword.value,
		);
		if (!match) return new InvalidCredentialsError();

		const payload: AccessTokenPayload = {
			id: user.id.value,
			username: user.username.value,
			role: user.role,
		};

		const result = await this.#generateLoginResult(payload);
		this.#metrics.recordUserLogin();
		return result;
	}

	async refresh(args: { readonly token: string }): Promise<RefreshResponse> {
		const payload = await this.#tokenService.verifyToken(args.token);
		if (payload instanceof Error) return payload;

		return this.#generateLoginResult(payload);
	}

	async verifyToken(args: {
		readonly token: string;
	}): Promise<VerifyTokenResponse> {
		const payload = await this.#tokenService.verifyToken(args.token);
		if (payload instanceof Error) return payload;

		return payload;
	}

	async #generateLoginResult(
		payload: AccessTokenPayload,
	): Promise<LoginResult> {
		const [accessToken, refreshToken] = await Promise.all([
			this.#tokenService.generateAccessToken(payload),
			this.#tokenService.generateRefreshToken(payload),
		]);

		return { accessToken, refreshToken, user: payload };
	}
}
