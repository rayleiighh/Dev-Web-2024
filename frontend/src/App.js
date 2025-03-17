import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotificationsPage from './pages/Notifications';
import Navbar from './components/Navbar';

const App = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5000/api/utilisateurs/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUser(res.data))
      .catch(() => localStorage.removeItem('token'));
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setNotifications(res.data))
      .catch(err => {
        console.error("Erreur lors de la récupération des notifications", err);
        setNotifications([]);
      });
    }
  }, []);
  

  return (
    <Router>
      <Navbar user={user} setUser={setUser} notifications={notifications} />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} notifications={notifications} /> : <Navigate to="/" />} />
        <Route path="/notifications" element={user ? <NotificationsPage notifications={notifications} setNotifications={setNotifications} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
