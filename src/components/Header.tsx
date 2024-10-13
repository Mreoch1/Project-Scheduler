import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, PlusCircle, Users, StickyNote, LogOut, Gift, LogIn, UserPlus, FolderOpen } from 'lucide-react';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Project Scheduler</Link>
        <nav>
          <ul className="flex space-x-4">
            {currentUser ? (
              <>
                <li>
                  <Link to="/" className="flex items-center">
                    <FolderOpen className="mr-1" size={18} />
                    Projects
                  </Link>
                </li>
                {projectId && (
                  <>
                    <li>
                      <Link to={`/calendar/${projectId}`} className="flex items-center">
                        <Calendar className="mr-1" size={18} />
                        Calendar
                      </Link>
                    </li>
                    <li>
                      <Link to={`/task/${projectId}`} className="flex items-center">
                        <PlusCircle className="mr-1" size={18} />
                        New Task
                      </Link>
                    </li>
                    <li>
                      <Link to={`/notes/${projectId}`} className="flex items-center">
                        <StickyNote className="mr-1" size={18} />
                        Notes
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link to="/contractor" className="flex items-center">
                    <Users className="mr-1" size={18} />
                    New Contractor
                  </Link>
                </li>
                <li>
                  <Link to="/holidays" className="flex items-center">
                    <Gift className="mr-1" size={18} />
                    Holidays
                  </Link>
                </li>
                <li>
                  <button onClick={logout} className="flex items-center">
                    <LogOut className="mr-1" size={18} />
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="flex items-center">
                    <LogIn className="mr-1" size={18} />
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="flex items-center">
                    <UserPlus className="mr-1" size={18} />
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;