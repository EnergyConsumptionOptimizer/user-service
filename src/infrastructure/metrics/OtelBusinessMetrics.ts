import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import {
	userCreationsTotal,
	userDeletionsTotal,
	userLoginsTotal,
	userUpdatesTotal,
} from "./businessMetrics";

export class OtelBusinessMetrics implements BusinessMetricsPort {
	recordUserCreation(): void {
		userCreationsTotal.add(1);
	}

	recordUserUpdate(): void {
		userUpdatesTotal.add(1);
	}

	recordUserDeletion(): void {
		userDeletionsTotal.add(1);
	}

	recordUserLogin(): void {
		userLoginsTotal.add(1);
	}
}
