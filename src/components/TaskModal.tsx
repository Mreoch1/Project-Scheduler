import React, { useState, useEffect } from 'react';
import { Task, Contractor, Holiday } from '../types';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  contractors: Contractor[];
  projectId: string;
  onUpdate: (updatedTask: Task) => void;
  holidays: Holiday[];
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, contractors, projectId, onUpdate, holidays }) => {
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description);
  const [date, setDate] = useState(task.start.toISOString().split('T')[0]);
  const [contractorId, setContractorId] = useState(task.contractorId);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(task.name);
    setDescription(task.description);
    setDate(task.start.toISOString().split('T')[0]);
    setContractorId(task.contractorId);
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const selectedDate = new Date(date);
    const holiday = holidays.find(h => h.date.toDateString() === selectedDate.toDateString());
    if (holiday) {
      setError(`Cannot schedule on holiday: ${holiday.name}`);
      return;
    }

    const updatedTask: Task = {
      ...task,
      name,
      description,
      start: selectedDate,
      end: selectedDate,
      contractorId,
    };
    onUpdate(updatedTask);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">{task.id ? 'Edit Task' : 'Create Task'}</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
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
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="contractor" className="block mb-2">Contractor:</label>
            <select
              id="contractor"
              value={contractorId}
              onChange={(e) => setContractorId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Select a contractor</option>
              {contractors.map((contractor) => (
                <option key={contractor.id} value={contractor.id}>{contractor.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-between">
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              {task.id ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={onClose} className="bg-gray-300 text-black px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;