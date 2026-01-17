import { Injectable } from '@angular/core';
import { ApplicationService } from '../services/application.service';
import { POLLING_INTERVALS } from '../../shared/constants';

/**
 * ConnectionService
 * Handles connection monitoring and time updates
 */
@Injectable()
export class ConnectionService {
  date: number;
  connectionStatus: boolean;
  private intervalId: any;

  constructor(private applicationService: ApplicationService) {
    this.date = Date.now();
    this.connectionStatus = false;
  }

  /**
   * Starts connectivity and time polling
   */
  startMonitoring() {
    this.intervalId = setInterval(() => {
      this.date = Date.now();
      this.connectionStatus = this.applicationService.connectionStatus();
    }, POLLING_INTERVALS.CONNECTION_CHECK);
  }

  /**
   * Stops monitoring (cleanup)
   */
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Gets current date timestamp
   */
  getDate(): number {
    return this.date;
  }

  /**
   * Gets current connection status
   */
  getConnectionStatus(): boolean {
    return this.connectionStatus;
  }
}
