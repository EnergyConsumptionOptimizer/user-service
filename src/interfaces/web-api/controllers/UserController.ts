import { type Request, type Response } from "express";
import { UserService } from "@domain/ports/UserService";
import { InvalidResetCodeError } from "@domain/errors/errors";
import { InvalidRequest } from "../errors/InvalidRequest";

export class UserController {
  constructor(private readonly userService: UserService) {}

  resetAdminPassword = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    try {
      if (!request.body) return response.status(400).json(InvalidRequest);

      const { resetCode, password } = request.body;
      if (!resetCode || !password) {
        return response
          .status(400)
          .json({ error: "Reset code and password are required" });
      }

      await this.userService.resetAdminPassword(resetCode, password);

      return response.status(204).send();
    } catch (error) {
      if (error instanceof InvalidResetCodeError) {
        return response.status(401).json({ error: error.message });
      }

      return response.status(500).send();
    }
  };
}
