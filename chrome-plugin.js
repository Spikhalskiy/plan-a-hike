/**
 * Hiking Time Estimator Chrome Extension Content Script
 * Displays Naismith's time estimate for hiking routes on Gaia GPS
 */

// Uses shared constants and functions from chrome-plugin-common.js

// ====== STYLE INJECTION ======

// Remove inline style injection and instead inject chrome-plugin.css if not present
if (!document.querySelector('link[href$="chrome-plugin.css"]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('chrome-plugin.css');
  document.head.appendChild(link);
}

// ====== STATE MANAGEMENT ======

// User settings - will be loaded from storage
let userSettings = { ...window.HikingTimeEstimator.DEFAULT_SETTINGS };

// ====== INITIALIZATION ======

// Load user settings from storage
chrome.storage.sync.get(window.HikingTimeEstimator.DEFAULT_SETTINGS, function(items) {
  userSettings = items;
  // Initial run with loaded settings
  extractHikeStats();
});

// Listen for settings changes from popup and configuration requests
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'settingsUpdated' && request.settings) {
    userSettings = request.settings;
    extractHikeStats();
  } else if (request.action === 'getPageConfiguration') {
    // Send the current configuration settings back to the popup
    sendResponse({
      settings: userSettings
    });
    return true; // Required to use sendResponse asynchronously
  }
});

// ====== HELPER FUNCTIONS ======
/**
 * Determine mode based on current settings
 * @return {string} - Current mode (day-hike, backpacking, or custom)
 */
function determineCurrentMode() {
    if (userSettings.terrain === MODE_PRESETS['day-hike'].terrain &&
        userSettings.packWeight === MODE_PRESETS['day-hike'].packWeight) {
        return 'day-hike';
    } else if (userSettings.terrain === MODE_PRESETS['backpacking'].terrain &&
        userSettings.packWeight === MODE_PRESETS['backpacking'].packWeight) {
        return 'backpacking';
    } else {
        return 'custom';
    }
}

/**
 * Calculate hiking time details
 * @param {number} distance - Distance (mi or km)
 * @param {number} ascent - Ascent (ft or m)
 * @param {string} unitsType - 'imperial' or 'metric'
 * @return {Object} - Calculation details
 */
function calculateHikingTime(distance, ascent, unitsType) {
    const { totalBaseTime, distanceTime, ascentTime }= window.naismithBaseTime(distance, ascent, unitsType);

    const terrainCorrection = window.getTerrainCorrection(userSettings.terrain);
    const packCorrection = window.getPackCorrection(userSettings.packWeight);
    const correction = terrainCorrection + packCorrection;
    const corrected = Math.ceil(totalBaseTime * (1 + correction / 100));
    const breakTime = window.calculateBreakTime(corrected);
    const finalTime = corrected + breakTime;

    // Determine current mode
    const mode = determineCurrentMode();

    return {
        totalBaseTime,
        distanceTime,
        ascentTime,
        terrainCorrection,
        packCorrection,
        correction,
        corrected,
        breakTime,
        distance,
        ascent,
        finalTime,
        unitsType,
        mode
    };
}

/**
 * Helper to detect units from text
 * @param {string} text - Text to detect units from
 * @return {string} - Detected units type (imperial or metric)
 */
function detectUnits(text) {
  if (/km|m(?!i)/i.test(text)) return UnitsType.METRIC;
  if (/mi|ft/i.test(text)) return UnitsType.IMPERIAL;
  return UnitsType.IMPERIAL; // default to imperial
}

/**
 * Handle mode change from tooltip
 * @param {string} mode - The selected mode
 * @param {Object} calculationDetails - The calculation details with distance and ascent
 */
function handleModeChange(mode, calculationDetails) {
    const { distance, ascent } = calculationDetails;

    // Update local settings
    if (mode === 'day-hike') {
        userSettings.terrain = window.HikingTimeEstimator.MODE_PRESETS['day-hike'].terrain;
        userSettings.packWeight = window.HikingTimeEstimator.MODE_PRESETS['day-hike'].packWeight;
    } else if (mode === 'backpacking') {
        userSettings.terrain = window.HikingTimeEstimator.MODE_PRESETS['backpacking'].terrain;
        userSettings.packWeight = window.HikingTimeEstimator.MODE_PRESETS['backpacking'].packWeight;
    }

    // Save settings to Chrome storage
    chrome.storage.sync.set({
        terrain: userSettings.terrain,
        packWeight: userSettings.packWeight
    });

    // Recalculate with new settings
    const newDetails = calculateHikingTime(distance, ascent, calculationDetails.unitsType);
    // Update the tooltip text content immediately
    const textContent = document.querySelector('.hiking-estimator-tooltip div:first-child');
    if (textContent) {
        textContent.textContent = window.TooltipManager.createTooltipText(newDetails);
    }

    // Update the estimate display on the page
    extractHikeStats();
}

// ====== UI COMPONENT CREATORS ======

/**
 * Create styled duration div for displaying hiking time
 * @param {number} minutes - Final hiking time in minutes
 * @param {HTMLElement} styleSource - Element to copy styling from
 * @param {boolean} summaryMode - Whether div is for route summary page
 * @param {Object} calculationDetails - Calculation details for tooltips
 * @return {HTMLElement} - Styled duration div
 */
function createStyledDurationDiv(minutes, styleSource, summaryMode = false, calculationDetails = null) {
    // Format the time
    const timeFormatted = window.HikingTimeEstimator.formatAsHHMM(minutes);

    // Create the container div
    const div = document.createElement('div');
    div.className = 'hiking-estimator-estimate';

    // Apply appropriate styling based on mode
    if (summaryMode) {
        // Use required classes for label and time, and 18px font size for time
        div.innerHTML = `
            <span class="SummaryTrackStat-module__statLabel--g0_e7">~ Duration</span>
            <p class="MuiTypography-root MuiTypography-body1 SummaryTrackStat-module__stat--wJ0VF css-5c2nyf" 
               style="font-size: 18px;">${timeFormatted}</p>
        `;
    } else {
        // Mimic Descent div: icon #ACACAE, time 16px #000000
        div.innerHTML = `
            <span style="font-size:16px;color:#ACACAE;margin-right:2px;">⏱</span>
            <p>${timeFormatted}</p>
        `;
    }

    // Add hover tooltip if calculation details are provided
    if (calculationDetails) {
        window.TooltipManager.setupTooltipForElement(div, calculationDetails, handleModeChange);
    } else {
        window.TooltipManager.setupBasicTooltip(div, minutes);
    }

    return div;
}

/**
 * Create a duration list item for the sharing page
 * @param {Object} calculationDetails - Time calculation details
 * @return {HTMLElement} - Duration list item
 */
function createDurationListItem(calculationDetails) {
    const durationLi = document.createElement('li');
    durationLi.className = 'hiking-estimator-estimate';

    // Format time as hh:mm
    const formattedTime = window.HikingTimeEstimator.formatAsHHMM(calculationDetails.finalTime);

    // Set the content mimicking the style of the descent li
    durationLi.innerHTML = `<strong>${formattedTime}</strong><div class="Stats-module__statLabel--Jk4cC">~ Duration</div>`;

    // Add hover tooltip
    window.TooltipManager.setupTooltipForElement(durationLi, calculationDetails, handleModeChange);

    return durationLi;
}

// ====== MAIN LOGIC ======

/**
 * Main function to extract hike stats and display time estimates
 */
function extractHikeStats() {
    if (typeof window.naismithBaseTime !== 'function' || typeof window.calculateBreakTime !== 'function') return;

    // Process different page types
    processRouteEditingPage();
    processRouteSummaryPage();
    processRouteSharingPage();
}

/**
 * Process the route editing page
 */
function processRouteEditingPage() {
    const statsContainer = document.querySelector('div.Stats-module__stats--KW1GI');
    if (!statsContainer) return;

    const statDivs = statsContainer.querySelectorAll('div');
    let distance = null, ascent = null, descent = null;
    let descentDiv = null, descentStyle = null;
    let unitsType = UnitsType.IMPERIAL;

    // Extract distance, ascent, and descent values
    statDivs.forEach(div => {
        const p = div.querySelector('p');
        const span = p ? p.querySelector('span') : null;
        if (p && span) {
            const unit = span.textContent.trim().toLowerCase();
            let valueText = extractValueText(p, span);
            const valueMatch = valueText.match(/([\d,.]+)/);

            if (valueMatch) {
                const value = parseFloat(valueMatch[1].replace(/,/g, ''));
                // We really rely on the order of these divs here and nothing else.
                // But Gaia gives us nothing else atm.
                // There are no distinct CSS classes or any label to make it more robust.
                if (distance === null) {
                    distance = value;
                    unitsType = detectUnits(unit);
                } else if (ascent === null) {
                    ascent = value;
                } else if (descent === null) {
                    descent = value;
                    descentDiv = div;
                    descentStyle = span;
                }
            }
        }
    });

    // If we have all the needed values, display the estimate
    if (distance !== null && ascent !== null && descent !== null && descentDiv) {
        const calculationDetails = calculateHikingTime(distance, ascent, unitsType);

        // Remove any previous estimate
        const prev = descentDiv.parentNode.querySelector('.hiking-estimator-estimate');
        if (prev) prev.remove();

        // Insert styled duration div after descentDiv
        const estDiv = createStyledDurationDiv(calculationDetails.finalTime, descentStyle, false, calculationDetails);

        if (descentDiv.nextSibling) {
            descentDiv.parentNode.insertBefore(estDiv, descentDiv.nextSibling);
        } else {
            descentDiv.parentNode.appendChild(estDiv);
        }
    }
}

/**
 * Process the route summary page
 */
function processRouteSummaryPage() {
    const summaryContainer = document.querySelector('div.TrackDetailsSidebar-module__trackStatsContainer--tQ5rv');
    if (!summaryContainer) return;

    const statBlocks = summaryContainer.querySelectorAll('div > div');
    let distance = null, ascent = null;
    let ascentDiv = null, ascentStyle = null;
    let unitsType = UnitsType.IMPERIAL;

    // Extract distance and ascent values
    statBlocks.forEach(block => {
        const spans = block.querySelectorAll('span');
        const p = block.querySelector('p');
        if (spans.length && p) {
            const label = spans[0].textContent.trim().toLowerCase();
            let valueText = extractValueText(p, spans[1]);
            const valueMatch = valueText.match(/([\d,.]+)/);
            const unitText = spans[1] ? spans[1].textContent.trim().toLowerCase() : '';

            if (valueMatch) {
                const value = parseFloat(valueMatch[1].replace(/,/g, ''));
                if (label.includes('distance') && distance === null) {
                    distance = value;
                    unitsType = detectUnits(unitText);
                } else if (label.includes('ascent') && ascent === null) {
                    ascent = value;
                    ascentDiv = block;
                    ascentStyle = spans[1] || spans[0];
                }
            }
        }
    });

    // If we have all the needed values, display the estimate
    if (distance !== null && ascent !== null && ascentDiv) {
        const calculationDetails = calculateHikingTime(distance, ascent, unitsType);

        // Remove any previous estimate
        const prev = ascentDiv.parentNode.querySelector('.hiking-estimator-estimate');
        if (prev) prev.remove();

        // Insert styled duration div to the right of ascentDiv
        const estDiv = createStyledDurationDiv(calculationDetails.finalTime, ascentStyle, true, calculationDetails);

        ascentDiv.parentNode.insertBefore(estDiv, ascentDiv.nextSibling);
    }
}

/**
 * Process the route sharing page
 */
function processRouteSharingPage() {
    // Find all card containers on the page
    const cardContainers = document.querySelectorAll('div.Card-module__card--iAbp1');

    // Process only the card with "STATS" title
    for (const cardContainer of cardContainers) {
        const cardHeader = cardContainer.querySelector('div.Card-module__cardHeader--KHysE');
        const cardTitle = cardHeader?.querySelector('h2.Card-module__cardHeaderTitle--TW_Do');

        // Check if this is the STATS card
        if (cardTitle && cardTitle.textContent.trim() === 'STATS') {
            const statsItem = cardContainer.querySelector('div.Stats-module__statsItem--DlArF');
            const statsInfo = cardContainer.querySelector('div.Stats-module__statsInfo--jbi9I');

            if (statsItem && statsInfo) {
                // Extract stats and display estimate
                processStatsCard(statsItem, statsInfo);
            }

            // Process only the first STATS card
            break;
        }
    }
}

/**
 * Process a stats card from the route sharing page
 * @param {HTMLElement} statsItem - The stats item element
 * @param {HTMLElement} statsInfo - The stats info element
 */
function processStatsCard(statsItem, statsInfo) {
    // Extract distance from the main stats item
    let distance = null;
    let unitsType = UnitsType.IMPERIAL;
    const distanceValueDiv = statsItem.querySelector('div.Stats-module__statsItemTextValue--DE1cK');
    if (distanceValueDiv) {
        const distanceText = distanceValueDiv.textContent;
        const distanceMatch = distanceText.match(/([\d,.]+)/);
        if (distanceMatch) {
            distance = parseFloat(distanceMatch[1].replace(/,/g, ''));
            unitsType = detectUnits(distanceText);
        }
    }

    // Extract ascent and descent from the stats info
    let ascent = null, descent = null;
    const listItems = statsInfo.querySelectorAll('ul li');
    let descentLi = null;

    listItems.forEach(li => {
        const strong = li.querySelector('strong');
        const label = li.querySelector('div.Stats-module__statLabel--Jk4cC');

        if (strong && label) {
            const valueText = strong.textContent;
            const valueMatch = valueText.match(/([\d,.]+)/);
            const labelText = label.textContent.trim().toLowerCase();

            if (valueMatch) {
                const value = parseFloat(valueMatch[1].replace(/,/g, ''));
                if (labelText.includes('ascent') && ascent === null) {
                    ascent = value;
                } else if (labelText.includes('descent') && descent === null) {
                    descent = value;
                    descentLi = li;
                }
            }
        }
    });

    // If we have all the needed values, display the estimate
    if (distance !== null && ascent !== null && descent !== null && descentLi) {
        const calculationDetails = calculateHikingTime(distance, ascent, unitsType);

        // Remove any previous estimate
        const prev = statsInfo.querySelector('.hiking-estimator-estimate');
        if (prev) prev.remove();

        // Create a new li element with duration
        const durationLi = createDurationListItem(calculationDetails);

        // Add the duration li to the ul
        const ul = statsInfo.querySelector('ul');
        ul.appendChild(durationLi);
    }
}

/**
 * Extract text value from an element
 * @param {HTMLElement} element - Element containing the value
 * @param {HTMLElement} childToExclude - Child element to exclude from text
 * @return {string} - Extracted value text
 */
function extractValueText(element, childToExclude) {
    if (element.childNodes.length > 0 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
        return element.childNodes[0].textContent;
    } else if (childToExclude) {
        return element.textContent.replace(childToExclude.textContent || '', '');
    } else {
        return element.textContent;
    }
}

// Set up a debounced DOM observer to refresh stats when content changes
let debounceTimer = null;
let lastStats = '';
const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        // Only refresh if stats have changed
        const statsContainer = document.querySelector('div.Stats-module__stats--KW1GI') ||
                               document.querySelector('div.TrackDetailsSidebar-module__trackStatsContainer--tQ5rv') ||
                               document.querySelector('div.Card-module__card--iAbp1');

        let statsText = statsContainer ? statsContainer.innerText : '';

        if (statsText !== lastStats) {
            lastStats = statsText;
            extractHikeStats();
        }
    }, 400); // 400ms debounce
});

// Start observing DOM changes
observer.observe(document.body, { childList: true, subtree: true });
