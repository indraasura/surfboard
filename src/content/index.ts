import { TabNote } from '../utils/storage';

// Create and inject overlay for existing notes
function createOverlay(note: TabNote): HTMLElement {
  // Remove any existing overlay
  removeOverlay();

  // Create overlay element
  const overlay = document.createElement('div');
  overlay.id = 'context-escape-hatch-overlay';
  overlay.className = 'overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: white;
    border-left: 3px solid #4fc3f7;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    padding: 12px;
    max-width: 300px;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    animation: slideIn 0.3s ease-out;
  `;

  // Create content
  const title = document.createElement('h3');
  title.textContent = 'Your intention for this tab:';
  title.style.cssText = 'margin: 0 0 8px 0; font-size: 14px; color: #666;';

  const noteText = document.createElement('p');
  noteText.textContent = note.note;
  noteText.style.cssText = 'margin: 0; font-size: 16px; color: #333;';

  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #999;
  `;
  closeButton.addEventListener('click', removeOverlay);

  // Assemble overlay
  overlay.appendChild(closeButton);
  overlay.appendChild(title);
  overlay.appendChild(noteText);

  // Auto-hide after 5 seconds
  setTimeout(removeOverlay, 5000);

  return overlay;
}

// Create and inject intent prompt for new tabs
function createIntentPrompt(): HTMLElement {
  // Remove any existing overlay
  removeOverlay();

  // Create overlay element
  const overlay = document.createElement('div');
  overlay.id = 'context-escape-hatch-overlay';
  overlay.className = 'overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: white;
    border-left: 3px solid #ffc107;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    padding: 12px;
    max-width: 300px;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    animation: slideIn 0.3s ease-out;
  `;

  // Create content
  const title = document.createElement('h3');
  title.textContent = 'Set an intention for this tab';
  title.style.cssText = 'margin: 0 0 8px 0; font-size: 14px; color: #666;';

  const message = document.createElement('p');
  message.textContent = 'Click the extension icon to save a note for this tab.';
  message.style.cssText = 'margin: 0 0 10px 0; font-size: 14px; color: #333;';

  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #999;
  `;
  closeButton.addEventListener('click', removeOverlay);

  // Assemble overlay
  overlay.appendChild(closeButton);
  overlay.appendChild(title);
  overlay.appendChild(message);

  // Auto-hide after 5 seconds
  setTimeout(removeOverlay, 5000);

  return overlay;
}

// Remove overlay if it exists
function removeOverlay(): void {
  const existingOverlay = document.getElementById('context-escape-hatch-overlay');
  if (existingOverlay && existingOverlay.parentNode) {
    existingOverlay.parentNode.removeChild(existingOverlay);
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SHOW_NOTE_OVERLAY' && message.note) {
    const overlay = createOverlay(message.note);
    document.body.appendChild(overlay);
    sendResponse({ success: true });
  } else if (message.type === 'SHOW_INTENT_PROMPT') {
    const prompt = createIntentPrompt();
    document.body.appendChild(prompt);
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async responses
});