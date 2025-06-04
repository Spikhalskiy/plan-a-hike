/**
 * Hiking Time Estimator Popup Script
 * Manages the extension popup UI and settings
 */

// Constants for default settings
const DEFAULT_SETTINGS = {
  terrain: 'backcountry',
  packWeight: 'light',
  mode: 'day-hike'
};

// Mode presets
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

document.addEventListener('DOMContentLoaded', function() {
  // First check if we're on a Gaia GPS page
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0] && tabs[0].url && tabs[0].url.includes('gaiagps.com')) {
      // We're on a Gaia GPS page, initialize the popup
      initializePopup();
    } else {
      // Not on Gaia GPS, show a message
      document.body.innerHTML = '<div style="padding: 20px; text-align: center;">This extension only works on Gaia GPS websites.</div>';
    }
  });

  /**
   * Initialize the popup with saved settings and event listeners
   */
  function initializePopup() {
    // Keep loading state visible until configuration is fully loaded
    const loadingContainer = document.getElementById('loading-container');
    const settingsContainer = document.getElementById('settings-container');

    // First, request current configuration from the active tab's content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageConfiguration' }, function(response) {
          // If we received a response with current page configuration, use it
          // Otherwise, fall back to the saved settings
          if (response && response.settings) {
            configureUIWithSettings(response.settings);
          } else {
            // Load saved settings as fallback
            chrome.storage.sync.get(DEFAULT_SETTINGS, function(items) {
              configureUIWithSettings(items);
            });
          }
        });
      } else {
        // Fallback if we can't communicate with the tab
        chrome.storage.sync.get(DEFAULT_SETTINGS, function(items) {
          configureUIWithSettings(items);
        });
      }
    });

    /**
     * Configure UI elements with settings and show the UI
     * @param {Object} settings - The settings to apply
     */
    function configureUIWithSettings(settings) {
      // Apply settings to UI elements first
      applySettings(settings);

      // Only after all settings are applied, show the UI
      loadingContainer.style.display = 'none';
      settingsContainer.style.display = 'block';
    }
  }

  /**
   * Apply settings to the popup UI
   * @param {Object} settings - The settings to apply
   */
  function applySettings(settings) {
    // First set the terrain and pack weight based on provided values
    const terrain = settings.terrain || DEFAULT_SETTINGS.terrain;
    const packWeight = settings.packWeight || DEFAULT_SETTINGS.packWeight;
    const mode = settings.mode || DEFAULT_SETTINGS.mode;

    // Initialize buttons for terrain and pack weight
    initializeButtons('terrain-options', terrain);
    initializeButtons('pack-options', packWeight);

    // Initialize mode toggle
    updateModeToggle(mode);

    // Add event listeners to option buttons
    document.querySelectorAll('.option-button').forEach(btn => {
      btn.addEventListener('click', function() {
        const group = this.closest('.option-buttons').id;
        const value = this.getAttribute('data-value');

        // Update the button selection
        selectButton(group, value);

        // Check if we need to update the mode toggle
        updateModeBasedOnSettings();

        // Save settings
        saveSettings();
      });
    });

    // Add event listeners to mode toggle options
    document.querySelectorAll('.mode-toggle-option').forEach(option => {
      option.addEventListener('click', function() {
        const mode = this.getAttribute('data-mode');
        setMode(mode);
        saveSettings();
      });
    });
  }

  /**
   * Set the hiking mode and update settings accordingly
   * @param {string} mode - The mode to set (day-hike, backpacking)
   */
  function setMode(mode) {
    // Update the mode toggle UI
    updateModeToggle(mode);

    // Update terrain and pack weight settings based on mode preset
    if (MODE_PRESETS[mode]) {
      const preset = MODE_PRESETS[mode];
      selectButton('terrain-options', preset.terrain);
      selectButton('pack-options', preset.packWeight);
    }
  }

  /**
   * Update the mode toggle UI
   * @param {string} mode - The mode to set (day-hike, backpacking, custom)
   */
  function updateModeToggle(mode) {
    const slider = document.querySelector('.mode-toggle-slider');
    slider.className = 'mode-toggle-slider ' + mode;

    document.querySelectorAll('.mode-toggle-option').forEach(option => {
      option.classList.toggle('active', option.getAttribute('data-mode') === mode);
    });
  }

  /**
   * Check terrain and pack settings and update mode toggle accordingly
   */
  function updateModeBasedOnSettings() {
    const terrain = document.querySelector('#terrain-options .option-button.selected').getAttribute('data-value');
    const packWeight = document.querySelector('#pack-options .option-button.selected').getAttribute('data-value');

    // Check if settings match a predefined mode
    if (terrain === MODE_PRESETS['day-hike'].terrain && packWeight === MODE_PRESETS['day-hike'].packWeight) {
      updateModeToggle('day-hike');
    } else if (terrain === MODE_PRESETS['backpacking'].terrain && packWeight === MODE_PRESETS['backpacking'].packWeight) {
      updateModeToggle('backpacking');
    } else {
      updateModeToggle('custom');
    }
  }

  /**
   * Initialize buttons with the selected value
   * @param {string} groupId - ID of the button group
   * @param {string} selectedValue - Value to select
   */
  function initializeButtons(groupId, selectedValue) {
    document.querySelectorAll(`#${groupId} .option-button`).forEach(button => {
      button.classList.toggle('selected', button.getAttribute('data-value') === selectedValue);
    });
  }

  /**
   * Select a button in a group and update the UI
   * @param {string} groupId - ID of the button group
   * @param {string} value - Value to select
   */
  function selectButton(groupId, value) {
    document.querySelectorAll(`#${groupId} .option-button`).forEach(button => {
      button.classList.toggle('selected', button.getAttribute('data-value') === value);
    });
  }

  /**
   * Save settings to Chrome storage and notify content script
   */
  function saveSettings() {
    const terrain = document.querySelector('#terrain-options .option-button.selected').getAttribute('data-value');
    const packWeight = document.querySelector('#pack-options .option-button.selected').getAttribute('data-value');

    // Determine the current mode
    let mode = 'custom';
    if (terrain === MODE_PRESETS['day-hike'].terrain && packWeight === MODE_PRESETS['day-hike'].packWeight) {
      mode = 'day-hike';
    } else if (terrain === MODE_PRESETS['backpacking'].terrain && packWeight === MODE_PRESETS['backpacking'].packWeight) {
      mode = 'backpacking';
    }

    const settings = { terrain, packWeight, mode };

    // Save to Chrome storage
    chrome.storage.sync.set(settings, function() {
      // Notify content script of the change
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'settingsUpdated',
            settings: settings
          });
        }
      });
    });
  }
});
