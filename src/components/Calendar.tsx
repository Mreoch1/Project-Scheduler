import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import moment from 'moment';
import { useAuth } from '../contexts/AuthContext';
import { useContractors } from '../contexts/ContractorContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { Task, Holiday } from '../types';
import TaskModal from './TaskModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Notes from './Notes';
import ContractorList from './ContractorList';

const Calendar: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [showNotes, setShowNotes] = useState(false);
  const { currentUser } = useAuth();
  const { contractors } = useContractors();
  const { projectId } = useParams<{ projectId: string }>();
  const calendarRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(moment());

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser && projectId) {
        try {
          console.log('Fetching data for user:', currentUser.uid, 'and project:', projectId);
          
          const projectDoc = doc(db, 'projects', projectId);
          const projectSnapshot = await getDoc(projectDoc);
          
          if (projectSnapshot.exists()) {
            const projectData = projectSnapshot.data();
            setProjectName(projectData.name);
            console.log('Project found:', projectData.name);

            const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId));
            const holidaysQuery = query(collection(db, 'holidays'), where('domain', '==', currentUser.email?.split('@')[1] || ''));

            console.log('Fetching tasks and holidays...');
            const [tasksSnapshot, holidaysSnapshot] = await Promise.all([
              getDocs(tasksQuery),
              getDocs(holidaysQuery)
            ]);

            console.log('Tasks snapshot size:', tasksSnapshot.size);
            console.log('Holidays snapshot size:', holidaysSnapshot.size);

            const fetchedTasks = tasksSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                start: data.date.toDate(),
                end: data.date.toDate(),
                title: data.name,
              } as Task;
            });
            setTasks(fetchedTasks);
            console.log('Fetched tasks:', fetchedTasks);

            setHolidays(holidaysSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name,
                date: data.date.toDate(),
              } as Holiday;
            }));
          } else {
            console.log('No project found with id:', projectId);
            setError(`Project not found. Please go back to the project list and select a valid project.`);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setError('An error occurred while fetching data. Please try again.');
        }
      } else {
        console.log('No current user or project ID');
        setError('Please log in and select a project.');
      }
    };

    fetchData();
  }, [currentUser, projectId]);

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const renderCalendarDay = (day: moment.Moment, tasksForDay: Task[], holidayForDay: Holiday | undefined, isPDF: boolean) => {
    const taskHeight = isPDF ? 24 : 32;
    const cellHeight = Math.max(120, Math.min(200, tasksForDay.length * taskHeight + 40));

    const truncateText = (text: string, maxLength: number) => {
      return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    };

    return (
      <div 
        key={day.format('YYYY-MM-DD')} 
        className={`day-cell ${day.month() !== currentDate.month() ? 'other-month' : ''} ${holidayForDay ? 'holiday' : ''}`}
        style={{ height: `${cellHeight}px` }}
      >
        <div className="day-number">{day.date()}</div>
        {holidayForDay && <div className="holiday-marker">{holidayForDay.name}</div>}
        <div className="tasks-container">
          {tasksForDay.map(task => {
            const maxNameLength = isPDF ? 20 : 25;
            const maxDescLength = isPDF ? 25 : 35;
            const truncatedName = truncateText(task.name, maxNameLength);
            const truncatedDesc = task.description ? truncateText(task.description, maxDescLength) : '';

            return (
              <div
                key={task.id}
                className="task-marker"
                style={{ 
                  backgroundColor: contractors.find(c => c.id === task.contractorId)?.color || '#3174ad',
                }}
                onClick={() => !isPDF && setSelectedTask(task)}
              >
                <div className="font-bold">{truncatedName}</div>
                {truncatedDesc && (
                  <div className="task-description">
                    {truncatedDesc}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendar = (isPDF: boolean = false) => {
    const startDate = currentDate.clone().startOf('month').startOf('week');
    const endDate = currentDate.clone().endOf('month').endOf('week');

    const calendar = [];
    let week = [];

    for (let day = startDate.clone(); day.isBefore(endDate); day.add(1, 'day')) {
      const tasksForDay = tasks.filter(task => {
        const taskDate = task.date instanceof Timestamp ? task.date.toDate() : new Date(task.date);
        const taskMoment = moment.utc(taskDate).startOf('day');
        const dayMoment = day.clone().utc().startOf('day');
        const isSameDay = taskMoment.isSame(dayMoment);
        console.log('Comparing task date:', taskDate.toUTCString(), 'with calendar day:', day.toDate().toUTCString(), 'Result:', isSameDay);
        return isSameDay;
      });
      const holidayForDay = holidays.find(holiday => 
        moment.utc(holiday.date).startOf('day').isSame(day.clone().utc().startOf('day'))
      );

      week.push(renderCalendarDay(day, tasksForDay, holidayForDay, isPDF));

      if (week.length === 7) {
        calendar.push(<div key={day.format('YYYY-MM-DD')} className="week">{week}</div>);
        week = [];
      }
    }

    if (week.length > 0) {
      calendar.push(<div key={endDate.format('YYYY-MM-DD')} className="week">{week}</div>);
    }

    return calendar;
  };

  const generatePDF = async () => {
    if (calendarRef.current) {
      const canvas = await html2canvas(calendarRef.current, { 
        scale: 2,
        windowWidth: calendarRef.current.scrollWidth,
        windowHeight: calendarRef.current.scrollHeight,
        logging: true,
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector('.calendar-container') as HTMLElement;
          if (element) {
            element.style.width = `${calendarRef.current?.scrollWidth}px`;
            element.style.height = `${calendarRef.current?.scrollHeight}px`;
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = 297; // A4 width in mm (landscape)
      const pdfHeight = 210; // A4 height in mm (landscape)
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 20;

      pdf.setFontSize(16);
      pdf.text(`${projectName} - ${currentDate.format('MMMM YYYY')}`, pdfWidth / 2, 15, { align: 'center' });
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${projectName}_${currentDate.format('MMMM_YYYY')}_calendar.pdf`);
    }
  };

  return (
    <div className="container mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">{projectName || 'Project Calendar'}</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4 print:hidden">
        <Link to={`/task/${projectId}`} className="bg-green-500 text-white px-4 py-2 rounded mr-2">
          Add New Task
        </Link>
        <button onClick={generatePDF} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
          Export to PDF
        </button>
        <button onClick={() => setShowNotes(true)} className="bg-yellow-500 text-white px-4 py-2 rounded">
          Add Notes
        </button>
      </div>
      <div className="calendar-controls mb-4 print:hidden">
        <button onClick={() => setCurrentDate(currentDate.clone().subtract(1, 'month'))}>Previous Month</button>
        <span className="mx-4">{currentDate.format('MMMM YYYY')}</span>
        <button onClick={() => setCurrentDate(currentDate.clone().add(1, 'month'))}>Next Month</button>
      </div>
      <div ref={calendarRef} className="calendar-container">
        <h2 className="text-xl font-bold mb-4">{currentDate.format('MMMM YYYY')}</h2>
        <div className="calendar mb-8">
          <div className="weekdays">
            {moment.weekdaysShort().map(day => <div key={day}>{day}</div>)}
          </div>
          {renderCalendar(false)}
        </div>
        <div className="flex justify-between mt-8">
          <div className="w-1/2 pr-4">
            <ContractorList contractors={contractors} />
          </div>
          <div className="w-1/2 pl-4">
            <Notes projectId={projectId} readOnly={true} />
          </div>
        </div>
      </div>
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          contractors={contractors}
          projectId={projectId || ''}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          holidays={holidays}
        />
      )}
      {showNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <Notes projectId={projectId} />
            <button 
              onClick={() => setShowNotes(false)} 
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
            >
              Close Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
