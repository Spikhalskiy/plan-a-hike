/**
 * Tooltip Management for Hiking Time Estimator
 * Manages tooltip creation, positioning, and interaction
 */

// Uses shared constants and functions from chrome-plugin-common.js

// ====== CONSTANTS ======

// Tooltip configuration
const TOOLTIP_CONFIG = {
  hideDelay: 300, // milliseconds to keep tooltip visible after mouse leaves
};

// ====== STATE MANAGEMENT ======

// Tooltip state
let tooltipHideTimeout = null;

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

/**
 * Create tooltip text from calculation details
 * @param {Object} details - Calculation details from calculateHikingTime
 * @return {string} - Formatted tooltip text
 */
function createTooltipText(details) {
    const {
        totalBaseTime, distanceTime, ascentTime, terrainCorrection, packCorrection,
        breakTime, distance, ascent, finalTime, mode, unitsType
    } = details;

    const displayMode = window.HikingTimeEstimator.getDisplayModeName(mode);
    // Determine units
    const distUnit = unitsType === 'metric' ? 'km' : 'mi';
    const elevUnit = unitsType === 'metric' ? 'm' : 'ft';
    const distVal = (distance % 1 === 0) ? distance : distance.toFixed(1);
    const ascVal = (ascent % 1 === 0) ? ascent : ascent.toFixed(0);
    return `Base Naismith's time: ${window.HikingTimeEstimator.formatAsHHMM(totalBaseTime)} 
\t${distVal} ${distUnit} distance: ${window.HikingTimeEstimator.formatAsHHMM(distanceTime)}
\t${ascVal} ${elevUnit} ascent: ${window.HikingTimeEstimator.formatAsHHMM(ascentTime)}
Mode: ${displayMode}
\tTerrain correction: ${terrainCorrection}%
\tPack weight correction: ${packCorrection}%
Breaks time: ${window.HikingTimeEstimator.formatAsHHMM(breakTime)}
Final estimated hiking time: ${window.HikingTimeEstimator.formatAsHHMM(finalTime)}`;
}

/**
 * Create a mode toggle element for tooltips
 * @param {string} currentMode - Current mode
 * @param {Object} calculationDetails - Hiking time calculation details
 * @param {Function} onModeChange - Callback function when mode changes
 * @return {HTMLElement} - Mode toggle DOM element
 */
function createModeToggle(currentMode, calculationDetails, onModeChange) {
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'mode-toggle';

  // Only set mode-specific slider class if it's one of our standard modes
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

      // Update UI
      slider.className = `mode-slider ${mode}`;
      toggleContainer.querySelectorAll('.mode-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.mode === mode);
      });

      // Call the mode change callback
      if (typeof onModeChange === 'function') {
        onModeChange(mode, calculationDetails);
      }
    });
  });

  return toggleContainer;
}

/**
 * Setup detailed tooltip with calculation breakdown for an element
 * @param {HTMLElement} element - Element to attach tooltip to
 * @param {Object} calculationDetails - Time calculation details
 * @param {Function} onModeChange - Callback function when mode changes
 */
function setupTooltipForElement(element, calculationDetails, onModeChange) {
    element.addEventListener('mouseenter', () => {
        // Clear any existing content
        tooltip.innerHTML = '';

        // Create and add the text content
        const textContent = document.createElement('div');
        textContent.textContent = createTooltipText(calculationDetails);
        tooltip.appendChild(textContent);

        // Create and add the mode toggle
        const toggleElement = createModeToggle(calculationDetails.mode, calculationDetails, onModeChange);
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

// Export tooltip functions
window.TooltipManager = {
    createTooltipText,
    createModeToggle,
    setupTooltipForElement,
    setupBasicTooltip,
    showTooltipForElement,
    handleElementMouseLeave
};
