import { type Request, type Response } from "express";
import { UserService } from "@domain/ports/UserService";
import {
  InvalidResetCodeError,
  UsernameConflictError,
  UserNotFoundError,
} from "@domain/errors/errors";
import { UserID } from "@domain/UserID";
import { UserMapper } from "@presentation/UserMapper";
import { UserNotFound } from "../errors/UserNotFound";
import { FieldRequiredError } from "../errors/FieldRequired";
import { InvalidRequest } from "../errors/InvalidRequest";

export class UserController {
  constructor(private readonly userService: UserService) {}

  getHouseholdUsers = async (
    _request: Request,
    response: Response,
  ): Promise<Response> => {
    try {
      const householdUsers = await this.userService.getHouseholdUsers();

      return response.json({
        "household-users": householdUsers.map((user) => UserMapper.toDTO(user)),
      });
    } catch {
      return response.status(500).send();
    }
  };

  getUser = async (request: Request, response: Response): Promise<Response> => {
    try {
      const { id } = request.params;
      const userId: UserID = { value: id };

      const user = await this.userService.getUser(userId);

      if (!user) {
        return response.status(404).json(UserNotFound);
      }

      return response.json(UserMapper.toDTO(user));
    } catch {
      return response.status(500).send();
    }
  };

  createHouseholdUser = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    try {
      if (!request.body) return response.status(400).json(InvalidRequest);

      const { username, password } = request.body;

      if (!username || !password) {
        return response
          .status(400)
          .json({ error: "Username and password are required" });
      }

      const user = await this.userService.createHouseholdUser(
        username,
        password,
      );

      return response.status(201).json(UserMapper.toDTO(user));
    } catch (error) {
      if (error instanceof UsernameConflictError) {
        return response.status(409).json({ error: error.message });
      }
      return response.status(500).send();
    }
  };

  updatePassword = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    try {
      if (!request.body) return response.status(400).json(InvalidRequest);

      const { password } = request.body;
      const { id } = request.params;
      const userId: UserID = { value: id };

      if (!password) {
        return response.status(400).json(FieldRequiredError("password"));
      }

      const user = await this.userService.updatePassword(userId, password);

      return response.json(UserMapper.toDTO(user));
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return response.status(404).json({ error: error.message });
      }

      return response.status(500).send();
    }
  };

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

  updateUsername = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    try {
      if (!request.body) return response.status(400).json(InvalidRequest);
      const { id } = request.params;
      const { username } = request.body;

      if (!username) {
        return response.status(400).json(FieldRequiredError("username"));
      }

      const userId: UserID = { value: id };

      const user = await this.userService.updateHouseholdUsername(
        userId,
        username,
      );

      return response.json(UserMapper.toDTO(user));
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return response.status(404).json({ error: error.message });
      }
      if (error instanceof UsernameConflictError) {
        return response.status(409).json({ error: error.message });
      }

      return response.status(500).send();
    }
  };

  deleteHouseholdUser = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    try {
      const { id } = request.params;
      await this.userService.deleteHouseholdUser({ value: id });

      return response
        .status(204)
        .json({ message: "User deleted successfully" });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return response.status(404).json({ error: error.message });
      }

      return response.status(500).send();
    }
  };
}
