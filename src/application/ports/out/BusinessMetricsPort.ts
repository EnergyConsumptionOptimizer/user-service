export interface BusinessMetricsPort {
	recordUserCreation(): void;
	recordUserUpdate(): void;
	recordUserDeletion(): void;
	recordUserLogin(): void;
}
