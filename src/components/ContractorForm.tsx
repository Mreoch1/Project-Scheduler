import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useContractors } from '../contexts/ContractorContext';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Contractor } from '../types';

const ContractorForm: React.FC = () => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#000000');
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const { contractors, setContractors } = useContractors();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError('You must be logged in to create a contractor');
      return;
    }

    try {
      const userDomain = currentUser.email?.split('@')[1] || '';
      const newContractor = {
        name,
        color,
        userId: currentUser.uid,
        domain: userDomain,
      };
      const docRef = await addDoc(collection(db, 'contractors'), newContractor);
      const addedContractor = { id: docRef.id, ...newContractor };
      setContractors(prevContractors => [...prevContractors, addedContractor]);
      setName('');
      setColor('#000000');
    } catch (error) {
      console.error('Error adding contractor:', error);
      setError('Failed to create contractor');
    }
  };

  const deleteContractor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contractors', id));
      setContractors(prevContractors => prevContractors.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting contractor:', error);
      setError('Failed to delete contractor');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manage Contractors</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label htmlFor="name" className="block mb-2">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="color" className="block mb-2">Color:</label>
          <input
            type="color"
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Create Contractor
        </button>
      </form>

      <h3 className="text-xl font-bold mb-4">Contractor List</h3>
      {contractors.length === 0 ? (
        <p>No contractors added yet. Create a new contractor above.</p>
      ) : (
        <ul>
          {contractors.map((contractor) => (
            <li key={contractor.id} className="flex items-center justify-between bg-white shadow-md rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div
                  className="w-6 h-6 rounded-full mr-4"
                  style={{ backgroundColor: contractor.color }}
                ></div>
                <span>{contractor.name}</span>
              </div>
              <button
                onClick={() => deleteContractor(contractor.id)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContractorForm;
