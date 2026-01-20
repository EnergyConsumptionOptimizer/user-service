export interface MonitoringService {
  removeHouseholdUserFromMeasurements(username: string): Promise<void>;
}
