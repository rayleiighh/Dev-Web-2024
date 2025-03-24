import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotificationsPage from './pages/Notifications';
import Navbar from './components/Navbar';
import Preferences from './pages/Preferences';



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

  useEffect(() => {
    const utilisateur = JSON.parse(localStorage.getItem('utilisateur'));
    const theme = utilisateur?.preferences?.theme || 'light';
  
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);
  

  return (
    <Router>
      <Navbar user={user} setUser={setUser} notifications={notifications} setNotifications={setNotifications} />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} notifications={notifications} /> : <Navigate to="/" />} />
        <Route path="/notifications" element={user ? <NotificationsPage user={user} notifications={notifications} setNotifications={setNotifications} /> : <Navigate to="/" />} />
        <Route path="/preferences" element={<Preferences user={user} setUser={setUser} />} />
        </Routes>
    </Router>
  );
};

export default App;
