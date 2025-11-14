import { z } from "zod";
import { UserID } from "@domain/UserID";

export const UserIDSchema = z
  .string()
  .nonempty()
  .transform((value) => ({ value }) as UserID);
export const UsernameSchema = z.string().nonempty();
export const PasswordSchema = z.string().nonempty();
export const ResetCodeSchema = z.string().nonempty();

export const CreateUserSchema = z.object({
  username: UsernameSchema,
  password: PasswordSchema,
});

export const ResetAdminPasswordSchema = z.object({
  resetCode: ResetCodeSchema,
  password: PasswordSchema,
});

export const UpdateUsernameSchema = z.object({
  username: UsernameSchema,
});
