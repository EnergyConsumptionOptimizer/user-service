import type { PasswordHasher } from "@application/ports/out/PasswordHasher";
import bcrypt from "bcryptjs";
import type { Logger } from "pino";

const SALT_ROUNDS = 10;

export class BcryptPasswordHasher implements PasswordHasher {
	readonly #logger?: Logger;

	constructor(logger?: Logger) {
		this.#logger = logger;
	}

	async hash(password: string): Promise<string> {
		try {
			return await bcrypt.hash(password, SALT_ROUNDS);
		} catch (err) {
			this.#logger?.error({ err }, "bcrypt hash failure");
			throw err;
		}
	}

	async compare(plain: string, hashed: string): Promise<boolean> {
		try {
			return await bcrypt.compare(plain, hashed);
		} catch (err) {
			this.#logger?.error({ err }, "bcrypt compare failure");
			throw err;
		}
	}
}
