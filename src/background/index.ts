import { getNoteByUrl } from '../utils/storage';

// Function to handle showing note or prompt
const handleTabCheck = async (tabId: number, url: string) => {
  try {
    // Skip chrome:// and edge:// URLs
    if (url.startsWith('chrome://') || url.startsWith('edge://')) {
      return;
    }
    
    // Check if there's a note for this URL
    const note = await getNoteByUrl(url);
    
    if (note) {
      // If note exists, show it
      chrome.tabs.sendMessage(tabId, {
        type: 'SHOW_NOTE_OVERLAY',
        note
      });
    } else {
      // If no note exists, show a prompt to set intent
      chrome.tabs.sendMessage(tabId, {
        type: 'SHOW_INTENT_PROMPT'
      });
    }
  } catch (error) {
    console.error('Error checking tab:', error);
  }
};

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      // Wait 2 seconds before showing the overlay to be less intrusive
      setTimeout(() => {
        handleTabCheck(activeInfo.tabId, tab.url!);
      }, 2000);
    }
  } catch (error) {
    console.error('Error in tab activation listener:', error);
  }
});

// Listen for tab updates (URL changes)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only proceed if the URL has changed and is complete
  if (changeInfo.status === 'complete' && tab.url) {
    // Wait 2 seconds before showing the overlay to be less intrusive
    setTimeout(() => {
      handleTabCheck(tabId, tab.url!);
    }, 2000);
  }
});