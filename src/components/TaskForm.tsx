import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Contractor, Holiday } from '../types';

const TaskForm: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        const contractorsQuery = query(collection(db, 'contractors'), where('userId', '==', currentUser.uid));
        const holidaysQuery = query(collection(db, 'holidays'), where('userId', '==', currentUser.uid));

        const [contractorsSnapshot, holidaysSnapshot] = await Promise.all([
          getDocs(contractorsQuery),
          getDocs(holidaysQuery)
        ]);

        setContractors(contractorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contractor)));
        setHolidays(holidaysSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          name: doc.data().name,
          date: doc.data().date instanceof Timestamp ? doc.data().date.toDate() : new Date(doc.data().date)
        } as Holiday)));
      }
    };

    fetchData();
  }, [currentUser]);

  const checkHolidayConflict = (taskDate: Date) => {
    return holidays.find(holiday => holiday.date.toDateString() === taskDate.toDateString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentUser || !projectId) {
      setError('You must be logged in and have a project selected to create a task');
      return;
    }

    const taskDate = new Date(date);

    const conflictingHoliday = checkHolidayConflict(taskDate);

    if (conflictingHoliday) {
      setError(`Task conflicts with holiday: ${conflictingHoliday.name} on ${conflictingHoliday.date.toLocaleDateString()}`);
      return;
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        name,
        description,
        date: Timestamp.fromDate(taskDate),
        contractorId,
        userId: currentUser.uid,
        projectId: projectId,
      });

      navigate(`/calendar/${projectId}`);
    } catch (error) {
      setError('Failed to create task');
      console.error('Error adding task:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Create New Task</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
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
        <label htmlFor="description" className="block mb-2">Description:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        ></textarea>
      </div>
      <div className="mb-4">
        <label htmlFor="date" className="block mb-2">Date:</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="contractor" className="block mb-2">Contractor:</label>
        <select
          id="contractor"
          value={contractorId}
          onChange={(e) => setContractorId(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Select a contractor</option>
          {contractors.map((contractor) => (
            <option key={contractor.id} value={contractor.id}>{contractor.name}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Create Task
      </button>
    </form>
  );
};

export default TaskForm;