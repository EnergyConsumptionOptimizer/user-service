import { type UserRole, UserRoles } from "@domain/value/UserRole";
import mongoose, { Schema } from "mongoose";

export interface UserDoc {
	_id: string;
	username: string;
	password: string;
	role: UserRole;
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
	{
		_id: { type: String, required: true },
		username: { type: String, required: true, unique: true, trim: true },
		password: { type: String, required: true },
		role: { type: String, enum: Object.values(UserRoles), required: true },
	},
	{ timestamps: true, versionKey: false },
);

export const UserModel = mongoose.model<UserDoc>("User", UserSchema, "users");
