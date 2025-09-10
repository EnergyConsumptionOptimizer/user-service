import { type Request, type Response } from "express";
import { UserService } from "../../domain/ports/UserService";
import {
  UsernameConflictError,
  UserNotFoundError,
  InvalidResetCodeError,
} from "../../domain/errors/errors";
import { UserID } from "../../domain/UserID";

export class UserController {
  constructor(private readonly userService: UserService) {}

  getHouseholdUsers = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    try {
      const householdUsers = await this.userService.getHouseholdUsers();
      return response.json({
        "household-users": householdUsers,
      });
    } catch {
      return response.status(500).send();
    }
  };

  createHouseholdUser = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    try {
      const { username, password } = request.body;
      if (!username || !password) {
        return response
          .status(400)
          .json({ error: "Username and password are required" });
      }
      await this.userService.createHouseholdUser(username, password);
      return response
        .status(201)
        .json({ message: "User registered successfully" });
    } catch (error) {
      if (error instanceof UsernameConflictError) {
        return response.status(409).json({ message: error.message });
      }
      return response.status(400).json();
    }
  };

  getUser = async (request: Request, response: Response): Promise<Response> => {
    try {
      const { id } = request.params;
      const userId: UserID = { value: id };

      const user = await this.userService.getUser(userId);

      if (!user) {
        return response.status(404).json({ error: "User not found" });
      }

      return response.json(user);
    } catch {
      return response.status(500).send();
    }
  };

  deleteUser = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    try {
      const { id } = request.params as Record<string, string>;
      await this.userService.deleteUser({ value: id });

      return response
        .status(206)
        .json({ message: `User ${id} deleted successfully` });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return response.status(404).json({ message: error.message });
      }

      return response.status(400).json();
    }
  };

  resetAdminPassword = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    try {
      const { resetCode, newPassword } = request.body as Record<string, string>;
      if (!resetCode || !newPassword) {
        return response
          .status(400)
          .json({ error: "Reset code and password are required" });
      }

      await this.userService.resetAdminPassword(resetCode, newPassword);
      return response.status(204).send();
    } catch (error) {
      if (error instanceof InvalidResetCodeError) {
        return response.status(409).json({ message: error.message });
      }

      return response.status(400).json();
    }
  };

  updatePassword = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    try {
      const { id, newPassword } = request.body as Record<string, string>;
      const userId: UserID = { value: id };
      if (!newPassword) {
        return response.status(400).json({ error: "Password is required" });
      }
      await this.userService.updatePassword(userId, newPassword);
      return response.status(204).send();
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return response.status(404).json({ message: error.message });
      }

      return response.status(400).json();
    }
  };

  updateUsername = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    try {
      const { id, newUsername } = request.body as Record<string, string>;
      const userId: UserID = { value: id };
      await this.userService.updateHouseholdUsername(userId, newUsername);
      return response.status(204).send();
    } catch (error: unknown) {
      if (error instanceof UserNotFoundError) {
        return response.status(404).json({ message: error.message });
      }
      if (error instanceof UsernameConflictError) {
        return response.status(409).json({ message: error.message });
      }

      return response.status(500).json({ message: "Internal server error" });
    }
  };

  test = async (_request: Request, response: Response): Promise<Response> => {
    return response.status(200).send("Test successful");
  };
}
