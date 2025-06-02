// Hiking Time Estimator Chrome Extension Content Script
// Looks for hike summary divs and displays Naismith's time estimate

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
function createStyledDurationDiv(minutes, styleSource, summaryMode = false) {
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
        div.innerHTML = `<span style="font-size:16px;color:#ACACAE;margin-right:6px;">⏱</span><span style="font-size:16px;font-weight:500;color:#000000;">${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}</span>`;
    }
    return div;
}

function extractHikeStats() {
    if (typeof window.naismithBaseTime !== 'function') return;
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
            // Remove any previous estimate
            const prev = descentDiv.parentNode.querySelector('.naismith-estimate');
            if (prev) prev.remove();
            // Insert styled duration div after descentDiv
            const estDiv = createStyledDurationDiv(corrected, descentStyle, false);
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
            // Remove any previous estimate
            const prev = ascentDiv.parentNode.querySelector('.naismith-estimate');
            if (prev) prev.remove();
            // Insert styled duration div to the right of ascentDiv
            const estDiv = createStyledDurationDiv(corrected, ascentStyle, true);
            ascentDiv.parentNode.insertBefore(estDiv, ascentDiv.nextSibling);
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
        const statsContainer = document.querySelector('div.Stats-module__stats--KW1GI') || document.querySelector('div.TrackDetailsSidebar-module__trackStatsContainer--tQ5rv');
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

