// Hiking Time Estimator Popup Script
document.addEventListener('DOMContentLoaded', function() {
  // First check if we're on a Gaia GPS page
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0] && tabs[0].url && tabs[0].url.includes('gaiagps.com')) {
      // We're on a Gaia GPS page, initialize the popup
      initializePopup();
    } else {
      // Not on Gaia GPS, show a message
      document.body.innerHTML = '<div style="padding: 20px; text-align: center;">This extension only works on Gaia GPS website.</div>';
    }
  });

  function initializePopup() {
    // Load saved settings
    chrome.storage.sync.get(['terrain', 'packWeight'], function(items) {
      // Initialize terrain buttons
      initializeButtons('terrain-options', items.terrain || 'moderate');
      
      // Initialize pack weight buttons
      initializeButtons('pack-options', items.packWeight || 'medium');
      
      // Add event listeners to all buttons
      document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const group = this.closest('.btn-group').id;
          selectButton(group, this.getAttribute('data-value'));
          saveSettings();
        });
      });
    });
  }
  
  // Select the appropriate button in a group
  function selectButton(groupId, value) {
    document.querySelectorAll(`#${groupId} .btn`).forEach(btn => {
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
    const terrain = document.querySelector('#terrain-options .selected').getAttribute('data-value');
    const packWeight = document.querySelector('#pack-options .selected').getAttribute('data-value');
    
    chrome.storage.sync.set({
      'terrain': terrain,
      'packWeight': packWeight
    });
  }
});
