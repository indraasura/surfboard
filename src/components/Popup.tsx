import React, { useState, useEffect } from 'react';
import { TabNote, getAllNotes, getNoteByUrl, saveNote, deleteNote } from '../utils/storage';

const Popup: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [notes, setNotes] = useState<TabNote[]>([]);
  const [noteText, setNoteText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [existingNote, setExistingNote] = useState<TabNote | null>(null);

  useEffect(() => {
    // Get current tab information
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        setCurrentTab(tabs[0]);
        
        // Check if there's a note for this URL
        if (tabs[0].url) {
          const note = await getNoteByUrl(tabs[0].url);
          if (note) {
            setExistingNote(note);
            setNoteText(note.note);
            setShowReminder(true);
            
            // Inject code to show overlay directly
            if (tabs[0].id) {
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (noteText) => {
                  // Create and show overlay
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
                  
                  // Add title
                  const title = document.createElement('h3');
                  title.textContent = 'Your saved intent:';
                  title.style.fontSize = '14px';
                  title.style.color = '#666';
                  title.style.marginBottom = '6px';
                  overlay.appendChild(title);
                  
                  // Add note text
                  const noteElement = document.createElement('p');
                  noteElement.textContent = noteText;
                  noteElement.style.fontSize = '16px';
                  noteElement.style.margin = '0 0 10px 0';
                  noteElement.style.color = '#333';
                  noteElement.style.fontWeight = '500';
                  overlay.appendChild(noteElement);
                  
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
                  closeButton.onclick = () => overlay.remove();
                  overlay.appendChild(closeButton);
                  
                  // Add to document
                  document.body.appendChild(overlay);
                  
                  // Auto-remove after 10 seconds
                  setTimeout(() => {
                    const element = document.getElementById('context-escape-hatch-overlay');
                    if (element) {
                      element.remove();
                    }
                  }, 10000);
                },
                args: [note.note]
              }).catch(err => console.error("Error injecting script:", err));
            }
          }
        }
        
        // Get all notes
        const allNotes = await getAllNotes();
        setNotes(allNotes);
      }
    });
  }, []);

  const handleSaveNote = async () => {
    if (!currentTab || !currentTab.url || !noteText.trim()) return;
    
    const note: TabNote = {
      id: editingNoteId || currentTab.id?.toString() || Date.now().toString(),
      url: currentTab.url,
      title: currentTab.title || 'Untitled',
      note: noteText,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await saveNote(note);
    
    // Reset state
    setNoteText('');
    setIsEditing(false);
    setEditingNoteId(null);
    
    // Refresh notes list
    const updatedNotes = await getAllNotes();
    setNotes(updatedNotes);
    
    // Show confirmation
    setExistingNote(note);
    setShowReminder(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
    
    // Refresh notes list
    const updatedNotes = await getAllNotes();
    setNotes(updatedNotes);
    
    // If we were editing this note, reset the form
    if (editingNoteId === noteId) {
      setNoteText('');
      setIsEditing(false);
      setEditingNoteId(null);
      setExistingNote(null);
      setShowReminder(false);
    }
  };

  const handleEditNote = (note: TabNote) => {
    setNoteText(note.note);
    setIsEditing(true);
    setEditingNoteId(note.id);
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>Context Escape Hatch</h1>
      </header>
      
      {currentTab && (
        <div className="current-tab">
          <h2>{currentTab.title}</h2>
          <p className="url">{currentTab.url}</p>
          
          {showReminder && existingNote && (
            <div className="reminder-box">
              <h3>Your intention for this tab:</h3>
              <p className="reminder-text">{existingNote.note}</p>
              <button onClick={() => handleEditNote(existingNote)} className="edit-button">
                Edit
              </button>
            </div>
          )}
          
          <div className="note-form">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={showReminder ? "Update your intention" : "What's your intention for this tab?"}
              rows={3}
            />
            <button onClick={handleSaveNote}>
              {isEditing ? 'Update Note' : 'Save Note'}
            </button>
            {isEditing && (
              <button 
                onClick={() => {
                  setNoteText('');
                  setIsEditing(false);
                  setEditingNoteId(null);
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="notes-list">
        <h3>Your Saved Notes</h3>
        {notes.length === 0 ? (
          <p className="empty-state">No notes saved yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="note-item">
              <div className="note-content">
                <h4>{note.title}</h4>
                <p className="note-url">{note.url}</p>
                <p className="note-text">{note.note}</p>
              </div>
              <div className="note-actions">
                <button onClick={() => handleEditNote(note)} className="edit-button">
                  Edit
                </button>
                <button onClick={() => handleDeleteNote(note.id)} className="delete-button">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Popup;