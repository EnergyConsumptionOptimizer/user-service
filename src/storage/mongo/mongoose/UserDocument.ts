import { type Document } from "mongoose";
import { type UserRole } from "@domain/UserRole";

export interface UserDocument extends Document {
  readonly _id: string;
  readonly username: string;
  readonly password: string;
  readonly role: UserRole;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
