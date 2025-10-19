// Background script entry point
import { getNoteByUrl } from './utils/storage';

// Check for notes when a tab is activated
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  setTimeout(async () => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
      const note = await getNoteByUrl(tab.url as string);
      if (note) {
        chrome.tabs.sendMessage(activeInfo.tabId, { 
          type: 'SHOW_NOTE_OVERLAY', 
          note: note.note 
        });
      }
    }
  }, 1000); // Small delay to be less intrusive
});

// Check for notes when a tab is updated
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
    setTimeout(async () => {
      const note = await getNoteByUrl(tab.url as string);
      if (note) {
        chrome.tabs.sendMessage(tabId, { 
          type: 'SHOW_NOTE_OVERLAY', 
          note: note.note 
        });
      }
    }, 1000); // Small delay to be less intrusive
  }
});