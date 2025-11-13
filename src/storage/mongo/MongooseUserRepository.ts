import { v4 as uuidv4, validate } from "uuid";
import { type User } from "@domain/User";
import { UserID } from "@domain/UserID";
import { UserModel } from "./mongoose/UserSchema";
import { UserRole } from "@domain/UserRole";
import { MongoError } from "mongodb";
import {
  InvalidIDError,
  UsernameConflictError,
  UserNotFoundError,
} from "@domain/errors/errors";
import { FlattenMaps } from "mongoose";
import { UserDocument } from "./mongoose/UserDocument";
import { UserRepository } from "@domain/ports/UserRepository";

export class MongooseUserRepository implements UserRepository {
  async findAllHouseholdUsers(): Promise<User[]> {
    const userDocuments = await UserModel.find({ role: UserRole.HOUSEHOLD })
      .lean()
      .exec();
    return userDocuments.map(this.mapToUser);
  }

  async findUserByUsername(username: string): Promise<User | null> {
    const userDocument = await UserModel.findOne({ username }).lean().exec();
    return userDocument ? this.mapToUser(userDocument) : null;
  }

  async findUserById(id: UserID): Promise<User | null> {
    this.validateUserID(id.value);

    const userDocument = await UserModel.findById(id.value).lean().exec();

    return userDocument ? this.mapToUser(userDocument) : null;
  }

  async findHouseholdUserById(id: UserID): Promise<User | null> {
    this.validateUserID(id.value);

    const userDocument = await UserModel.findOne({
      _id: id.value,
      role: UserRole.HOUSEHOLD,
    })
      .lean()
      .exec();

    return userDocument ? this.mapToUser(userDocument) : null;
  }

  async saveNewHouseholdUser(user: User): Promise<User> {
    const id = uuidv4();

    const userDocument = new UserModel({
      _id: id,
      username: user.username,
      password: user.password,
      role: user.role,
    });

    try {
      return this.mapToUser(await userDocument.save());
    } catch (error) {
      if ((error as MongoError).code === 11000) {
        throw new UsernameConflictError(user.username);
      }
      throw error;
    }
  }

  async updateUser(user: User): Promise<User> {
    this.validateUserID(user.id.value);

    let updatedDocument;

    try {
      updatedDocument = await UserModel.findByIdAndUpdate(
        user.id.value,
        {
          username: user.username,
          password: user.password,
        },
        { new: true, runValidators: true },
      )
        .lean()
        .exec();
    } catch (error) {
      if ((error as MongoError).code === 11000) {
        throw new UsernameConflictError(user.username);
      }
      throw error;
    }

    if (!updatedDocument) {
      throw new UserNotFoundError();
    }

    return this.mapToUser(updatedDocument);
  }

  async removeHouseholdUser(id: UserID): Promise<void> {
    this.validateUserID(id.value);

    const result = await UserModel.findOneAndDelete({
      _id: id.value,
      role: UserRole.HOUSEHOLD,
    }).exec();

    if (!result) {
      throw new UserNotFoundError();
    }
  }

  private mapToUser(
    document:
      | (FlattenMaps<UserDocument> & Required<{ _id: string }>)
      | UserDocument,
  ): User {
    return {
      id: { value: document._id.toString() },
      username: document.username,
      password: document.password,
      role: document.role,
    };
  }

  private validateUserID(value: string) {
    if (!validate(value)) {
      throw new InvalidIDError();
    }
  }
}
