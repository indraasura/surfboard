import { useEffect, useState } from 'react';
import { TabNote, getAllNotes, getNoteByUrl, saveNote, deleteNote } from '../utils/storage';

const Popup = () => {
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<TabNote[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showNoNotePrompt, setShowNoNotePrompt] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [existingNote, setExistingNote] = useState<TabNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
                  overlay.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  overlay.style.padding = '16px';
                  overlay.style.maxWidth = '300px';
                  overlay.style.zIndex = '9999';
                  overlay.style.borderRadius = '8px';
                  
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
          } else {
            // No note exists for this URL, show prompt
            setShowNoNotePrompt(true);
          }
        }
        
        // Get all notes
        const allNotes = await getAllNotes();
        setNotes(allNotes);
      }
    });
  }, []);

  const handleSaveNote = () => {
    if (!currentTab?.url || !noteText.trim()) return;
    
    const noteData: TabNote = {
      id: editingNoteId || Date.now().toString(),
      url: currentTab.url,
      title: currentTab.title || 'Untitled',
      note: noteText.trim(),
      createdAt: editingNoteId ? (existingNote?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now(),
    };
    
    saveNote(noteData).then(() => {
      // Update the notes list
      getAllNotes().then((allNotes) => {
        setNotes(allNotes);
      });
      
      // Reset the form
      setNoteText('');
      setEditingNoteId(null);
      setIsEditing(false);
      
      // Update existing note if we just saved for the current URL
      if (currentTab.url) {
        getNoteByUrl(currentTab.url).then((note) => {
          if (note) {
            setExistingNote(note);
            setShowReminder(true);
            setShowNoNotePrompt(false);
          }
        });
      }
      
      // Inject a notification into the page
      injectNotification(editingNoteId ? 'Note updated' : 'Note saved');
    });
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote(noteId).then(() => {
      // Update the notes list
      getAllNotes().then((allNotes) => {
        setNotes(allNotes);
      });
      
      // If we deleted the note for the current URL, update the UI
      if (existingNote && existingNote.id === noteId) {
        setExistingNote(null);
        setShowReminder(false);
        setShowNoNotePrompt(true);
      }
    });
  };

  const handleEditNote = (note: TabNote) => {
    setNoteText(note.note);
    setEditingNoteId(note.id);
    setIsEditing(true);
  };

  const injectNotification = (message: string) => {
    if (!currentTab?.id) return;
    
    // Inject the notification into the page
    chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: (notificationMessage) => {
        // Create the notification element
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#4285f4';
        notification.style.color = 'white';
        notification.style.padding = '12px 16px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.zIndex = '9999';
        notification.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        notification.style.fontSize = '14px';
        notification.style.transition = 'opacity 0.3s ease-in-out';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '8px';
        
        // Add an icon
        const icon = document.createElement('div');
        icon.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        `;
        notification.appendChild(icon);
        
        // Add the message
        const text = document.createElement('span');
        text.textContent = notificationMessage;
        notification.appendChild(text);
        
        // Add a close button
        const closeButton = document.createElement('div');
        closeButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 8px; cursor: pointer;">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
        closeButton.style.cursor = 'pointer';
        closeButton.style.marginLeft = '8px';
        closeButton.onclick = () => {
          document.body.removeChild(notification);
        };
        notification.appendChild(closeButton);
        
        // Add to the page
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
          if (document.body.contains(notification)) {
            notification.style.opacity = '0';
            setTimeout(() => {
              if (document.body.contains(notification)) {
                document.body.removeChild(notification);
              }
            }, 300);
          }
        }, 10000);
      },
      args: [message],
    });
  };
  
  return (
    <div className="popup-container" style={{ width: '350px', padding: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ 
        background: '#4285f4', 
        color: 'white', 
        padding: '12px 16px', 
        borderRadius: '8px', 
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Surfboard</h1>
      </header>
      
      {currentTab && (
        <div>
          <div style={{ 
            background: 'white', 
            borderRadius: '8px', 
            padding: '16px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: '1px solid #eee'
          }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '500' }}>{currentTab.title}</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>{currentTab.url}</p>
            
            {showNoNotePrompt && !showReminder && (
              <div style={{ 
                background: '#e8f0fe', 
                padding: '12px', 
                borderRadius: '6px', 
                marginBottom: '16px',
                borderLeft: '3px solid #4285f4'
              }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500', color: '#1a73e8' }}>No intent saved</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#444' }}>
                  Add your intention for this page below
                </p>
              </div>
            )}
            
            {showReminder && existingNote && (
              <div style={{ 
                background: '#e8f0fe', 
                padding: '12px', 
                borderRadius: '6px', 
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderLeft: '3px solid #4285f4'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '500', color: '#1a73e8' }}>Your saved intent:</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{existingNote.note}</p>
                </div>
                <button 
                  onClick={() => handleEditNote(existingNote)} 
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#1a73e8', 
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}
                >
                  Edit
                </button>
              </div>
            )}
            
            <div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={showReminder ? "Update your intention" : "What's your intention for this tab?"}
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  border: '1px solid #ddd',
                  marginBottom: '8px',
                  fontSize: '14px',
                  resize: 'none'
                }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                {isEditing && (
                  <button 
                    onClick={() => {
                      setNoteText('');
                      setIsEditing(false);
                      setEditingNoteId(null);
                    }}
                    style={{ 
                      background: '#f1f3f4', 
                      border: 'none', 
                      padding: '6px 12px', 
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                )}
                
                <button 
                  onClick={handleSaveNote}
                  disabled={!noteText.trim()}
                  style={{ 
                    background: '#4285f4', 
                    color: 'white', 
                    border: 'none', 
                    padding: '6px 12px', 
                    borderRadius: '4px',
                    fontSize: '13px',
                    cursor: noteText.trim() ? 'pointer' : 'not-allowed',
                    opacity: noteText.trim() ? 1 : 0.7
                  }}
                >
                  {isEditing ? 'Update' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
          
          {notes.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ 
                borderTop: '1px solid #eee', 
                paddingTop: '12px', 
                marginBottom: '8px' 
              }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>Recent Notes</h3>
              </div>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {notes.map(note => (
                  <div 
                    key={note.id} 
                    style={{ 
                      padding: '10px', 
                      borderRadius: '6px', 
                      border: '1px solid #eee',
                      background: 'white'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: '13px', 
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>{note.title}</h4>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '12px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>{note.note}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={() => handleEditNote(note)} 
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: '#1a73e8', 
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteNote(note.id)} 
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: '#ea4335', 
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Popup;