import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
import { Task, Contractor, Holiday } from '../types';
import TaskModal from './TaskModal';
import { usePDF } from 'react-to-pdf';
import Notes from './Notes';
import ContractorList from './ContractorList';

const localizer = momentLocalizer(moment);

const Calendar: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const { currentUser } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();
  const { toPDF, targetRef } = usePDF({filename: `${projectName}_${moment().format('MMMM')}_calendar.pdf`});

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser && projectId) {
        const projectQuery = query(collection(db, 'projects'), where('id', '==', projectId));
        const projectSnapshot = await getDocs(projectQuery);
        
        if (!projectSnapshot.empty) {
          const projectData = projectSnapshot.docs[0].data();
          setProjectName(projectData.name);

          const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId));
          const contractorsQuery = query(collection(db, 'contractors'), where('userId', '==', currentUser.uid));
          const holidaysQuery = query(collection(db, 'holidays'), where('userId', '==', currentUser.uid));

          const [tasksSnapshot, contractorsSnapshot, holidaysSnapshot] = await Promise.all([
            getDocs(tasksQuery),
            getDocs(contractorsQuery),
            getDocs(holidaysQuery)
          ]);

          setTasks(tasksSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              start: data.date.toDate(),
              end: data.date.toDate(),
            } as Task;
          }));
          setContractors(contractorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contractor)));
          setHolidays(holidaysSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              date: data.date.toDate(),
            } as Holiday;
          }));

          console.log('Fetched contractors:', contractorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      }
    };

    fetchData();
  }, [currentUser, projectId]);

  // ... (rest of the component code remains the same)

  return (
    <div ref={targetRef} className="container mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">{projectName || 'Project Calendar'}</h1>
      <div className="mb-4">
        <Link to={`/task/${projectId}`} className="bg-green-500 text-white px-4 py-2 rounded mr-2">
          Add New Task
        </Link>
        <button onClick={() => toPDF()} className="bg-blue-500 text-white px-4 py-2 rounded">
          Export to PDF
        </button>
      </div>
      <div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-3/4 pr-0 lg:pr-4 mb-8 lg:mb-0">
          <BigCalendar
            localizer={localizer}
            events={allEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            onSelectEvent={handleSelectEvent}
            onDoubleClickEvent={handleDoubleClickEvent}
            onEventDrop={handleDragEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={(event: any) => {
              if (event.resource === 'holiday') {
                return {
                  style: {
                    backgroundColor: 'red',
                    color: 'white',
                  }
                };
              }
              return eventStyleGetter(event as Task);
            }}
          />
        </div>
        <div className="w-full lg:w-1/4">
          <Notes projectId={projectId} />
          <ContractorList contractors={contractors} />
        </div>
      </div>
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={closeModal}
          contractors={contractors}
          projectId={projectId || ''}
          onUpdate={handleTaskUpdate}
          holidays={holidays}
        />
      )}
    </div>
  );
};

export default Calendar;