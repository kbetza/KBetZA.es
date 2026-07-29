import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ClockProvider } from './context/ClockContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClockProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ClockProvider>
  </React.StrictMode>
);
