import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Header from './components/Header';
import Calendar from './components/Calendar';
import TaskForm from './components/TaskForm';
import ContractorForm from './components/ContractorForm';
import Notes from './components/Notes';
import Login from './components/Login';
import Register from './components/Register';
import HolidayManager from './components/HolidayManager';
import ProjectManager from './components/ProjectManager';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <Header />
          <div className="container mx-auto py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<PrivateRoute><ProjectManager /></PrivateRoute>} />
              <Route path="/calendar/:projectId" element={<PrivateRoute><Calendar /></PrivateRoute>} />
              <Route path="/task/:projectId" element={<PrivateRoute><TaskForm /></PrivateRoute>} />
              <Route path="/contractor" element={<PrivateRoute><ContractorForm /></PrivateRoute>} />
              <Route path="/notes/:projectId" element={<PrivateRoute><Notes /></PrivateRoute>} />
              <Route path="/holidays" element={<PrivateRoute><HolidayManager /></PrivateRoute>} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
