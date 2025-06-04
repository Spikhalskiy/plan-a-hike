// Hiking Time Estimator Popup Script
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

  function initializePopup() {
    // Load saved settings
    chrome.storage.sync.get(['terrain', 'packWeight', 'mode'], function(items) {
      // First set the terrain and pack weight based on saved values
      const terrain = items.terrain || 'backcountry';
      const packWeight = items.packWeight || 'light';

      // Initialize buttons for terrain and pack weight
      initializeButtons('terrain-options', terrain);
      initializeButtons('pack-options', packWeight);

      // Then update the mode based on the current settings
      // This will automatically detect if we're in a custom mode
      updateModeBasedOnSettings();

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
    });
  }
  
  // Set the hiking mode and update settings accordingly
  function setMode(mode) {
    // Update the mode toggle UI
    updateModeToggle(mode);

    // Update terrain and pack weight settings based on mode
    if (mode === 'day-hike') {
      // Day Hike: Backcountry terrain, Light pack
      selectButton('terrain-options', 'backcountry');
      selectButton('pack-options', 'light');
    } else if (mode === 'backpacking') {
      // Backpacking: Hilly terrain, Heavy pack
      selectButton('terrain-options', 'hilly');
      selectButton('pack-options', 'heavy');
    }
    // For 'custom' mode, don't change the current settings
  }

  // Update the mode toggle UI
  function updateModeToggle(mode) {
    const slider = document.querySelector('.mode-toggle-slider');
    slider.className = 'mode-toggle-slider ' + mode;

    document.querySelectorAll('.mode-toggle-option').forEach(option => {
      if (option.getAttribute('data-mode') === mode) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }

  // Check terrain and pack settings and update mode toggle accordingly
  function updateModeBasedOnSettings() {
    const terrain = document.querySelector('#terrain-options .option-button.selected').getAttribute('data-value');
    const packWeight = document.querySelector('#pack-options .option-button.selected').getAttribute('data-value');

    if (terrain === 'backcountry' && packWeight === 'light') {
      // If settings match Day Hike preset
      updateModeToggle('day-hike');
    } else if (terrain === 'hilly' && packWeight === 'heavy') {
      // If settings match Backpacking preset
      updateModeToggle('backpacking');
    } else {
      // Otherwise we're in custom mode
      updateModeToggle('custom');
    }
  }

  // Select the appropriate button in a group
  function selectButton(groupId, value) {
    document.querySelectorAll(`#${groupId} .option-button`).forEach(btn => {
      if (btn.getAttribute('data-value') === value) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  // Initialize buttons based on saved settings
  function initializeButtons(groupId, selectedValue) {
    selectButton(groupId, selectedValue);
  }

  // Save settings to Chrome storage
  function saveSettings() {
    const terrain = document.querySelector('#terrain-options .option-button.selected').getAttribute('data-value');
    const packWeight = document.querySelector('#pack-options .option-button.selected').getAttribute('data-value');

    // Determine mode based on current settings
    let mode = 'custom';
    if (terrain === 'backcountry' && packWeight === 'light') {
      mode = 'day-hike';
    } else if (terrain === 'hilly' && packWeight === 'heavy') {
      mode = 'backpacking';
    }

    const settings = {
      'terrain': terrain,
      'packWeight': packWeight,
      'mode': mode
    };

    // Save settings to Chrome storage
    chrome.storage.sync.set(settings);

    // Send message to the active tab to update estimates with new settings
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('gaiagps.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'settingsUpdated',
          settings: settings
        });
      }
    });
  }
});
