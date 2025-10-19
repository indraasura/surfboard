// Content script entry point
// Import storage utilities
import { getNoteByUrl } from './utils/storage';

// Create overlay to show notes
function createOverlay(note: string) {
  // Remove any existing overlay
  removeOverlay();

  // Create overlay element
  const overlay = document.createElement('div');
  overlay.id = 'context-escape-hatch-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '20px';
  overlay.style.right = '20px';
  overlay.style.backgroundColor = 'white';
  overlay.style.borderLeft = '3px solid #4285f4';
  overlay.style.boxShadow = '-2px 0 8px rgba(0, 0, 0, 0.1)';
  overlay.style.padding = '12px';
  overlay.style.maxWidth = '300px';
  overlay.style.zIndex = '9999';
  overlay.style.borderRadius = '4px';
  overlay.style.animation = 'slideIn 0.3s ease-out';

  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Your saved intent:';
  title.style.fontSize = '14px';
  title.style.color = '#666';
  title.style.marginBottom = '6px';
  overlay.appendChild(title);

  // Add note text
  const noteText = document.createElement('p');
  noteText.textContent = note;
  noteText.style.fontSize = '16px';
  noteText.style.margin = '0 0 10px 0';
  noteText.style.color = '#333';
  noteText.style.fontWeight = '500';
  overlay.appendChild(noteText);

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Dismiss';
  closeButton.style.backgroundColor = '#f1f3f4';
  closeButton.style.border = 'none';
  closeButton.style.padding = '6px 12px';
  closeButton.style.borderRadius = '4px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontSize = '12px';
  closeButton.style.color = '#333';
  closeButton.onclick = removeOverlay;
  overlay.appendChild(closeButton);

  // Add to document
  document.body.appendChild(overlay);

  // Auto-remove after 10 seconds
  setTimeout(removeOverlay, 10000);
}

// Remove overlay
function removeOverlay() {
  const overlay = document.getElementById('context-escape-hatch-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SHOW_NOTE_OVERLAY' && message.note) {
    createOverlay(message.note);
  }
});

// Check for notes when the page loads
setTimeout(async () => {
  try {
    // Skip chrome:// and edge:// URLs
    if (window.location.href.startsWith('chrome://') || window.location.href.startsWith('edge://')) {
      return;
    }
    
    const note = await getNoteByUrl(window.location.href);
    if (note) {
      createOverlay(note.note);
    }
  } catch (error) {
    console.error('Error checking for notes:', error);
  }
}, 2000); // Small delay to be less intrusive