// Hiking Time Estimator Chrome Extension Content Script
// Looks for hike summary divs and displays Naismith's time estimate

// Inject CSS for custom tooltip
const tooltipStyle = document.createElement('style');
tooltipStyle.textContent = `
.naismith-tooltip {
  position: absolute;
  background-color: white;
  color: black;
  border-radius: 6px;
  padding: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 1000;
  max-width: 300px;
  white-space: pre;
  font-size: 14px;
  font-family: Arial, sans-serif;
  display: none;
  pointer-events: none;
  tab-size: 4;
}
`;
document.head.appendChild(tooltipStyle);

// Create tooltip element
const tooltip = document.createElement('div');
tooltip.className = 'naismith-tooltip';
document.body.appendChild(tooltip);

// Default settings
let userSettings = {
  terrain: 'backcountry',
  packWeight: 'moderate'
};

// Load user settings from storage
chrome.storage.sync.get({
  terrain: 'backcountry',
  packWeight: 'moderate'
}, function(items) {
  userSettings = items;
  // Initial run with loaded settings
  extractHikeStats();
});

// Listen for settings changes from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'settingsUpdated' && request.settings) {
    userSettings = request.settings;
    extractHikeStats();
  }
});

// --- Main logic ---
// Helper function to format minutes as hh:mm
function formatAsHHMM(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function createStyledDurationDiv(minutes, styleSource, summaryMode = false, calculationDetails = null) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    const div = document.createElement('div');
    div.className = 'naismith-estimate';
    if (summaryMode) {
        // Route summary: label above, time below, mimic ascent div style
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.marginLeft = styleSource?.style.marginLeft || '16px';
        div.style.marginTop = styleSource?.style.marginTop || '0px';
        // Use required classes for label and time, and 18px font size for time
        div.innerHTML = `<span class="SummaryTrackStat-module__statLabel--g0_e7">Duration</span><p class="MuiTypography-root MuiTypography-body1 SummaryTrackStat-module__stat--wJ0VF css-5c2nyf" style="font-size: 18px;">${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}</p>`;
    } else {
        // Route editing: icon grey, time big, mimic descent div style
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.marginLeft = styleSource?.style.marginLeft || '12px';
        // Mimic Descent div: icon #ACACAE, time 16px #000000
        div.innerHTML = `<span style="font-size:16px;color:#ACACAE;margin-right:2px;">⏱</span><span style="font-size:16px;font-weight:500;color:#000000;">${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}</span>`;
    }

    // Add hover tooltip showing the calculation breakdown including break time
    if (calculationDetails) {
        const { base, terrainCorrection, packCorrection, correction, corrected, breakTime, distance, ascent, final } = calculationDetails;

        // Calculate individual components for the detailed breakdown
        const distanceTime = 20 * distance;  // 20 min per mile
        const ascentTime = 20 * 3 * (ascent / 2000);  // 20 min × 3 × (ascent / 2000 ft)

        // Format the tooltip exactly as specified in the documentation with preserved tabulation
        // Using actual tab characters for indentation as per the documentation
        const tooltipContent = `Base Naismith's time: ${formatAsHHMM(base)} 
\t${distance} mi distance: ${formatAsHHMM(distanceTime)}
\t${ascent} ft ascent: ${formatAsHHMM(ascentTime)}
Terrain correction: ${terrainCorrection}%
Pack weight correction: ${packCorrection}%
Breaks time: ${formatAsHHMM(breakTime)}
Final estimated hiking time: ${formatAsHHMM(final)}`;

        // Set tooltip on both the main div and all child elements to ensure it works in all cases
        div.addEventListener('mouseenter', () => {
            tooltip.textContent = tooltipContent;
            tooltip.style.display = 'block';
            tooltip.style.left = `${div.getBoundingClientRect().left}px`;
            tooltip.style.top = `${div.getBoundingClientRect().bottom + 5}px`;
        });
        div.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    } else {
        const basicTooltip = `Estimated hiking time including breaks (${h}h ${m}m)`;
        div.addEventListener('mouseenter', () => {
            tooltip.textContent = basicTooltip;
            tooltip.style.display = 'block';
            tooltip.style.left = `${div.getBoundingClientRect().left}px`;
            tooltip.style.top = `${div.getBoundingClientRect().bottom + 5}px`;
        });
        div.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    }

    return div;
}

function extractHikeStats() {
    if (typeof window.naismithBaseTime !== 'function' || typeof window.calculateBreakTime !== 'function') return;
    // --- Route Editing Page ---
    const statsContainer = document.querySelector('div.Stats-module__stats--KW1GI');
    if (statsContainer) {
        const statDivs = statsContainer.querySelectorAll('div');
        let distance = null, ascent = null, descent = null;
        let descentDiv = null, descentStyle = null;
        statDivs.forEach(div => {
            const p = div.querySelector('p');
            const span = p ? p.querySelector('span') : null;
            if (p && span) {
                const unit = span.textContent.trim().toLowerCase();
                let valueText = '';
                if (p.childNodes.length > 0 && p.childNodes[0].nodeType === Node.TEXT_NODE) {
                    valueText = p.childNodes[0].textContent;
                } else {
                    valueText = p.textContent.replace(span.textContent, '');
                }
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
        if (distance !== null && ascent !== null && descent !== null && descentDiv) {
            const base = window.naismithBaseTime(distance, ascent);
            const terrainCorrection = window.getTerrainCorrection(userSettings.terrain);
            const packCorrection = window.getPackCorrection(userSettings.packWeight);
            const correction = terrainCorrection + packCorrection;
            const corrected = base * (1 + correction / 100);
            const breakTime = window.calculateBreakTime(corrected);
            const final = corrected + breakTime;

            const calculationDetails = { base, terrainCorrection, packCorrection, correction, corrected, breakTime, distance, ascent, final };

            // Remove any previous estimate
            const prev = descentDiv.parentNode.querySelector('.naismith-estimate');
            if (prev) prev.remove();

            // Insert styled duration div after descentDiv
            const estDiv = createStyledDurationDiv(final, descentStyle, false, calculationDetails);

            if (descentDiv.nextSibling) {
                descentDiv.parentNode.insertBefore(estDiv, descentDiv.nextSibling);
            } else {
                descentDiv.parentNode.appendChild(estDiv);
            }
        }
    }
    // --- Route Summary Page ---
    const summaryContainer = document.querySelector('div.TrackDetailsSidebar-module__trackStatsContainer--tQ5rv');
    if (summaryContainer) {
        const statBlocks = summaryContainer.querySelectorAll('div > div');
        let distance = null, ascent = null;
        let ascentDiv = null, ascentStyle = null;
        statBlocks.forEach(block => {
            const spans = block.querySelectorAll('span');
            const p = block.querySelector('p');
            if (spans.length && p) {
                const label = spans[0].textContent.trim().toLowerCase();
                let valueText = '';
                if (p.childNodes.length > 0 && p.childNodes[0].nodeType === Node.TEXT_NODE) {
                    valueText = p.childNodes[0].textContent;
                } else {
                    valueText = p.textContent.replace(spans[1]?.textContent || '', '');
                }
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
        if (distance !== null && ascent !== null && ascentDiv) {
            const base = window.naismithBaseTime(distance, ascent);
            const terrainCorrection = window.getTerrainCorrection(userSettings.terrain);
            const packCorrection = window.getPackCorrection(userSettings.packWeight);
            const correction = terrainCorrection + packCorrection;
            const corrected = base * (1 + correction / 100);
            const breakTime = window.calculateBreakTime(corrected);
            const final = corrected + breakTime;

            const calculationDetails = { base, terrainCorrection, packCorrection, correction, corrected, breakTime, distance, ascent, final };

            // Remove any previous estimate
            const prev = ascentDiv.parentNode.querySelector('.naismith-estimate');
            if (prev) prev.remove();

            // Insert styled duration div to the right of ascentDiv
            const estDiv = createStyledDurationDiv(final, ascentStyle, true, calculationDetails);

            ascentDiv.parentNode.insertBefore(estDiv, ascentDiv.nextSibling);
        }
    }

    // --- Route Sharing Page ---
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

                if (distance !== null && ascent !== null && descent !== null && descentLi) {
                    const base = window.naismithBaseTime(distance, ascent);
                    const terrainCorrection = window.getTerrainCorrection(userSettings.terrain);
                    const packCorrection = window.getPackCorrection(userSettings.packWeight);
                    const correction = terrainCorrection + packCorrection;
                    const corrected = base * (1 + correction / 100);
                    const breakTime = window.calculateBreakTime(corrected);
                    const final = corrected + breakTime;

                    const calculationDetails = { base, terrainCorrection, packCorrection, correction, corrected, breakTime, distance, ascent, final };

                    // Remove any previous estimate
                    const prev = statsInfo.querySelector('.naismith-estimate');
                    if (prev) prev.remove();

                    // Create a new li element with duration
                    const durationLi = document.createElement('li');
                    durationLi.className = 'naismith-estimate';

                    // Format time as hh:mm
                    const h = Math.floor(final / 60);
                    const m = Math.round(final % 60);
                    const formattedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

                    // Set the content mimicking the style of the descent li
                    durationLi.innerHTML = `<strong>${formattedTime}</strong><div class="Stats-module__statLabel--Jk4cC">Duration</div>`;

                    // Add hover tooltip
                    durationLi.addEventListener('mouseenter', (event) => {
                        const tooltipContent = `Base Naismith's time: ${formatAsHHMM(base)} 
\t${distance} mi distance: ${formatAsHHMM(20 * distance)}
\t${ascent} ft ascent: ${formatAsHHMM(20 * 3 * (ascent / 2000))}
Terrain correction: ${terrainCorrection}%
Pack weight correction: ${packCorrection}%
Breaks time: ${formatAsHHMM(breakTime)}
Final estimated hiking time: ${formatAsHHMM(final)}`;

                        tooltip.textContent = tooltipContent;
                        tooltip.style.display = 'block';

                        // Get the current mouse position and element position for better tooltip placement
                        const rect = durationLi.getBoundingClientRect();
                        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

                        // Position tooltip below the element instead of using fixed coordinates
                        tooltip.style.left = `${rect.left}px`;
                        tooltip.style.top = `${rect.bottom + scrollTop + 5}px`;
                    });

                    durationLi.addEventListener('mouseleave', () => {
                        tooltip.style.display = 'none';
                    });

                    // Add the duration li to the ul
                    const ul = statsInfo.querySelector('ul');
                    ul.appendChild(durationLi);
                }
            }

            // Process only the first STATS card
            break;
        }
    }
}

// Debounced DOM observer
let debounceTimer = null;
let lastStats = '';
const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        // Only refresh if stats have changed
        const statsContainer = document.querySelector('div.Stats-module__stats--KW1GI') || document.querySelector('div.TrackDetailsSidebar-module__trackStatsContainer--tQ5rv') || document.querySelector('div.Card-module__card--iAbp1');
        let statsText = '';
        if (statsContainer) {
            statsText = statsContainer.innerText;
        }
        if (statsText !== lastStats) {
            lastStats = statsText;
            extractHikeStats();
        }
    }, 400);
});
observer.observe(document.body, { childList: true, subtree: true });

