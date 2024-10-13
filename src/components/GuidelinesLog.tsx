import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

interface Guideline {
  id: string;
  content: string;
  timestamp: Date;
}

const GuidelinesLog: React.FC = () => {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [newGuideline, setNewGuideline] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchGuidelines = async () => {
      if (currentUser) {
        const q = query(collection(db, 'guidelines'), where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        setGuidelines(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guideline)));
      }
    };

    fetchGuidelines();
  }, [currentUser]);

  const addGuideline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGuideline.trim() && currentUser) {
      const guidelineDoc = await addDoc(collection(db, 'guidelines'), {
        content: newGuideline,
        timestamp: new Date(),
        userId: currentUser.uid,
      });
      setGuidelines([...guidelines, { id: guidelineDoc.id, content: newGuideline, timestamp: new Date() }]);
      setNewGuideline('');
    }
  };

  const deleteGuideline = async (id: string) => {
    await deleteDoc(doc(db, 'guidelines', id));
    setGuidelines(guidelines.filter(guideline => guideline.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Project Guidelines</h2>
      <form onSubmit={addGuideline} className="mb-4">
        <textarea
          value={newGuideline}
          onChange={(e) => setNewGuideline(e.target.value)}
          placeholder="Add new guideline"
          className="w-full px-3 py-2 border rounded mr-2"
          rows={3}
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
          Add Guideline
        </button>
      </form>
      <ul>
        {guidelines.map((guideline) => (
          <li key={guideline.id} className="bg-white shadow-md rounded-lg p-4 mb-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{guideline.content}</p>
              <p className="text-sm text-gray-500">{guideline.timestamp.toLocaleString()}</p>
            </div>
            <button
              onClick={() => deleteGuideline(guideline.id)}
              className="bg-red-500 text-white px-2 py-1 rounded"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GuidelinesLog;