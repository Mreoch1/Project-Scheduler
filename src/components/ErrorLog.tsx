import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

interface ErrorLogEntry {
  id: string;
  message: string;
  timestamp: Date;
}

const ErrorLog: React.FC = () => {
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [newError, setNewError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchErrors = async () => {
      if (currentUser) {
        const q = query(collection(db, 'errorLog'), where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        setErrors(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ErrorLogEntry)));
      }
    };

    fetchErrors();
  }, [currentUser]);

  const addError = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newError.trim() && currentUser) {
      const errorDoc = await addDoc(collection(db, 'errorLog'), {
        message: newError,
        timestamp: new Date(),
        userId: currentUser.uid,
      });
      setErrors([...errors, { id: errorDoc.id, message: newError, timestamp: new Date() }]);
      setNewError('');
    }
  };

  const deleteError = async (id: string) => {
    await deleteDoc(doc(db, 'errorLog', id));
    setErrors(errors.filter(error => error.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Error Log</h2>
      <form onSubmit={addError} className="mb-4">
        <input
          type="text"
          value={newError}
          onChange={(e) => setNewError(e.target.value)}
          placeholder="Add new error"
          className="w-full px-3 py-2 border rounded mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
          Add Error
        </button>
      </form>
      <ul>
        {errors.map((error) => (
          <li key={error.id} className="bg-white shadow-md rounded-lg p-4 mb-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{error.message}</p>
              <p className="text-sm text-gray-500">{error.timestamp.toLocaleString()}</p>
            </div>
            <button
              onClick={() => deleteError(error.id)}
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

export default ErrorLog;