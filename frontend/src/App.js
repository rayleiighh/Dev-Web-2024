import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotificationsPage from './pages/Notifications';
import Preferences from './pages/Preferences';
import Historique from './pages/Historique';
import GestionAppareils from './pages/GestionAppareils';
// import Navbar from './components/Navbar';
import { io } from 'socket.io-client';
import Parametre from './pages/Parametre';
import Profil from './pages/Profil';
import VerifierEmail from './pages/VerifierEmail';

const App = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const socket = io(process.env.REACT_APP_API_URL, {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log("✅ Connecté au WebSocket");
    });

    socket.on('nouvelle-notification', (notif) => {
      console.log("📥 Nouvelle notification:", notif);
      setNotifications((prev) => {
        const existeDeja = prev.some((n) => n._id === notif._id);
        return existeDeja ? prev : [notif, ...prev];
      });
    });

    socket.on('supprimer-notification', (id) => {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    });

    return () => {
      socket.disconnect();
      console.log("❌ Déconnecté du WebSocket");
    };
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${process.env.REACT_APP_API_URL}/api/utilisateurs/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
        setNotifications([]);
      });
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${process.env.REACT_APP_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setNotifications(res.data))
      .catch(err => {
        console.error("Erreur lors de la récupération des notifications", err);
        setNotifications([]);
      });
    }
  }, [user]);

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
      {/* <Navbar user={user} setUser={setUser} notifications={notifications} setNotifications={setNotifications} /> */}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} setUser={setUser} notifications={notifications} /> : <Navigate to="/" />} />
        <Route path="/notifications" element={user ? <NotificationsPage user={user} notifications={notifications} setNotifications={setNotifications} /> : <Navigate to="/" />} />
        <Route path="/preferences" element={user ? <Preferences user={user} setUser={setUser} /> : <Navigate to="/" />} />
        <Route path="/gestion-appareils" element={<GestionAppareils />} />
        <Route path="/historique" element={<Historique />} />
        <Route path="/parametre" element={user ? <Parametre setUser={setUser} /> : <Navigate to="/" />} />
        <Route path="/profil" element={user ? <Profil user={user} setUser={setUser} /> : <Navigate to="/" />} />
        <Route path="/verifier-email" element={<VerifierEmail />} />
      </Routes>
    </Router>
  );
};

export default App;
