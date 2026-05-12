import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import type { EventPublisher } from "@application/ports/out/EventPublisher";
import type { IdGenerator } from "@application/ports/out/IdGenerator";
import type { PasswordHasher } from "@application/ports/out/PasswordHasher";
import type { TokenService } from "@application/ports/out/TokenService";
import type { UnitOfWork } from "@application/ports/out/UnitOfWork";
import { AuthServiceImpl } from "@application/services/AuthServiceImpl";
import { UserServiceImpl } from "@application/services/UserServiceImpl";
import { createApp } from "@bootstrap/app.js";
import { config } from "@bootstrap/config.js";
import { seedUsers } from "@bootstrap/seedUsers.js";
import { UsernameUniquenessPolicy } from "@domain/services/UsernameUniquenessPolicy";
import { BcryptPasswordHasher } from "@infrastructure/auth/BcryptPasswordHasher";
import { JwtTokenService } from "@infrastructure/auth/JwtTokenService";
import { MongoOutboxEventPublisher } from "@infrastructure/events/MongoOutboxEventPublisher";
import { OtelBusinessMetrics } from "@infrastructure/metrics/OtelBusinessMetrics";
import { MongoUnitOfWork } from "@infrastructure/persistence/mongo/MongoUnitOfWork";
import { MongoUserRepository } from "@infrastructure/persistence/mongo/MongoUserRepository";
import { NodeCryptoIdGenerator } from "@infrastructure/utils/NodeCryptoIdGenerator";
import { AuthController } from "@presentation/rest/controllers/AuthController";
import { UserController } from "@presentation/rest/controllers/UserController";
import { createMainRouter } from "@presentation/rest/createMainRouter.js";
import { createTokenAuth } from "@presentation/rest/middleware/auth";
import type { Logger } from "pino";

interface InfrastructureAdapters {
	readonly mongoUserRepository: MongoUserRepository;
	readonly tokenService: TokenService;
	readonly passwordHasher: PasswordHasher;
	readonly idGenerator: IdGenerator;
	readonly uow: UnitOfWork;
	readonly eventPublisher: EventPublisher;
	readonly businessMetrics: BusinessMetricsPort;
}

function createInfrastructureAdapters(
	logger: Logger,
	businessMetrics?: BusinessMetricsPort,
): InfrastructureAdapters {
	return {
		mongoUserRepository: new MongoUserRepository(
			logger.child({ component: "MongoUserRepository" }),
		),
		tokenService: new JwtTokenService(
			config.jwt.secret,
			config.jwt.expiresIn,
			config.jwt.refreshExpiresIn,
		),
		passwordHasher: new BcryptPasswordHasher(),
		idGenerator: new NodeCryptoIdGenerator(),
		uow: new MongoUnitOfWork(),
		eventPublisher: new MongoOutboxEventPublisher(),
		businessMetrics: businessMetrics ?? new OtelBusinessMetrics(),
	};
}

export async function composeApp(
	logger: Logger,
	businessMetrics?: BusinessMetricsPort,
): Promise<{ app: ReturnType<typeof createApp> }> {
	const infra = createInfrastructureAdapters(logger, businessMetrics);
	const {
		mongoUserRepository,
		tokenService,
		passwordHasher,
		idGenerator,
		uow,
		eventPublisher,
		businessMetrics: metrics,
	} = infra;

	if (!config.skipSeed) {
		await seedUsers(
			mongoUserRepository,
			passwordHasher,
			idGenerator,
			logger.child({ component: "SeedUsers" }),
			config.seedUsers,
		);
	}

	const usernamePolicy = new UsernameUniquenessPolicy(mongoUserRepository);

	const authService = new AuthServiceImpl(
		mongoUserRepository,
		passwordHasher,
		tokenService,
		metrics,
	);
	const userService = new UserServiceImpl(
		mongoUserRepository,
		idGenerator,
		passwordHasher,
		usernamePolicy,
		config.resetCode,
		uow,
		eventPublisher,
		metrics,
	);

	const tokenAuth = createTokenAuth(tokenService);

	const userController = new UserController(userService);
	const authController = new AuthController(authService);

	const mainRouter = createMainRouter(
		userController,
		authController,
		tokenAuth,
	);
	const app = createApp(mainRouter, logger);

	return { app };
}
