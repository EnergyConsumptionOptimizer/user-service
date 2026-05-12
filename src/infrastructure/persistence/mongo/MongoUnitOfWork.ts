import type { UnitOfWork } from "@application/ports/out/UnitOfWork";
import { mongoSessionContext } from "@infrastructure/persistence/mongo/mongoSessionContext";
import mongoose from "mongoose";

export class MongoUnitOfWork implements UnitOfWork {
	async executeTransactionally<T>(operation: () => Promise<T>): Promise<T> {
		const session = await mongoose.startSession();

		try {
			return await session.withTransaction(() =>
				mongoSessionContext.run(session, operation),
			);
		} finally {
			await session.endSession();
		}
	}
}
