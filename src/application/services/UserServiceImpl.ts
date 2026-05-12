import { InvalidResetCodeError, UserNotFoundError } from "@application/errors";
import type {
	ChangePasswordResponse,
	CreateUserResponse,
	DeleteUserResponse,
	GetUserByIdResponse,
	GetUserByUsernameResponse,
	ResetAdminPasswordResponse,
	UpdateUsernameResponse,
	UserOutput,
	UserService,
} from "@application/ports/in/UserService";
import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import type { EventPublisher } from "@application/ports/out/EventPublisher";
import type { IdGenerator } from "@application/ports/out/IdGenerator";
import type { PasswordHasher } from "@application/ports/out/PasswordHasher";
import type { UnitOfWork } from "@application/ports/out/UnitOfWork";
import { User } from "@domain/entity/User";
import type { InvalidPasswordError } from "@domain/errors";
import type { UserRepository } from "@domain/ports/UserRepository";
import type { UniqueUsernameChecker } from "@domain/services/UniqueUsernameChecker";
import { HashedPassword } from "@domain/value/HashedPassword";
import { PlainPassword } from "@domain/value/PlainPassword";
import { UserId } from "@domain/value/UserId";
import { Username } from "@domain/value/Username";
import { UserRoles } from "@domain/value/UserRole";

export class UserServiceImpl implements UserService {
	readonly #repository: UserRepository;
	readonly #idGenerator: IdGenerator;
	readonly #passwordHasher: PasswordHasher;
	readonly #usernamePolicy: UniqueUsernameChecker;
	readonly #resetCode: string;
	readonly #uow: UnitOfWork;
	readonly #eventPublisher: EventPublisher;
	readonly #metrics: BusinessMetricsPort;

	constructor(
		repository: UserRepository,
		idGenerator: IdGenerator,
		passwordHasher: PasswordHasher,
		usernamePolicy: UniqueUsernameChecker,
		resetCode: string,
		uow: UnitOfWork,
		eventPublisher: EventPublisher,
		metrics: BusinessMetricsPort,
	) {
		this.#repository = repository;
		this.#idGenerator = idGenerator;
		this.#passwordHasher = passwordHasher;
		this.#usernamePolicy = usernamePolicy;
		this.#resetCode = resetCode;
		this.#uow = uow;
		this.#eventPublisher = eventPublisher;
		this.#metrics = metrics;
	}

	async createHouseholdUser(args: {
		readonly username: string;
		readonly password: string;
	}): Promise<CreateUserResponse> {
		const username = Username.of(args.username);
		if (username instanceof Error) return username;

		const uniquenessResult =
			await this.#usernamePolicy.ensureAvailable(username);
		if (uniquenessResult instanceof Error) return uniquenessResult;

		const newHashedPassword = await this.#createHashedPassword(args.password);
		if (newHashedPassword instanceof Error) return newHashedPassword;

		const id = UserId.of(this.#idGenerator.generate());
		if (id instanceof Error) return id;

		const user = User.create(
			id,
			username,
			newHashedPassword,
			UserRoles.HOUSEHOLD,
		);

		// Outbox Pattern
		await this.#uow.executeTransactionally(async () => {
			await this.#repository.save(user);
			for (const event of user.pullDomainEvents()) {
				await this.#eventPublisher.publish(event);
			}
		});

		this.#metrics.recordUserCreation();
		return toOutput(user);
	}

	async getUser(args: { readonly id: string }): Promise<GetUserByIdResponse> {
		const userId = UserId.of(args.id);
		if (userId instanceof Error) return userId;

		const user = await this.#repository.findById(userId);
		if (!user) return new UserNotFoundError();

		return toOutput(user);
	}

	async getUserByUsername(args: {
		readonly username: string;
	}): Promise<GetUserByUsernameResponse> {
		const username = Username.of(args.username);
		if (username instanceof Error) return username;

		const user = await this.#repository.findByUsername(username);
		if (!user) return new UserNotFoundError();

		return toOutput(user);
	}

	async getHouseholdUsers(): Promise<UserOutput[]> {
		const users = await this.#repository.findByRole(UserRoles.HOUSEHOLD);
		return users.map(toOutput);
	}

	async updateUsername(args: {
		readonly id: string;
		readonly newUsername: string;
	}): Promise<UpdateUsernameResponse> {
		const userId = UserId.of(args.id);
		if (userId instanceof Error) return userId;

		const user = await this.#repository.findById(userId);
		if (!user) return new UserNotFoundError();

		const newUsername = Username.of(args.newUsername);
		if (newUsername instanceof Error) return newUsername;

		const uniquenessResult = await this.#usernamePolicy.ensureAvailable(
			newUsername,
			userId,
		);
		if (uniquenessResult instanceof Error) return uniquenessResult;

		user.changeUsername(newUsername);

		// Outbox Pattern
		await this.#uow.executeTransactionally(async () => {
			await this.#repository.save(user);
			for (const event of user.pullDomainEvents()) {
				await this.#eventPublisher.publish(event);
			}
		});

		this.#metrics.recordUserUpdate();
		return toOutput(user);
	}

	async deleteHouseholdUser(args: {
		readonly id: string;
	}): Promise<DeleteUserResponse> {
		const userId = UserId.of(args.id);
		if (userId instanceof Error) return userId;

		const user = await this.#repository.findById(userId);
		if (!user) return new UserNotFoundError();

		user.prepareForDeletion();

		// Outbox Pattern
		await this.#uow.executeTransactionally(async () => {
			await this.#repository.remove(user);
			for (const event of user.pullDomainEvents()) {
				await this.#eventPublisher.publish(event);
			}
		});
		this.#metrics.recordUserDeletion();
		return undefined;
	}

	async changePassword(args: {
		readonly id: string;
		readonly newPassword: string;
	}): Promise<ChangePasswordResponse> {
		const userId = UserId.of(args.id);
		if (userId instanceof Error) return userId;

		const user = await this.#repository.findById(userId);
		if (!user) return new UserNotFoundError();

		const newHashedPassword = await this.#createHashedPassword(
			args.newPassword,
		);
		if (newHashedPassword instanceof Error) return newHashedPassword;

		user.changePassword(newHashedPassword);
		await this.#repository.save(user);
		this.#metrics.recordUserUpdate();
		return toOutput(user);
	}

	async resetAdminPassword(args: {
		readonly resetCode: string;
		readonly newPassword: string;
	}): Promise<ResetAdminPasswordResponse> {
		if (args.resetCode !== this.#resetCode) return new InvalidResetCodeError();

		const admins = await this.#repository.findByRole(UserRoles.ADMIN);
		if (!admins) return new UserNotFoundError();

		// Only one admin account can exist in this service
		const admin = admins.pop();
		if (!admin) return new UserNotFoundError();

		const newHashedPassword = await this.#createHashedPassword(
			args.newPassword,
		);
		if (newHashedPassword instanceof Error) return newHashedPassword;

		admin.changePassword(newHashedPassword);
		await this.#repository.save(admin);

		this.#metrics.recordUserUpdate();
		return undefined;
	}

	async #createHashedPassword(
		password: string,
	): Promise<HashedPassword | InvalidPasswordError> {
		const plainTextPassword = PlainPassword.of(password);
		if (plainTextPassword instanceof Error) return plainTextPassword;
		const hashedValue = await this.#passwordHasher.hash(
			plainTextPassword.value,
		);
		const hashedPassword = HashedPassword.of(hashedValue);
		if (hashedPassword instanceof Error) return hashedPassword;
		return hashedPassword;
	}
}

function toOutput(user: User): UserOutput {
	return {
		id: user.id.value,
		username: user.username.value,
		role: user.role,
	};
}
