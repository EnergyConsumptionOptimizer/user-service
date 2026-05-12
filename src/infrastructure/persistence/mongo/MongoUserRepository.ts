import type { User } from "@domain/entity/User";
import { UsernameAlreadyExistsError } from "@domain/errors";
import type { UserRepository } from "@domain/ports/UserRepository";
import type { UserId } from "@domain/value/UserId";
import type { Username } from "@domain/value/Username";
import type { UserRole } from "@domain/value/UserRole";
import { mongoSessionContext } from "@infrastructure/persistence/mongo/mongoSessionContext";
import {
	toDomain,
	toPersistence,
} from "@infrastructure/persistence/mongo/UserMapper";
import { UserModel } from "@infrastructure/persistence/mongo/UserSchema";
import mongoose from "mongoose";
import type { Logger } from "pino";

export class MongoUserRepository implements UserRepository {
	readonly #logger?: Logger;

	constructor(logger?: Logger) {
		this.#logger = logger;
	}

	async findById(id: UserId): Promise<User | undefined> {
		const doc = await UserModel.findById(id.value).lean().exec();
		return doc ? toDomain(doc) : undefined;
	}

	async findByUsername(username: Username): Promise<User | undefined> {
		const doc = await UserModel.findOne({ username: username.value })
			.lean()
			.exec();
		return doc ? toDomain(doc) : undefined;
	}

	async findByRole(role: UserRole): Promise<User[]> {
		const docs = await UserModel.find({ role })
			.sort({ username: 1 })
			.lean()
			.exec();
		return docs.map(toDomain);
	}

	async save(user: User): Promise<void> {
		const raw = toPersistence(user);
		const session = mongoSessionContext.getStore();

		try {
			await UserModel.replaceOne({ _id: raw._id }, raw, {
				upsert: true,
				runValidators: true,
				session,
			}).exec();
		} catch (err: unknown) {
			if (
				err instanceof mongoose.mongo.MongoServerError &&
				err.code === 11000
			) {
				this.#logger?.warn(
					{ userId: user.id.value },
					"Concurrency conflict: duplicate key on save",
				);
				throw new UsernameAlreadyExistsError();
			}

			this.#logger?.error(
				{ userId: user.id.value, err },
				"Database error on save",
			);
			throw err;
		}
	}

	async remove(user: User): Promise<void> {
		const session = mongoSessionContext.getStore();
		try {
			await UserModel.findByIdAndDelete(user.id.value, { session }).exec();
		} catch (err) {
			this.#logger?.error(
				{ userId: user.id.value, err },
				"Database error on remove",
			);
			throw err;
		}
	}
}
