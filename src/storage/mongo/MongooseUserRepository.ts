import { v4 as uuidv4, validate } from "uuid";
import { type UserRepository } from "../../domain/ports/UserRepository";
import { type User } from "../../domain/User";
import { UserID } from "../../domain/UserID";
import { UserModel } from "./mongoose/UserSchema";
import { type UserDocument } from "./mongoose/UserDocument";
import { UserRole } from "../../domain/UserRole";
import { MongoError } from "mongodb";
import {
  UsernameConflictError,
  UserNotFoundError,
} from "../../domain/errors/errors";

export class MongooseUserRepository implements UserRepository {
  async findAllHouseholdUsers(): Promise<User[]> {
    const userDocuments = await UserModel.find({ role: UserRole.HOUSEHOLD })
      .lean()
      .exec();
    return userDocuments.map((userDoc) =>
      this.mapUserDocumentToDomain(userDoc),
    );
  }

  async findUserByUsername(username: string): Promise<User | null> {
    try {
      const userDocument = await UserModel.findOne({ username }).exec();
      return userDocument ? this.mapUserDocumentToDomain(userDocument) : null;
    } catch {
      return null;
    }
  }

  async findUserById(id: UserID): Promise<User | null> {
    this.validateUserID(id.value);

    const userDocument = await UserModel.findById(id.value).lean().exec();

    if (!userDocument) {
      return null;
    }

    return this.mapUserDocumentToDomain(userDocument);
  }

  async findHouseholdUserById(id: UserID): Promise<User | null> {
    this.validateUserID(id.value);

    const userDocument = await UserModel.findOne({
      _id: id.value,
      role: UserRole.HOUSEHOLD,
    })
      .lean()
      .exec();

    if (!userDocument) {
      return null;
    }

    return this.mapUserDocumentToDomain(userDocument);
  }

  async addNewHouseholdUser(user: User): Promise<User> {
    const id = uuidv4();

    const userDocument = new UserModel({
      ...user,
      _id: id,
    });

    try {
      return this.mapUserDocumentToDomain(await userDocument.save());
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
      ).exec();
    } catch (error) {
      if ((error as MongoError).code === 11000) {
        throw new UsernameConflictError(user.username);
      }
      throw error;
    }

    if (!updatedDocument) {
      throw new UserNotFoundError();
    }

    return this.mapUserDocumentToDomain(updatedDocument);
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

  private mapUserDocumentToDomain(document: UserDocument): User {
    return {
      id: { value: document._id },
      username: document.username,
      password: document.password,
      role: document.role,
    };
  }

  private validateUserID(value: string) {
    if (!validate(value)) {
      throw new Error(`Invalid user ID format: ${value}`);
    }
  }
}
