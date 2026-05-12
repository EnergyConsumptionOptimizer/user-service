export type PlainTextPassword = string;
export type HashedPasswordString = string;

export interface PasswordHasher {
	hash(password: PlainTextPassword): Promise<HashedPasswordString>;
	compare(
		plain: PlainTextPassword,
		hashed: HashedPasswordString,
	): Promise<boolean>;
}
