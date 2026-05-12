import type { PasswordHasher } from "@application/ports/out/PasswordHasher";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export class BcryptPasswordHasher implements PasswordHasher {
	async hash(password: string): Promise<string> {
		return bcrypt.hash(password, SALT_ROUNDS);
	}

	async compare(plain: string, hashed: string): Promise<boolean> {
		return bcrypt.compare(plain, hashed);
	}
}
