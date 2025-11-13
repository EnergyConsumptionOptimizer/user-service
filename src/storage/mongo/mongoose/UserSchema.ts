import { Schema, model } from "mongoose";
import { UserRole } from "@domain/UserRole";
import { type UserDocument } from "./UserDocument";

const userSchema = new Schema<UserDocument>(
  {
    _id: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel = model<UserDocument>("User", userSchema);
