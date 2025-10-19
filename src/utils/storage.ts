// Types for our note data
export interface TabNote {
  id: string;
  url: string;
  title: string;
  note: string;
  createdAt: number;
  updatedAt: number;
}

// Storage keys
const STORAGE_KEY = 'context-escape-hatch-notes';

// Get all notes
export const getAllNotes = async (): Promise<TabNote[]> => {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
};

// Get note by URL
export const getNoteByUrl = async (url: string): Promise<TabNote | undefined> => {
  const notes = await getAllNotes();
  return notes.find(note => note.url === url);
};

// Get note by tab ID
export const getNoteByTabId = async (tabId: string): Promise<TabNote | undefined> => {
  const notes = await getAllNotes();
  return notes.find(note => note.id === tabId);
};

// Save a new note
export const saveNote = async (note: TabNote): Promise<void> => {
  const notes = await getAllNotes();
  const existingNoteIndex = notes.findIndex(n => n.id === note.id);
  
  if (existingNoteIndex >= 0) {
    // Update existing note
    notes[existingNoteIndex] = {
      ...note,
      updatedAt: Date.now()
    };
  } else {
    // Add new note
    notes.push({
      ...note,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
  
  await chrome.storage.local.set({ [STORAGE_KEY]: notes });
};

// Delete a note
export const deleteNote = async (noteId: string): Promise<void> => {
  const notes = await getAllNotes();
  const filteredNotes = notes.filter(note => note.id !== noteId);
  await chrome.storage.local.set({ [STORAGE_KEY]: filteredNotes });
};

// Clear all notes
export const clearAllNotes = async (): Promise<void> => {
  await chrome.storage.local.remove(STORAGE_KEY);
};