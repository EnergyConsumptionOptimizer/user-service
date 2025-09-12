import { AuthService } from "../../../domain/ports/AuthService";
import { Request, Response } from "express";
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "../../../domain/errors/errors";
import { FieldRequiredError } from "../errors/FieldRequired";
import { InvalidRequest } from "../errors/InvalidRequest";
import { AccessToken } from "../../../domain/AccessToken";
import { AccessTokenMapper } from "../../../presentation/AccessTokenMapper";
import { AuthenticatedRequest } from "../middleware/AuthMiddleware";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (request: Request, response: Response): Promise<Response> => {
    try {
      const { username, password } = request.body;

      if (!username) {
        return response.status(400).json(FieldRequiredError("Username"));
      }

      if (!password) {
        return response.status(400).json(FieldRequiredError("Password"));
      }
      const token: AccessToken = await this.authService.login(
        username,
        password,
      );

      return response.status(200).json(AccessTokenMapper.toDTO(token));
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return response.status(422).json({ message: error.message });
      }
      return response.status(400).json(InvalidRequest);
    }
  };

  logout = async (request: Request, res: Response) => {
    try {
      await this.authService.logout(
        (request as AuthenticatedRequest).user.username,
      );

      return res.status(200).send();
    } catch {
      return res.status(400).json(InvalidRequest);
    }
  };

  refresh = async (request: Request, res: Response): Promise<Response> => {
    try {
      const { refreshToken } = request.body;

      if (!refreshToken) {
        return res.status(400).json(FieldRequiredError("Refresh token"));
      }

      const token = await this.authService.refresh(refreshToken);

      return res.status(200).json(AccessTokenMapper.toDTO(token));
    } catch (error) {
      if (error instanceof InvalidRefreshTokenError) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }
      return res.status(400).json(InvalidRequest);
    }
  };
}
