import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/AuthMiddleware";
import { AuthService } from "@domain/ports/AuthService";
import { AccessToken } from "@domain/AccessToken";
import { AccessTokenMapper } from "@presentation/AccessTokenMapper";
import { LoginSchema, RefreshRequestSchema } from "@presentation/AuthSchemas";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = LoginSchema.parse(req.body);
      const token: AccessToken = await this.authService.login(
        username,
        password,
      );
      res.status(200).json(AccessTokenMapper.toDTO(token));
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      await this.authService.logout(user.username);
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = RefreshRequestSchema.parse(req.body);
      const token = await this.authService.refresh(refreshToken);
      res.status(200).json(AccessTokenMapper.toDTO(token));
    } catch (error) {
      next(error);
    }
  };

  verify = async (_req: Request, res: Response) => {
    res.status(204).send();
  };
}
