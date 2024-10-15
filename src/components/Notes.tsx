import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import moment from 'moment';

interface Note {
  id: string;
  content: string;
  timestamp: Date;
}

interface NotesProps {
  projectId?: string;
  readOnly?: boolean;
}

const Notes: React.FC<NotesProps> = ({ projectId, readOnly = false }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser && projectId) {
      const q = query(
        collection(db, 'notes'),
        where('userId', '==', currentUser.uid),
        where('projectId', '==', projectId)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedNotes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate()
        } as Note));
        setNotes(fetchedNotes);
      });

      return () => unsubscribe();
    }
  }, [currentUser, projectId]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim() && currentUser && projectId) {
      await addDoc(collection(db, 'notes'), {
        content: newNote,
        timestamp: new Date(),
        userId: currentUser.uid,
        projectId: projectId,
      });
      setNewNote('');
    }
  };

  const deleteNote = async (id: string) => {
    await deleteDoc(doc(db, 'notes', id));
  };

  const updateNote = async (id: string, newContent: string) => {
    await updateDoc(doc(db, 'notes', id), { content: newContent });
  };

  if (readOnly) {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Project Notes</h3>
        <ul>
          {notes.map((note) => (
            <li key={note.id} className="mb-2">
              <p>{note.content}</p>
              <p className="text-sm text-gray-500">{moment(note.timestamp).format('MMMM D, YYYY')}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

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
              <p className="text-sm text-gray-500">{moment(note.timestamp).format('MMMM D, YYYY')}</p>
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
