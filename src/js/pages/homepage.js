//==========================
// JAVASCRIPT MODULES IMPORTS
//==========================

// Import all the modules you need for this page from ../modules

// Pure utility functions - can be used directly without initialization
import { showNotification } from '../modules/notification.js';

// DOM-dependent modules - require init
import { initTextAreaAutoExpand } from '../modules/textAreaAutoExpand.js';
import { initNormalizePhoneNumber } from '../modules/normalizePhoneNumber.js';

//==========================
// "homepage" PAGE CUSTOM JAVASCRIPT INSTRUCTIONS
//==========================

// All modules that interact with the DOM (event listeners, querySelector, MutationObserver)
// must be initialized here, after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  initTextAreaAutoExpand();
  initNormalizePhoneNumber();

  showNotification("Homepage notification");
});