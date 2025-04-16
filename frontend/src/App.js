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
import Parametre from './pages/Parametre';
import Profil from './pages/Profil';
import VerifierEmail from './pages/VerifierEmail';
import Contact from './pages/Contact';
import ContactLogin from './pages/ContactLogin';
import { io } from 'socket.io-client';

const App = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // 👈 nouveau state

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5000/api/utilisateurs/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
          setNotifications([]);
        })
        .finally(() => setIsLoading(false)); // 👈 stop loading quoi qu’il arrive
    } else {
      setIsLoading(false); // 👈 si pas de token, on arrête aussi le chargement
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const socket = io('http://localhost:5000', { auth: { token } });

    socket.on('connect', () => {
      console.log("✅ Connecté au WebSocket");
    });

    socket.on('nouvelle-notification', (notif) => {
      setNotifications(prev => {
        const existeDeja = prev.some(n => n._id === notif._id);
        return existeDeja ? prev : [notif, ...prev];
      });
    });

    socket.on('supprimer-notification', (id) => {
      setNotifications(prev => prev.filter(n => n._id !== id));
    });

    return () => {
      socket.disconnect();
      console.log("❌ Déconnecté du WebSocket");
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setNotifications(res.data))
      .catch(err => {
        console.error("Erreur lors de la récupération des notifications", err);
        setNotifications([]);
      });
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

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        backgroundColor: '#f4f7fa',
        fontFamily: 'Segoe UI, sans-serif'
      }}>
        <div className="loader-spinner"></div>
        <p style={{
          marginTop: '20px',
          fontSize: '18px',
          fontWeight: 500,
          color: '#555'
        }}>
          Chargement en cours...
        </p>
      </div>
      
    );
  }

  return (
    <Router>
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
        <Route path="/contact" element={<Contact user={user} />} />
        <Route path="/contact-login" element={<ContactLogin />} />
      </Routes>
    </Router>
  );
};

export default App;
