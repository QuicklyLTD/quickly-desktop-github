/**
 * Application-wide constants
 * Centralizes magic numbers and string literals for better maintainability
 */

/**
 * Polling intervals in milliseconds
 */
export const POLLING_INTERVALS = {
  CONNECTION_CHECK: 5000,          // 5 seconds - connection status check
  ACTIVITY_REPORT_UPDATE: 360000,  // 6 minutes - activity report update
  DATE_TIME_UPDATE: 1000,          // 1 second - date/time display update
  SETTINGS_RELOAD_DELAY: 5000,     // 5 seconds - delay before reloading on settings change
  END_DAY_LISTENER_DELAY: 120000   // 2 minutes - delay before starting end day listener
};

export const SERVER_TYPES = {
  PRIMARY: 0,
  SECONDARY: 1
};

/**
 * Server status constants
 */
export const SERVER_STATUS = {
  INACTIVE: 0,
  ACTIVE: 1
};

/**
 * Setup progress delays in milliseconds
 */
export const SETUP_DELAYS = {
  PROGRESS_BAR_TICK: 200,     // Progress bar update interval
  RELOAD_AFTER_SETUP: 3000,   // Delay before reloading after setup complete
  RELAUNCH_AFTER_SYNC: 30000  // Delay before relaunching after sync complete
};

/**
 * Replication configuration
 */
export const REPLICATION_CONFIG = {
  BATCH_SIZE: 500,
  BATCHES_LIMIT: 50,
  TIMEOUT: 60000,  // 60 seconds
  HEARTBEAT: 2500,
  BACKOFF_DELAY: 1000
};
