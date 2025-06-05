/**
 * Hiking Time Estimator Common Module
 * Shared constants and functions for popup and tooltip and calculation and display of the duration
 */

// ====== CONSTANTS AND CONFIGURATION ======

// Default user settings
const DEFAULT_SETTINGS = {
  terrain: 'backcountry',
  packWeight: 'light'
};

// Mode presets mapping
const MODE_PRESETS = {
  'day-hike': {
    terrain: 'backcountry',
    packWeight: 'light'
  },
  'backpacking': {
    terrain: 'hilly',
    packWeight: 'heavy'
  }
};

/**
 * Determine mode based on current settings
 * @param {Object} settings - Current user settings
 * @return {string} - Current mode (day-hike, backpacking, or custom)
 */
function determineCurrentMode(settings) {
  if (settings.terrain === MODE_PRESETS['day-hike'].terrain &&
      settings.packWeight === MODE_PRESETS['day-hike'].packWeight) {
    return 'day-hike';
  } else if (settings.terrain === MODE_PRESETS['backpacking'].terrain &&
             settings.packWeight === MODE_PRESETS['backpacking'].packWeight) {
    return 'backpacking';
  } else {
    return 'custom';
  }
}

/**
 * Get display name for mode
 * @param {string} mode - Mode identifier
 * @return {string} - Human-readable mode name
 */
function getDisplayModeName(mode) {
  switch(mode) {
    case 'day-hike': return 'Day Hike';
    case 'backpacking': return 'Backpacking';
    default: return 'Custom';
  }
}

/**
 * Format minutes as HH:MM
 * @param {number} minutes - Time in minutes
 * @return {string} - Formatted time string (HH:MM)
 */
function formatAsHHMM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Export functions and constants for use in other modules
window.HikingTimeEstimator = {
  DEFAULT_SETTINGS,
  MODE_PRESETS,
  determineCurrentMode,
  getDisplayModeName,
  formatAsHHMM
};
