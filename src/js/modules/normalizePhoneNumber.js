//==========================
// PHONE NUMBER NORMALIZATION MODULE
//==========================

// Normalizes and attaches normalization to all existing and future tel inputs
// Must be called inside DOMContentLoaded in the page's JS file
export function initNormalizePhoneNumber() {

  // Formats digits in groups of 3, 3 and 4 (e.g. 333 123 4567)
  function formatDigits(digits) {
    let formatted = "";
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += " " + digits.slice(3, 6);
    if (digits.length > 6) formatted += " " + digits.slice(6, 10);
    return formatted;
  }

  function normalize(input) {
    if (!input) return;

    let value = input.value.replace(/[^0-9+]/g, "");

    if (value.startsWith("+")) {
      // Keep only the first + and the 2-digit country code (e.g. +39)
      value = "+" + value.slice(1).replace(/\+/g, "");
      const prefix = value.slice(0, 3);           // e.g. +39
      const digits = value.slice(3);              // remaining digits

      value = prefix + (digits ? " " + formatDigits(digits) : "");
    } else {
      // No country code - format digits directly as 3-3-4
      value = value.replace(/\+/g, "");
      value = formatDigits(value);
    }

    input.value = value;
  }

  document.querySelectorAll('input[type="tel"]').forEach(normalize);

  document.addEventListener("input", ({ target }) => {
    if (target.matches('input[type="tel"]')) normalize(target);
  });
}