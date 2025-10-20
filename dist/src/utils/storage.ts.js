const STORAGE_KEY = "context-escape-hatch-notes";
export const getAllNotes = async () => {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
};
export const getNoteByUrl = async (url) => {
  const notes = await getAllNotes();
  return notes.find((note) => note.url === url);
};
export const getNoteByTabId = async (tabId) => {
  const notes = await getAllNotes();
  return notes.find((note) => note.id === tabId);
};
export const saveNote = async (note) => {
  const notes = await getAllNotes();
  const existingNoteIndex = notes.findIndex((n) => n.id === note.id);
  if (existingNoteIndex >= 0) {
    notes[existingNoteIndex] = {
      ...note,
      updatedAt: Date.now()
    };
  } else {
    notes.push({
      ...note,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: notes });
};
export const deleteNote = async (noteId) => {
  const notes = await getAllNotes();
  const filteredNotes = notes.filter((note) => note.id !== noteId);
  await chrome.storage.local.set({ [STORAGE_KEY]: filteredNotes });
};
export const clearAllNotes = async () => {
  await chrome.storage.local.remove(STORAGE_KEY);
};
