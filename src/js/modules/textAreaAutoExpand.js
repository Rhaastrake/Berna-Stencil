//==========================
// AUTO-EXPAND TEXTAREA MODULE
//==========================

// Expands a textarea to fit its content automatically
// Must be called inside DOMContentLoaded in the page's JS file
export function initTextAreaAutoExpand() {

  // Resizes the textarea to fit its content
  function expand(element) {
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
  }

  // Applies required styles and listener to a single textarea
  function setup(element) {
    element.style.resize = "none";
    element.style.overflow = "hidden";
    element.addEventListener("input", () => expand(element));
    if (element.value) expand(element);
  }

  // Attach to all existing .auto-expand textareas
  document.querySelectorAll(".auto-expand").forEach(setup);

  // Handle dynamically injected textareas via event delegation
  document.addEventListener("input", ({ target }) => {
    if (target.matches(".auto-expand")) expand(target);
  });
}