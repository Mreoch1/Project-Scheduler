import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

interface Holiday {
  id: string;
  name: string;
  date: Date;
}

const HolidayManager: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchHolidays();
  }, [currentUser]);

  const fetchHolidays = async () => {
    if (currentUser) {
      const q = query(collection(db, 'holidays'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const fetchedHolidays = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
        } as Holiday;
      });
      setHolidays(fetchedHolidays);
    }
  };

  const fetchFederalHolidays = async () => {
    const response = await fetch('https://date.nager.at/api/v3/PublicHolidays/2024/US');
    const data = await response.json();
    const federalHolidays = data.map((holiday: any) => ({
      name: holiday.name,
      date: new Date(holiday.date),
    }));
    addFederalHolidays(federalHolidays);
  };

  const addFederalHolidays = async (federalHolidays: { name: string; date: Date }[]) => {
    if (currentUser) {
      const newHolidays: Holiday[] = [];
      for (const holiday of federalHolidays) {
        const existingHoliday = holidays.find(h => 
          h.name === holiday.name && 
          h.date.toDateString() === holiday.date.toDateString()
        );
        if (!existingHoliday) {
          const holidayDoc = await addDoc(collection(db, 'holidays'), {
            name: holiday.name,
            date: holiday.date,
            userId: currentUser.uid,
          });
          newHolidays.push({ id: holidayDoc.id, ...holiday });
        }
      }
      setHolidays(prevHolidays => [...prevHolidays, ...newHolidays]);
    }
  };

  const addHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newHolidayName.trim() && newHolidayDate && currentUser) {
      const newDate = new Date(newHolidayDate);
      const existingHoliday = holidays.find(h => 
        h.name === newHolidayName && 
        h.date.toDateString() === newDate.toDateString()
      );
      if (!existingHoliday) {
        const holidayDoc = await addDoc(collection(db, 'holidays'), {
          name: newHolidayName,
          date: newDate,
          userId: currentUser.uid,
        });
        setHolidays([...holidays, { id: holidayDoc.id, name: newHolidayName, date: newDate }]);
        setNewHolidayName('');
        setNewHolidayDate('');
      } else {
        alert('A holiday with this name and date already exists.');
      }
    }
  };

  const deleteHoliday = async (id: string) => {
    await deleteDoc(doc(db, 'holidays', id));
    setHolidays(holidays.filter(holiday => holiday.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Manage Holidays</h2>
      <form onSubmit={addHoliday} className="mb-4">
        <input
          type="text"
          value={newHolidayName}
          onChange={(e) => setNewHolidayName(e.target.value)}
          placeholder="Holiday Name"
          className="w-full px-3 py-2 border rounded mb-2"
        />
        <input
          type="date"
          value={newHolidayDate}
          onChange={(e) => setNewHolidayDate(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-2"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Holiday
        </button>
      </form>
      <button 
        onClick={fetchFederalHolidays} 
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        Fetch Federal Holidays
      </button>
      <ul>
        {holidays.sort((a, b) => a.date.getTime() - b.date.getTime()).map((holiday) => (
          <li key={holiday.id} className="bg-white shadow-md rounded-lg p-4 mb-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{holiday.name}</p>
              <p className="text-sm text-gray-500">{holiday.date.toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => deleteHoliday(holiday.id)}
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

export default HolidayManager;