import { AuthService } from "../../domain/ports/AuthService";
import { Request, Response } from "express";
import { InvalidCredentialsError } from "../../domain/errors/errors";

export class UserController {
  constructor(private readonly authService: AuthService) {}

  async login(
    request: Request<string, string>,
    response: Response,
  ): Promise<Response> {
    try {
      const { username, password } = request.body;
      const tokens = await this.authService.login(username, password);
      return response.status(200).json(tokens);
    } catch (error: unknown) {
      if (error instanceof InvalidCredentialsError) {
        return response.status(401).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal server error" });
    }
  }
}
