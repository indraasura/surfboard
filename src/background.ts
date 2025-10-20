// Background script entry point
import { getNoteByUrl } from './utils/storage';

// Function to check if URL is valid for processing
function isValidUrl(url: string): boolean {
  return Boolean(url && 
         !url.startsWith('chrome://') && 
         !url.startsWith('edge://') && 
         !url.startsWith('chrome-extension://') &&
         !url.startsWith('about:'));
}

// Function to handle tab checking
async function checkTab(tabId: number, url: string): Promise<void> {
  if (!isValidUrl(url)) return;
  
  try {
    const note = await getNoteByUrl(url);
    
    // Try to send message to content script
    try {
      if (note) {
        chrome.tabs.sendMessage(tabId, { 
          type: 'SHOW_NOTE_OVERLAY', 
          note: note.note 
        });
      } else {
        // Show reminder if no note exists
        chrome.tabs.sendMessage(tabId, {
          type: 'SHOW_INTENT_PROMPT'
        });
      }
    } catch (error) {
      console.error('Error sending message to tab:', error);
    }
  } catch (error) {
    console.error('Error checking for notes:', error);
  }
}

// Check for notes when a tab is activated
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      // Small delay to ensure content script is loaded
      setTimeout(() => checkTab(activeInfo.tabId, tab.url as string), 1500);
    }
  } catch (error) {
    console.error('Error in tab activation:', error);
  }
});

// Check for notes when a tab is updated
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Small delay to ensure content script is loaded
    setTimeout(() => checkTab(tabId, tab.url as string), 1500);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OPEN_POPUP') {
    try {
      // Try to open the popup
      chrome.action.openPopup().catch((err: unknown) => {
        console.error('Failed to open popup:', err);
      });
      sendResponse({ success: true });
    } catch (err: unknown) {
      console.error('Error opening popup:', err);
      sendResponse({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
  return true; // Keep the message channel open for async responses
});