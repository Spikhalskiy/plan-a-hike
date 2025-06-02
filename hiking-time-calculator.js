// Calculation logic for Naismith's Rule and corrections
window.naismithBaseTime = function(distance, elevation) {
    // Naismith's Rule: 20 min per mile, 2000 ft = 3 miles
    // base = 20 * distance + 20 * 3 * (elevation / 2000)
    return 20 * distance + 20 * 3 * (elevation / 2000);
};
window.getTerrainCorrection = function(terrain) {
    switch (terrain) {
        case 'flat': return -10;
        case 'hilly': return 10;
        case 'mountainous': return 20;
        default: return 0;
    }
};
window.getPackCorrection = function(pack) {
    switch (pack) {
        case 'moderate': return 20;
        case 'heavy': return 40;
        case 'very_heavy': return 60;
        default: return 0;
    }
};

