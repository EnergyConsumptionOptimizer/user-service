import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/AuthMiddleware";
import { AuthService } from "@domain/ports/AuthService";
import { LoginSchema } from "@presentation/AuthSchemas";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: "lax" as const,
};
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000; // 1h
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7d

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = LoginSchema.parse(req.body);
      const { tokens, user } = await this.authService.login(username, password);

      res.cookie("authToken", tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });

      res.status(200).json({
        success: true,
        message: "Login successful.",
        user: user,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie("authToken", COOKIE_OPTIONS);
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentRefreshToken = req.cookies["refreshToken"] as string;
      const { tokens, user } =
        await this.authService.refresh(currentRefreshToken);

      res.cookie("authToken", tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });

      res.status(200).json({
        success: true,
        message: "Token refreshed",
        user: user,
      });
    } catch (error) {
      next(error);
    }
  };

  verify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      res.status(200).json({
        success: true,
        user: user,
      });
    } catch (error) {
      next(error);
    }
  };
}
