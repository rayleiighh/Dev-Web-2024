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
import ForgotPassword from './pages/ForgotPassword';
import ResetPasswordProtected from './components/ResetPasswordProtected';



const App = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${process.env.REACT_APP_API_URL}/api/utilisateurs/me`, {
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
        .finally(() => setIsLoading(false)); 
    } else {
      setIsLoading(false); // si pas de token, on arrête aussi le chargement
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const socket = io(`${process.env.REACT_APP_API_URL}`, { auth: { token } });

    socket.on('connect', () => {
      
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
      
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const token = localStorage.getItem('token');
    axios.get(`${process.env.REACT_APP_API_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setNotifications(res.data))
      .catch(err => {
        
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
        <Route path="/gestion-appareils" element={user ? <GestionAppareils /> : <Navigate to="/login" replace />} />
        <Route path="/historique" element={user ? <Historique /> : <Navigate to="/login" replace />} />
        <Route path="/parametre" element={user ? <Parametre setUser={setUser} /> : <Navigate to="/" />} />
        <Route path="/profil" element={user ? <Profil user={user} setUser={setUser} /> : <Navigate to="/" />} />
        <Route path="/verifier-email" element={<VerifierEmail />} />
        <Route path="/contact" element={user ? <Contact user={user} /> : <Navigate to="/login" replace />}/>
        <Route path="/contact-login" element={<ContactLogin />} />
        <Route path="/oubli-motdepasse" element={<ForgotPassword />} />
        <Route path="/reset-mot-de-passe" element={<ResetPasswordProtected />}/>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
 
      </Routes>
    </Router>
  );
};

export default App;
