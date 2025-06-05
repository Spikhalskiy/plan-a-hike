/**
 * Hiking Time Estimator Chrome Extension Content Script
 * Displays Naismith's time estimate for hiking routes on Gaia GPS
 */

// ====== CONSTANTS AND CONFIGURATION ======

// Default user settings
const DEFAULT_SETTINGS = {
  terrain: 'backcountry',
  packWeight: 'moderate'
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

// Tooltip configuration
const TOOLTIP_CONFIG = {
  hideDelay: 300, // milliseconds to keep tooltip visible after mouse leaves
};

// ====== STYLE INJECTION ======

// Remove inline style injection and instead inject chrome-plugin.css if not present
if (!document.querySelector('link[href$="chrome-plugin.css"]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('chrome-plugin.css');
  document.head.appendChild(link);
}

// ====== STATE MANAGEMENT ======

// Tooltip state
let tooltipHideTimeout = null;

// User settings - will be loaded from storage
let userSettings = { ...DEFAULT_SETTINGS };

// Create tooltip element
const tooltip = document.createElement('div');
tooltip.className = 'hiking-estimator-tooltip';
document.body.appendChild(tooltip);

// ====== INITIALIZATION ======

// Add global tooltip event listeners
tooltip.addEventListener('mouseenter', () => {
    tooltip.style.display = 'block';
    if (tooltipHideTimeout) {
        clearTimeout(tooltipHideTimeout);
        tooltipHideTimeout = null;
    }
});

tooltip.addEventListener('mouseleave', () => {
    tooltipHideTimeout = setTimeout(() => {
        tooltip.style.display = 'none';
    }, TOOLTIP_CONFIG.hideDelay);
});

// Load user settings from storage
chrome.storage.sync.get(DEFAULT_SETTINGS, function(items) {
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
 * Format minutes as HH:MM
 * @param {number} minutes - Time in minutes
 * @return {string} - Formatted time string (HH:MM)
 */
function formatAsHHMM(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

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
 * Calculate hiking time details
 * @param {number} distance - Distance in miles
 * @param {number} ascent - Ascent in feet
 * @return {Object} - Object containing all calculation details
 */
function calculateHikingTime(distance, ascent) {
    // Calculate base time components
    const base = window.naismithBaseTime(distance, ascent);
    const distanceTime = 20 * distance;  // 20 min per mile
    const ascentTime = 20 * 3 * (ascent / 2000);  // 20 min × 3 × (ascent / 2000 ft)

    // Apply corrections
    const terrainCorrection = window.getTerrainCorrection(userSettings.terrain);
    const packCorrection = window.getPackCorrection(userSettings.packWeight);
    const correction = terrainCorrection + packCorrection;
    const corrected = base * (1 + correction / 100);

    // Calculate break time and final total
    const breakTime = window.calculateBreakTime(corrected);
    const final = corrected + breakTime;

    // Determine current mode
    const mode = determineCurrentMode();

    return {
        base,
        distanceTime,
        ascentTime,
        terrainCorrection,
        packCorrection,
        correction,
        corrected,
        breakTime,
        distance,
        ascent,
        final,
        mode
    };
}

/**
 * Create tooltip text from calculation details
 * @param {Object} details - Calculation details from calculateHikingTime
 * @return {string} - Formatted tooltip text
 */
function createTooltipText(details) {
    const {
        base, distanceTime, ascentTime, terrainCorrection, packCorrection,
        breakTime, distance, ascent, final, mode
    } = details;

    const displayMode = getDisplayModeName(mode);

    return `Base Naismith's time: ${formatAsHHMM(base)} 
\t${distance} mi distance: ${formatAsHHMM(distanceTime)}
\t${ascent} ft ascent: ${formatAsHHMM(ascentTime)}
Mode: ${displayMode}
\tTerrain correction: ${terrainCorrection}%
\tPack weight correction: ${packCorrection}%
Breaks time: ${formatAsHHMM(breakTime)}
Final estimated hiking time: ${formatAsHHMM(final)}`;
}

// ====== UI COMPONENT CREATORS ======

/**
 * Create a mode toggle element for tooltips
 * @param {string} currentMode - Current mode
 * @param {Object} calculationDetails - Hiking time calculation details
 * @return {HTMLElement} - Mode toggle DOM element
 */
function createModeToggle(currentMode, calculationDetails) {
  const { distance, ascent } = calculationDetails;

  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'mode-toggle';

  const slider = document.createElement('div');
  slider.className = `mode-slider ${currentMode}`;
  toggleContainer.appendChild(slider);

  const dayHikeOption = document.createElement('div');
  dayHikeOption.className = `mode-option ${currentMode === 'day-hike' ? 'active' : ''}`;
  dayHikeOption.textContent = 'Day Hike';
  dayHikeOption.dataset.mode = 'day-hike';
  toggleContainer.appendChild(dayHikeOption);

  const backpackingOption = document.createElement('div');
  backpackingOption.className = `mode-option ${currentMode === 'backpacking' ? 'active' : ''}`;
  backpackingOption.textContent = 'Backpacking';
  backpackingOption.dataset.mode = 'backpacking';
  toggleContainer.appendChild(backpackingOption);

  // Add event listeners to the toggle options
  [dayHikeOption, backpackingOption].forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const mode = option.dataset.mode;

      // Update local settings
      if (mode === 'day-hike') {
        userSettings.terrain = MODE_PRESETS['day-hike'].terrain;
        userSettings.packWeight = MODE_PRESETS['day-hike'].packWeight;
      } else if (mode === 'backpacking') {
        userSettings.terrain = MODE_PRESETS['backpacking'].terrain;
        userSettings.packWeight = MODE_PRESETS['backpacking'].packWeight;
      }
      // Mode is no longer stored explicitly - it will be derived

      // Save settings to Chrome storage
      chrome.storage.sync.set({
        terrain: userSettings.terrain,
        packWeight: userSettings.packWeight
      });

      // Update UI
      slider.className = `mode-slider ${mode}`;
      toggleContainer.querySelectorAll('.mode-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.mode === mode);
      });

      // Recalculate with new settings
      const newDetails = calculateHikingTime(distance, ascent);

      // Update the tooltip text content immediately
      const textContent = tooltip.querySelector('div:first-child');
      if (textContent) {
        textContent.textContent = createTooltipText(newDetails);
      }

      // Update the estimate display on the page
      extractHikeStats();
    });
  });

  return toggleContainer;
}

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
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    const timeFormatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    // Create the container div
    const div = document.createElement('div');
    div.className = 'hiking-estimator-estimate';

    // Apply appropriate styling based on mode
    if (summaryMode) {
        // Route summary: label above, time below, mimic ascent div style
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.marginLeft = styleSource?.style.marginLeft || '0px';
        div.style.marginTop = styleSource?.style.marginTop || '0px';

        // Use required classes for label and time, and 18px font size for time
        div.innerHTML = `
            <span class="SummaryTrackStat-module__statLabel--g0_e7">Duration</span>
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
        setupTooltipForElement(div, calculationDetails);
    } else {
        setupBasicTooltip(div, minutes);
    }

    return div;
}

/**
 * Setup detailed tooltip with calculation breakdown for an element
 * @param {HTMLElement} element - Element to attach tooltip to
 * @param {Object} calculationDetails - Time calculation details
 */
function setupTooltipForElement(element, calculationDetails) {
    element.addEventListener('mouseenter', () => {
        // Clear any existing content
        tooltip.innerHTML = '';

        // Create and add the text content
        const textContent = document.createElement('div');
        textContent.textContent = createTooltipText(calculationDetails);
        tooltip.appendChild(textContent);

        // Create and add the mode toggle
        const toggleElement = createModeToggle(calculationDetails.mode, calculationDetails);
        tooltip.appendChild(toggleElement);

        // Show and position the tooltip
        showTooltipForElement(element);
    });

    // Hide tooltip when mouse leaves both element and tooltip
    element.addEventListener('mouseleave', handleElementMouseLeave);
}

/**
 * Setup basic tooltip for an element
 * @param {HTMLElement} element - Element to attach tooltip to
 * @param {number} minutes - Time in minutes for basic info
 */
function setupBasicTooltip(element, minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    const basicTooltip = `Estimated hiking time including breaks (${h}h ${m}m)`;

    element.addEventListener('mouseenter', () => {
        tooltip.textContent = basicTooltip;
        showTooltipForElement(element);
    });

    element.addEventListener('mouseleave', handleElementMouseLeave);
}

/**
 * Show and position tooltip for an element
 * @param {HTMLElement} element - Element to show tooltip for
 */
function showTooltipForElement(element) {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    tooltip.style.display = 'block';
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom + scrollTop + 5}px`;

    if (tooltipHideTimeout) {
        clearTimeout(tooltipHideTimeout);
        tooltipHideTimeout = null;
    }
}

/**
 * Handle mouseleave event for elements with tooltips
 * @param {Event} e - Mouse event
 */
function handleElementMouseLeave(e) {
    // Only hide if not entering the tooltip
    if (!e.relatedTarget || !e.relatedTarget.closest('.hiking-estimator-tooltip')) {
        const tooltipRect = tooltip.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Check if mouse is moving to the tooltip
        if (mouseX < tooltipRect.left || mouseX > tooltipRect.right ||
            mouseY < tooltipRect.top || mouseY > tooltipRect.bottom) {
            tooltipHideTimeout = setTimeout(() => {
                tooltip.style.display = 'none';
            }, TOOLTIP_CONFIG.hideDelay);
        }
    }
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
                if (unit === 'mi' && distance === null) {
                    distance = value;
                } else if (unit === 'ft') {
                    if (ascent === null) {
                        ascent = value;
                    } else if (descent === null) {
                        descent = value;
                        descentDiv = div;
                        descentStyle = span;
                    }
                }
            }
        }
    });

    // If we have all the needed values, display the estimate
    if (distance !== null && ascent !== null && descent !== null && descentDiv) {
        const calculationDetails = calculateHikingTime(distance, ascent);

        // Remove any previous estimate
        const prev = descentDiv.parentNode.querySelector('.hiking-estimator-estimate');
        if (prev) prev.remove();

        // Insert styled duration div after descentDiv
        const estDiv = createStyledDurationDiv(calculationDetails.final, descentStyle, false, calculationDetails);

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

    // Extract distance and ascent values
    statBlocks.forEach(block => {
        const spans = block.querySelectorAll('span');
        const p = block.querySelector('p');
        if (spans.length && p) {
            const label = spans[0].textContent.trim().toLowerCase();
            let valueText = extractValueText(p, spans[1]);
            const valueMatch = valueText.match(/([\d,.]+)/);

            if (valueMatch) {
                const value = parseFloat(valueMatch[1].replace(/,/g, ''));
                if (label.includes('distance') && distance === null) {
                    distance = value;
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
        const calculationDetails = calculateHikingTime(distance, ascent);

        // Remove any previous estimate
        const prev = ascentDiv.parentNode.querySelector('.hiking-estimator-estimate');
        if (prev) prev.remove();

        // Insert styled duration div to the right of ascentDiv
        const estDiv = createStyledDurationDiv(calculationDetails.final, ascentStyle, true, calculationDetails);

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
    const distanceValueDiv = statsItem.querySelector('div.Stats-module__statsItemTextValue--DE1cK');
    if (distanceValueDiv) {
        const distanceText = distanceValueDiv.textContent;
        const distanceMatch = distanceText.match(/([\d,.]+)/);
        if (distanceMatch) {
            distance = parseFloat(distanceMatch[1].replace(/,/g, ''));
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
        const calculationDetails = calculateHikingTime(distance, ascent);

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
 * Create a duration list item for the sharing page
 * @param {Object} calculationDetails - Time calculation details
 * @return {HTMLElement} - Duration list item
 */
function createDurationListItem(calculationDetails) {
    const durationLi = document.createElement('li');
    durationLi.className = 'hiking-estimator-estimate';

    // Format time as hh:mm
    const formattedTime = formatAsHHMM(calculationDetails.final);

    // Set the content mimicking the style of the descent li
    durationLi.innerHTML = `<strong>${formattedTime}</strong><div class="Stats-module__statLabel--Jk4cC">Duration</div>`;

    // Add hover tooltip
    setupTooltipForElement(durationLi, calculationDetails);

    return durationLi;
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

