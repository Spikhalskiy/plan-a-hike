/**
 * Hiking Time Estimator Popup Script
 * Manages the extension popup UI and settings
 */

// Uses shared constants and functions from chrome-plugin-common.js

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
            chrome.storage.sync.get(window.HikingTimeEstimator.DEFAULT_SETTINGS, function(items) {
              configureUIWithSettings(items);
            });
          }
        });
      } else {
        // Fallback if we can't communicate with the tab
        chrome.storage.sync.get(window.HikingTimeEstimator.DEFAULT_SETTINGS, function(items) {
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
    const terrain = settings.terrain || window.HikingTimeEstimator.DEFAULT_SETTINGS.terrain;
    const packWeight = settings.packWeight || window.HikingTimeEstimator.DEFAULT_SETTINGS.packWeight;

    // Initialize buttons for terrain and pack weight
    initializeButtons('terrain-options', terrain);
    initializeButtons('pack-options', packWeight);

    // Derive the mode from terrain and pack weight using the shared function
    const mode = window.HikingTimeEstimator.determineCurrentMode(settings);

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
    if (window.HikingTimeEstimator.MODE_PRESETS[mode]) {
      const preset = window.HikingTimeEstimator.MODE_PRESETS[mode];
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

    // Use shared function to determine mode
    const settings = { terrain, packWeight };
    const mode = window.HikingTimeEstimator.determineCurrentMode(settings);
    updateModeToggle(mode);
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

    // Create settings object
    const settings = { terrain, packWeight };

    // Determine the current mode using shared function
    const mode = window.HikingTimeEstimator.determineCurrentMode(settings);

    // Only save terrain and packWeight to Chrome storage
    const storageSettings = { terrain, packWeight };

    // The complete settings including derived mode (for the content script UI)
    const completeSettings = { ...settings, mode };

    // Save to Chrome storage
    chrome.storage.sync.set(storageSettings, function() {
      // Notify content script of the change
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'settingsUpdated',
            settings: completeSettings
          });
        }
      });
    });
  }
});
