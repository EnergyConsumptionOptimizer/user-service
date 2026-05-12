import type { TokenService } from "@application/ports/out/TokenService";
import { type UserRole, UserRoles } from "@domain/value/UserRole";
import { AuthRequiredError, ForbiddenError } from "@presentation/errors";
import type { NextFunction, Request, Response } from "express";

export interface AuthenticatedUser {
	readonly id: string;
	readonly username: string;
	readonly role: UserRole;
}

export interface AppLocals {
	user: AuthenticatedUser;
}

export function forwardAuth(
	req: Request,
	res: Response<unknown, AppLocals>,
	next: NextFunction,
): void {
	const userId = req.headers["x-user-id"];
	const userRole = req.headers["x-user-role"];
	const username = req.headers["x-user-username"];

	if (typeof userId !== "string") {
		throw new AuthRequiredError();
	}

	res.locals.user = {
		id: userId,
		username: typeof username === "string" ? username : "",
		role: (userRole as UserRole) || UserRoles.HOUSEHOLD,
	};

	next();
}

export function createTokenAuth(tokenService: TokenService) {
	return async (
		req: Request,
		res: Response<unknown, AppLocals>,
		next: NextFunction,
	): Promise<void> => {
		const token = req.cookies?.authToken as string | undefined;
		if (!token) {
			throw new AuthRequiredError();
		}

		const payload = await tokenService.verifyToken(token);
		if (payload instanceof Error) {
			throw payload;
		}

		res.locals.user = {
			id: payload.id,
			username: payload.username,
			role: payload.role as UserRole,
		};

		next();
	};
}

export function requireRole(...roles: UserRole[]) {
	return (
		_req: Request,
		res: Response<unknown, AppLocals>,
		next: NextFunction,
	): void => {
		const { user } = res.locals;
		if (!user || !roles.includes(user.role)) {
			throw new ForbiddenError();
		}
		next();
	};
}

export function requireOwnershipOrAdmin(
	req: Request,
	res: Response<unknown, AppLocals>,
	next: NextFunction,
): void {
	const { user } = res.locals;
	if (!user) {
		throw new AuthRequiredError();
	}

	if (user.id === req.params.id || user.role === UserRoles.ADMIN) {
		next();
		return;
	}

	throw new ForbiddenError();
}
