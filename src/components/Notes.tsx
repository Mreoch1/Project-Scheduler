import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface Note {
  id: string;
  content: string;
  timestamp: Date;
}

interface NotesProps {
  projectId: string | undefined;
}

const Notes: React.FC<NotesProps> = ({ projectId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchNotes = async () => {
      if (currentUser && projectId) {
        const q = query(collection(db, 'notes'), where('userId', '==', currentUser.uid), where('projectId', '==', projectId));
        const querySnapshot = await getDocs(q);
        setNotes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
      }
    };

    fetchNotes();
  }, [currentUser, projectId]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim() && currentUser && projectId) {
      const noteDoc = await addDoc(collection(db, 'notes'), {
        content: newNote,
        timestamp: new Date(),
        userId: currentUser.uid,
        projectId: projectId,
      });
      setNotes([...notes, { id: noteDoc.id, content: newNote, timestamp: new Date() }]);
      setNewNote('');
    }
  };

  const deleteNote = async (id: string) => {
    await deleteDoc(doc(db, 'notes', id));
    setNotes(notes.filter(note => note.id !== id));
  };

  const updateNote = async (id: string, newContent: string) => {
    await updateDoc(doc(db, 'notes', id), { content: newContent });
    setNotes(notes.map(note => note.id === id ? { ...note, content: newContent } : note));
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-4">Project Notes</h3>
      <form onSubmit={addNote} className="mb-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add new note"
          className="w-full px-3 py-2 border rounded mr-2"
          rows={3}
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
          Add Note
        </button>
      </form>
      <ul className="max-h-60 overflow-y-auto">
        {notes.map((note) => (
          <li key={note.id} className="bg-white shadow-md rounded-lg p-4 mb-4">
            <textarea
              value={note.content}
              onChange={(e) => updateNote(note.id, e.target.value)}
              className="w-full mb-2 p-2 border rounded"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">{note.timestamp.toLocaleString()}</p>
              <button
                onClick={() => deleteNote(note.id)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notes;