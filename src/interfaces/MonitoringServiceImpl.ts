import { MonitoringService } from "@application/port/MonitoringService";
import axios from "axios";

export class MonitoringServiceImpl implements MonitoringService {
  private readonly MONITORING_SERVICE_URI = `http://${process.env.MONITORING_SERVICE_HOST || "monitoring"}:${process.env.MONITORING_SERVICE_PORT || 3003}`;

  async removeHouseholdUserFromMeasurements(username: string): Promise<void> {
    await axios.delete(
      `${this.MONITORING_SERVICE_URI}/api/internal/measurements/household-user-tags/${username}`,
    );
  }
}
