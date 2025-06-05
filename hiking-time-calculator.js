/**
 * Hiking Time Calculator
 * Implementation of Naismith's Rule with terrain and pack weight corrections
 */

// Constants
const MINUTES_PER_MILE = 20;
const FEET_PER_EQUIVALENT_MILE = 2000;
const EQUIVALENT_MILES_PER_ASCENT = 3;
const BREAK_MINUTES_PER_HOUR = 10;

// Object mapping for terrain correction percentages
const TERRAIN_CORRECTIONS = {
    'flat': -10,
    'backcountry': 0,  // default
    'hilly': 10,
    'mountainous': 20
};

// Object mapping for pack weight correction percentages
const PACK_CORRECTIONS = {
    'light': 0,        // default (7% body weight)
    'moderate': 20,    // 14% body weight
    'heavy': 40,       // 20% body weight
    'very_heavy': 60   // 25%+ body weight
};

// UnitsType enum for imperial/metric support
const UnitsType = {
  IMPERIAL: 'imperial',
  METRIC: 'metric'
};

/**
 * Calculate base time according to Naismith's Rule
 * @param {number} distance - Distance (mi or km)
 * @param {number} elevation - Vertical gain (ft or m)
 * @param {string} unitsType - 'imperial' or 'metric'
 * @return {Object} - {totalBaseTime, distanceTime, ascentTime} Total time in minutes and it's components
 */
window.naismithBaseTime = function(distance, elevation, unitsType) {
    let dist = distance, elev = elevation;
    if (unitsType === UnitsType.METRIC) {
        dist = distance * 0.621371; // km to mi
        elev = elevation * 3.28084; // m to ft
    }
    const distanceTime = Math.ceil(MINUTES_PER_MILE * dist);
    const ascentTime = Math.ceil(MINUTES_PER_MILE * EQUIVALENT_MILES_PER_ASCENT * (elev / FEET_PER_EQUIVALENT_MILE));
    const totalBaseTime = distanceTime + ascentTime;

    return {
        totalBaseTime,
        distanceTime,
        ascentTime
    };
}

/**
 * Get correction percentage based on terrain type
 * @param {string} terrain - Terrain type (flat, backcountry, hilly, mountainous)
 * @return {number} - Correction percentage
 */
window.getTerrainCorrection = function(terrain) {
    return TERRAIN_CORRECTIONS[terrain] || 0;
};

/**
 * Get correction percentage based on pack weight
 * @param {string} pack - Pack weight category (light, moderate, heavy, very_heavy)
 * @return {number} - Correction percentage
 */
window.getPackCorrection = function(pack) {
    return PACK_CORRECTIONS[pack] || 0;
};

/**
 * Calculate break time based on hiking duration
 * @param {number} hikingTimeMinutes - Base hiking time in minutes
 * @return {number} - Break time in minutes
 */
window.calculateBreakTime = function(hikingTimeMinutes) {
    return Math.ceil(hikingTimeMinutes / 60 * BREAK_MINUTES_PER_HOUR);
};
