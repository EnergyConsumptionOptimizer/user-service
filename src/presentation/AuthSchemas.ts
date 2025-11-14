import { z } from "zod";

export const UsernameSchema = z.string().nonempty();
export const PasswordSchema = z.string().nonempty();
export const RefreshTokenSchema = z.string().nonempty();

export const LoginSchema = z.object({
  username: UsernameSchema,
  password: PasswordSchema,
});

export const RefreshRequestSchema = z.object({
  refreshToken: RefreshTokenSchema,
});
