import { z } from "zod";

const userId = z.uuid();
const username = z.string().nonempty();
const password = z.string().nonempty();
const resetCode = z.string().nonempty();

export const UserIdParamSchema = z.object({
	params: z.object({ id: userId }),
});

export const CreateUserSchema = z.object({
	body: z.object({
		username,
		password,
	}),
});

export const UpdateUsernameSchema = z.object({
	params: z.object({ id: userId }),
	body: z.object({ username }),
});

export const UpdatePasswordSchema = z.object({
	params: z.object({ id: userId }),
	body: z.object({ password }),
});

export const ResetAdminPasswordSchema = z.object({
	body: z.object({
		resetCode,
		password,
	}),
});

export const GetUserByUsernameSchema = z.object({
	params: z.object({ username }),
});
