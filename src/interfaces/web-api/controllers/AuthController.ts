import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/AuthMiddleware";
import { AuthService } from "@domain/ports/AuthService";
import { AccessToken } from "@domain/AccessToken";
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "@domain/errors/errors";
import { AccessTokenMapper } from "@presentation/AccessTokenMapper";
import { FieldRequiredError } from "@interfaces/web-api/errors/FieldRequired";
import { InvalidRequest } from "@interfaces/web-api/errors/InvalidRequest";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (request: Request, response: Response): Promise<Response> => {
    try {
      if (!request.body) return response.status(400).json(InvalidRequest);

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
        return response.status(401).json({ message: error.message });
      }

      return response.status(500).send();
    }
  };

  logout = async (request: Request, response: Response) => {
    try {
      await this.authService.logout(
        (request as AuthenticatedRequest).user.username,
      );

      return response.status(200).send();
    } catch {
      return response.status(500).send();
    }
  };

  refresh = async (request: Request, response: Response): Promise<Response> => {
    try {
      if (!request.body) return response.status(400).json(InvalidRequest);

      const { refreshToken } = request.body;

      if (!refreshToken) {
        return response.status(400).json(FieldRequiredError("Refresh token"));
      }

      const token = await this.authService.refresh(refreshToken);

      return response.status(200).json(AccessTokenMapper.toDTO(token));
    } catch (error) {
      if (error instanceof InvalidRefreshTokenError) {
        return response.status(401).json({ message: "Invalid refresh token" });
      }

      return response.status(500).send();
    }
  };

  verify = async (_request: Request, response: Response): Promise<Response> => {
    return response.status(204).send();
  };
}
