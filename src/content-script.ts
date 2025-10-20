// Content script entry point
// Import storage utilities
import { getNoteByUrl } from './utils/storage';

// Create overlay to show notes
function createOverlay(note: string, isReminder = false) {
  // Remove any existing overlay
  removeOverlay();

  // Create overlay element
  const overlay = document.createElement('div');
  overlay.id = 'context-escape-hatch-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '20px';
  overlay.style.right = '20px';
  overlay.style.backgroundColor = 'white';
  overlay.style.borderLeft = isReminder ? '3px solid #ea4335' : '3px solid #4285f4';
  overlay.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  overlay.style.padding = '12px';
  overlay.style.width = '280px';
  overlay.style.maxWidth = '280px';
  overlay.style.zIndex = '9999999';
  overlay.style.borderRadius = '4px';
  overlay.style.boxSizing = 'border-box';
  overlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif';

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  overlay.style.animation = 'slideIn 0.3s ease-out';

  // Add title
  const title = document.createElement('h3');
  title.textContent = isReminder ? 'No intent saved:' : 'Your saved intent:';
  title.style.fontSize = '14px';
  title.style.color = isReminder ? '#ea4335' : '#4285f4';
  title.style.marginBottom = '6px';
  title.style.fontWeight = '500';
  title.style.margin = '0 0 6px 0';
  overlay.appendChild(title);

  // Add note text or reminder
  const noteText = document.createElement('p');
  noteText.textContent = isReminder ? 'Add your intention for this page to stay focused.' : note;
  noteText.style.fontSize = '14px';
  noteText.style.margin = '0 0 10px 0';
  noteText.style.color = '#333';
  noteText.style.fontWeight = isReminder ? '400' : '500';
  noteText.style.wordBreak = 'break-word';
  overlay.appendChild(noteText);

  // Create button container for proper alignment
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'flex-start';
  buttonContainer.style.gap = '8px';
  
  // Add action button
  const actionButton = document.createElement('button');
  
  if (isReminder) {
    actionButton.textContent = 'Add Intent';
    actionButton.style.backgroundColor = '#ea4335';
    actionButton.style.color = 'white';
    actionButton.onclick = () => {
      removeOverlay();
      // Open the popup to add a note
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
    };
  } else {
    actionButton.textContent = 'Dismiss';
    actionButton.style.backgroundColor = '#f1f3f4';
    actionButton.style.color = '#333';
    actionButton.onclick = removeOverlay;
  }
  
  actionButton.style.border = 'none';
  actionButton.style.padding = '6px 12px';
  actionButton.style.borderRadius = '4px';
  actionButton.style.cursor = 'pointer';
  actionButton.style.fontSize = '12px';
  buttonContainer.appendChild(actionButton);
  
  // Add dismiss button for reminders
  if (isReminder) {
    const dismissButton = document.createElement('button');
    dismissButton.textContent = 'Dismiss';
    dismissButton.style.backgroundColor = '#f1f3f4';
    dismissButton.style.border = 'none';
    dismissButton.style.padding = '6px 12px';
    dismissButton.style.borderRadius = '4px';
    dismissButton.style.cursor = 'pointer';
    dismissButton.style.fontSize = '12px';
    dismissButton.style.color = '#333';
    dismissButton.onclick = removeOverlay;
    buttonContainer.appendChild(dismissButton);
  }

  // Add button container to overlay
  overlay.appendChild(buttonContainer);

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

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SHOW_NOTE_OVERLAY' && message.note) {
    createOverlay(message.note);
  } else if (message.type === 'SHOW_INTENT_PROMPT') {
    createOverlay('', true); // Show reminder
  }
});

// Function to check for notes and show appropriate overlay
async function checkForNotes() {
  try {
    // Skip chrome:// and edge:// URLs
    if (window.location.href.startsWith('chrome://') || 
        window.location.href.startsWith('edge://') || 
        window.location.href.startsWith('chrome-extension://') ||
        window.location.href.startsWith('about:')) {
      return;
    }
    
    console.log('Checking for notes at URL:', window.location.href);
    const note = await getNoteByUrl(window.location.href);
    if (note) {
      console.log('Found note, displaying overlay');
      createOverlay(note.note);
    } else {
      // Show reminder to add intent
      console.log('No note found, displaying reminder');
      createOverlay('', true);
    }
  } catch (error) {
    console.error('Error checking for notes:', error);
  }
}

// Ensure the content script runs when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Check for notes with a slight delay to ensure storage is accessible
    setTimeout(checkForNotes, 1000);
  });
} else {
  // DOM already loaded, run directly with a slight delay
  setTimeout(checkForNotes, 1000);
}

// Also run when the page is fully loaded (including images)
window.addEventListener('load', () => {
  // Check again after page is fully loaded
  setTimeout(checkForNotes, 2000);
});