export function normalizePhoneNumber(input) {
  if (!input) return;

  let value = input.value.replace(/[^0-9+]/g, "");

  if (value.startsWith("+")) {
    value = "+" + value.slice(1).replace(/\+/g, "");
    if (value.length > 4) value = `${value.slice(0, 3)} ${value.slice(3)}`;
  } else {
    value = value.replace(/\+/g, "");
  }

  input.value = value;
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('input[type="tel"]').forEach(normalizePhoneNumber);
});

document.addEventListener("input", ({ target }) => {
  if (target.matches('input[type="tel"]')) normalizePhoneNumber(target);
});