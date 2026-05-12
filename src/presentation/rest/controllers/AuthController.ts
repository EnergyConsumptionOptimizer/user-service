import type { AuthService } from "@application/ports/in/AuthService";
import { AuthRequiredError } from "@presentation/errors";
import type { AppLocals } from "@presentation/rest/middleware/auth";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function cookieOptions(req: Request) {
	return { httpOnly: true, secure: req.secure, sameSite: "lax" as const };
}

export class AuthController {
	readonly #authService: AuthService;

	constructor(authService: AuthService) {
		this.#authService = authService;
	}

	async login(req: Request, res: Response) {
		const { username, password } = req.body;
		const result = await this.#authService.login({ username, password });
		if (result instanceof Error) throw result;

		this.#setAuthCookies(req, res, result.accessToken, result.refreshToken);

		res.status(StatusCodes.OK).json(result.user);
	}

	async refresh(req: Request, res: Response) {
		const token = req.cookies?.refreshToken as string | undefined;
		if (!token) throw new AuthRequiredError();

		const result = await this.#authService.refresh({ token });
		if (result instanceof Error) throw result;

		this.#setAuthCookies(req, res, result.accessToken, result.refreshToken);

		res.status(StatusCodes.OK).json(result.user);
	}

	async verify(_req: Request, res: Response<unknown, AppLocals>) {
		const { user } = res.locals;
		if (!user) throw new AuthRequiredError();

		res.setHeader("X-User-Id", user.id);
		res.setHeader("X-User-Role", user.role);
		res.setHeader("X-User-Username", user.username);

		res.status(StatusCodes.OK).json(user);
	}

	async logout(req: Request, res: Response) {
		const opts = cookieOptions(req);
		res.clearCookie("authToken", opts);
		res.clearCookie("refreshToken", opts);
		res.status(StatusCodes.OK).json({ message: "Logged out successfully" });
	}

	#setAuthCookies(
		req: Request,
		res: Response,
		accessToken: string,
		refreshToken: string,
	) {
		res.cookie("authToken", accessToken, {
			...cookieOptions(req),
			maxAge: ACCESS_TOKEN_MAX_AGE,
		});
		res.cookie("refreshToken", refreshToken, {
			...cookieOptions(req),
			maxAge: REFRESH_TOKEN_MAX_AGE,
		});
	}
}
