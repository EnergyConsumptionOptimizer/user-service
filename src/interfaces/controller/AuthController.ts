import { AuthService } from "../../domain/ports/AuthService";
import { Request, Response } from "express";
import { InvalidCredentialsError } from "../../domain/errors/errors";
import { FieldRequiredError } from "../api/errors/FieldRequired";
import { InvalidRequest } from "../api/errors/InvalidRequest";

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
      const token = await this.authService.login(username, password);
      return response.status(200).json(token);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return response.status(402).json({ message: error.message });
      }
      return response.status(400).json(InvalidRequest);
    }
  };
}
