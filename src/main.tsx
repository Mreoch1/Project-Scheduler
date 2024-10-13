import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

// Add this console log to check if environment variables are loaded
console.log('Firebase API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('All env variables:', import.meta.env);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);