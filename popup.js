// Hiking Time Estimator Popup Script
document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.sync.get({
    terrain: 'backcountry',
    packWeight: 'moderate'
  }, function(items) {
    // Set UI to match saved settings
    selectButton('terrain-options', items.terrain);
    selectButton('pack-options', items.packWeight);
  });

  // Set up click handlers for terrain options
  document.querySelectorAll('#terrain-options .option-button').forEach(button => {
    button.addEventListener('click', function() {
      const value = this.getAttribute('data-value');
      selectButton('terrain-options', value);
      saveSettings();
    });
  });

  // Set up click handlers for pack weight options
  document.querySelectorAll('#pack-options .option-button').forEach(button => {
    button.addEventListener('click', function() {
      const value = this.getAttribute('data-value');
      selectButton('pack-options', value);
      saveSettings();
    });
  });

  // Helper function to select a button and deselect others in the same group
  function selectButton(groupId, value) {
    document.querySelectorAll(`#${groupId} .option-button`).forEach(btn => {
      if (btn.getAttribute('data-value') === value) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  // Save settings to Chrome storage
  function saveSettings() {
    const terrain = document.querySelector('#terrain-options .selected').getAttribute('data-value');
    const packWeight = document.querySelector('#pack-options .selected').getAttribute('data-value');

    chrome.storage.sync.set({
      terrain: terrain,
      packWeight: packWeight
    }, function() {
      // Update status
      const status = document.getElementById('status');
      status.textContent = 'Settings saved!';
      setTimeout(function() {
        status.textContent = 'Settings are automatically saved';
      }, 1500);

      // Notify content script that settings have changed
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'settingsUpdated',
            settings: { terrain, packWeight }
          });
        }
      });
    });
  }
});
