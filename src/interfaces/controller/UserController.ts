import { type Request, type Response } from "express";
import { UserService } from "../../domain/ports/UserService";
import {
  UsernameConflictError,
  UserNotFoundError,
  InvalidIDError,
  InvalidResetCodeError,
} from "../../domain/errors/errors";
import { UserID } from "../../domain/UserID";

export class UserController {
  constructor(private readonly userService: UserService) {}

  async createHouseholdUser(
    request: Request,
    response: Response,
  ): Promise<Response> {
    try {
      const { username, password } = request.body as Record<string, string>;
      await this.userService.createHouseholdUser(username, password);

      return response
        .status(201)
        .json({ message: "User registered successfully" });
    } catch (error: unknown) {
      if (error instanceof UsernameConflictError) {
        return response.status(409).json({ message: error.message });
      }

      return response.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteUser(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params as Record<string, string>;
      await this.userService.deleteUser({ value: id });

      return response
        .status(200)
        .json({ message: `User ${id} deleted successfully` });
    } catch (error: unknown) {
      if (error instanceof UserNotFoundError) {
        return response.status(404).json({ message: error.message });
      }
      if (error instanceof InvalidIDError) {
        return response.status(400).json({ message: error.message });
      }

      return response.status(500).json({ message: "Internal server error" });
    }
  }

  async resetAdminPassword(
    request: Request,
    response: Response,
  ): Promise<Response> {
    try {
      const { resetCode, newPassword } = request.body as Record<string, string>;
      await this.userService.resetAdminPassword(resetCode, newPassword);

      return response.status(204).send();
    } catch (error: unknown) {
      if (error instanceof UserNotFoundError) {
        return response.status(404).json({ message: error.message });
      }
      if (error instanceof InvalidResetCodeError) {
        return response.status(400).json({ message: error.message });
      }

      return response.status(500).json({ message: "Internal server error" });
    }
  }

  async changePassword(
    request: Request,
    response: Response,
  ): Promise<Response> {
    try {
      const { id, newPassword } = request.body as Record<string, string>;
      const userId: UserID = { value: id };
      await this.userService.updatePassword(userId, newPassword);

      return response.status(204).send();
    } catch (error: unknown) {
      const error_ = error as Error;
      if (error_.message === "User not found") {
        return response.status(404).json({ message: error_.message });
      }

      if (error_.message === "Invalid credentials") {
        return response.status(401).json({ message: error_.message });
      }

      return response.status(500).json({ message: "Internal server error" });
    }
  }

  async changeUsername(
    request: Request,
    response: Response,
  ): Promise<Response> {
    try {
      const { id, newUsername } = request.body as Record<string, string>;
      const userId: UserID = { value: id };
      await this.userService.updateHouseholdUsername(userId, newUsername);
      return response.status(204).send();
    } catch (error: unknown) {
      const error_ = error as Error;
      if (error_.message === "User not found") {
        return response.status(404).json({ message: error_.message });
      }

      if (error_.message === "Username is already taken.") {
        return response.status(409).json({ message: error_.message });
      }

      return response.status(500).json({ message: "Internal server error" });
    }
  }

  async test(_request: Request, response: Response): Promise<Response> {
    return response.status(200).send("Test successful");
  }
}
