import { z } from "zod";

const username = z.string().nonempty();
const password = z.string().nonempty();

export const LoginSchema = z.object({
	body: z.object({
		username,
		password,
	}),
});
