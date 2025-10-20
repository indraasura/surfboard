import { getNoteByUrl } from "/src/utils/storage.ts.js";
let overlayHasShown = false;
function createOverlay(note, isReminder = false) {
  if (overlayHasShown || document.getElementById("context-escape-hatch-overlay")) {
    return;
  }
  const overlay = document.createElement("div");
  overlay.id = "context-escape-hatch-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "20px";
  overlay.style.right = "20px";
  overlay.style.backgroundColor = "white";
  overlay.style.borderLeft = isReminder ? "2px solid #f4cccc" : "2px solid #d2e3fc";
  overlay.style.boxShadow = "0 1px 8px rgba(0, 0, 0, 0.08)";
  overlay.style.padding = "12px";
  overlay.style.width = "240px";
  overlay.style.maxWidth = "240px";
  overlay.style.zIndex = "9999999";
  overlay.style.borderRadius = "4px";
  overlay.style.boxSizing = "border-box";
  overlay.style.opacity = "0.95";
  overlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif';
  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  overlay.style.animation = "fadeIn 0.2s ease-out";
  const title = document.createElement("h3");
  title.textContent = isReminder ? "No intent saved:" : "Your saved intent:";
  title.style.fontSize = "14px";
  title.style.color = isReminder ? "#ea4335" : "#4285f4";
  title.style.marginBottom = "6px";
  title.style.fontWeight = "500";
  title.style.margin = "0 0 6px 0";
  overlay.appendChild(title);
  const noteText = document.createElement("p");
  noteText.textContent = isReminder ? "Add your intention for this page to stay focused." : note;
  noteText.style.fontSize = "14px";
  noteText.style.margin = "0 0 10px 0";
  noteText.style.color = "#333";
  noteText.style.fontWeight = isReminder ? "400" : "500";
  noteText.style.wordBreak = "break-word";
  overlay.appendChild(noteText);
  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = "flex-start";
  buttonContainer.style.gap = "8px";
  const actionButton = document.createElement("button");
  if (isReminder) {
    actionButton.textContent = "Add Intent";
    actionButton.style.backgroundColor = "#ea4335";
    actionButton.style.color = "white";
    actionButton.onclick = () => {
      removeOverlay();
      chrome.runtime.sendMessage({ type: "OPEN_POPUP" });
    };
  } else {
    actionButton.textContent = "Dismiss";
    actionButton.style.backgroundColor = "#f1f3f4";
    actionButton.style.color = "#333";
    actionButton.onclick = removeOverlay;
  }
  actionButton.style.border = "none";
  actionButton.style.padding = "6px 12px";
  actionButton.style.borderRadius = "4px";
  actionButton.style.cursor = "pointer";
  actionButton.style.fontSize = "12px";
  buttonContainer.appendChild(actionButton);
  if (isReminder) {
    const dismissButton = document.createElement("button");
    dismissButton.textContent = "Dismiss";
    dismissButton.style.backgroundColor = "#f1f3f4";
    dismissButton.style.border = "none";
    dismissButton.style.padding = "6px 12px";
    dismissButton.style.borderRadius = "4px";
    dismissButton.style.cursor = "pointer";
    dismissButton.style.fontSize = "12px";
    dismissButton.style.color = "#333";
    dismissButton.onclick = removeOverlay;
    buttonContainer.appendChild(dismissButton);
  }
  overlay.appendChild(buttonContainer);
  document.body.appendChild(overlay);
  overlayHasShown = true;
  setTimeout(removeOverlay, 6e3);
}
function removeOverlay() {
  const overlay = document.getElementById("context-escape-hatch-overlay");
  if (overlay) {
    overlay.remove();
  }
}
chrome.runtime.onMessage.addListener((message) => {
  if (overlayHasShown || document.getElementById("context-escape-hatch-overlay")) {
    return;
  }
  if (message.type === "SHOW_NOTE_OVERLAY" && message.note) {
    createOverlay(message.note);
  } else if (message.type === "SHOW_INTENT_PROMPT") {
    createOverlay("", true);
  }
});
async function checkForNotes() {
  try {
    if (window.location.href.startsWith("chrome://") || window.location.href.startsWith("edge://") || window.location.href.startsWith("chrome-extension://") || window.location.href.startsWith("about:")) {
      return;
    }
    console.log("Checking for notes at URL:", window.location.href);
    const note = await getNoteByUrl(window.location.href);
    if (note) {
      console.log("Found note, displaying overlay");
      createOverlay(note.note);
    } else {
      console.log("No note found, displaying reminder");
      createOverlay("", true);
    }
  } catch (error) {
    console.error("Error checking for notes:", error);
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(checkForNotes, 1e3);
  }, { once: true });
} else {
  setTimeout(checkForNotes, 1e3);
}
window.addEventListener("load", () => {
  setTimeout(checkForNotes, 2e3);
}, { once: true });
