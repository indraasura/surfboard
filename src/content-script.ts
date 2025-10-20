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
  overlay.style.maxWidth = '300px';
  overlay.style.zIndex = '9999';
  overlay.style.borderRadius = '4px';
  overlay.style.animation = 'slideIn 0.3s ease-out';

  // Add title
  const title = document.createElement('h3');
  title.textContent = isReminder ? 'No intent saved:' : 'Your saved intent:';
  title.style.fontSize = '14px';
  title.style.color = isReminder ? '#ea4335' : '#4285f4';
  title.style.marginBottom = '6px';
  title.style.fontWeight = '500';
  overlay.appendChild(title);

  // Add note text or reminder
  const noteText = document.createElement('p');
  noteText.textContent = isReminder ? 'Add your intention for this page to stay focused.' : note;
  noteText.style.fontSize = '14px';
  noteText.style.margin = '0 0 10px 0';
  noteText.style.color = '#333';
  noteText.style.fontWeight = isReminder ? '400' : '500';
  overlay.appendChild(noteText);

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
  actionButton.style.marginRight = '8px';
  overlay.appendChild(actionButton);
  
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
    overlay.appendChild(dismissButton);
  }

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
    if (window.location.href.startsWith('chrome://') || window.location.href.startsWith('edge://')) {
      return;
    }
    
    const note = await getNoteByUrl(window.location.href);
    if (note) {
      createOverlay(note.note);
    } else {
      // Show reminder to add intent
      createOverlay('', true);
    }
  } catch (error) {
    console.error('Error checking for notes:', error);
  }
}

// Check for notes when the page loads with a slight delay to be less intrusive
setTimeout(checkForNotes, 2000);