import { NextFunction, Request, Response } from "express";
import { UserService } from "@domain/ports/UserService";
import { UserNotFoundError } from "@domain/errors/errors";
import { UserMapper } from "@presentation/UserMapper";
import {
  UserIDSchema,
  PasswordSchema,
  ResetAdminPasswordSchema,
  CreateUserSchema,
  UpdateUsernameSchema,
  UsernameSchema,
} from "@presentation/UserSchemas";

export class UserController {
  constructor(private readonly userService: UserService) {}

  getHouseholdUsers = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const users = await this.userService.getHouseholdUsers();
      res.status(200).json({
        "household-users": users.map(UserMapper.toDTO),
      });
    } catch (error) {
      next(error);
    }
  };

  getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = UserIDSchema.parse(req.params.id);
      const user = await this.userService.getUser(id);

      if (!user) return next(new UserNotFoundError());
      res.status(200).json(UserMapper.toDTO(user));
    } catch (error) {
      next(error);
    }
  };

  getUserFromUsername = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const username = UsernameSchema.parse(req.params.username);

      const user = await this.userService.getUserByUsername(username);

      if (!user) return next(new UserNotFoundError());

      return res.json(UserMapper.toDTO(user));
    } catch (error) {
      next(error);
    }
  };

  createHouseholdUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { username, password } = CreateUserSchema.parse(req.body);
      const user = await this.userService.createHouseholdUser(
        username,
        password,
      );
      res.status(201).json(UserMapper.toDTO(user));
    } catch (error) {
      next(error);
    }
  };

  updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = UserIDSchema.parse(req.params.id);
      const password = PasswordSchema.parse(req.body.password);
      const user = await this.userService.updatePassword(id, password);
      res.status(200).json(UserMapper.toDTO(user));
    } catch (error) {
      next(error);
    }
  };

  resetAdminPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { resetCode, password } = ResetAdminPasswordSchema.parse(req.body);
      await this.userService.resetAdminPassword(resetCode, password);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  updateUsername = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = UserIDSchema.parse(req.params.id);
      const { username } = UpdateUsernameSchema.parse(req.body);
      const updated = await this.userService.updateHouseholdUsername(
        id,
        username,
      );
      res.status(200).json(UserMapper.toDTO(updated));
    } catch (error) {
      next(error);
    }
  };

  deleteHouseholdUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const id = UserIDSchema.parse(req.params.id);
      await this.userService.deleteHouseholdUser(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
