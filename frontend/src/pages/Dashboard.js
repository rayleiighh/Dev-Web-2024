import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './Dashboard.css';
import IconButton from '../components/IconButton'; 

function Dashboard({ user, setUser  }) {
  const [utilisateur, setUtilisateur] = useState(user);
  useEffect(() => {
  setUtilisateur(user);
  }, [user]);

  const [derniereConso, setDerniereConso] = useState(null);
  const [seuils, setSeuils] = useState({});
  const [error, setError] = useState(null);
  const [multipriseActive, setMultipriseActive] = useState(true); 
  const timeoutRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [favoris, setFavoris] = useState([]);

  
  const isMultipriseActive = () => {
    if (!derniereConso || !derniereConso.timestamp) return false;
    const now = new Date();
    const dateConso = new Date(derniereConso.timestamp);
    return (now - dateConso) / 1000 < 45; 
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/consommations/latest', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        if (!response.ok) {
          throw new Error(`Erreur HTTP : ${response.status}`);
        }
  
        const data = await response.json();
        
  
        if (!multipriseActive) { 
          if (data.active === false) {
            setMultipriseActive(false);
            setDerniereConso(null);
          } else {
            setMultipriseActive(true);
            setDerniereConso(data);
          }
        }
  
      } catch (error) {
        
      }
    }, 30000); // Toutes les 30 secondes seulement
  
    return () => clearInterval(interval);
  }, [multipriseActive]);
  

  useEffect(() => {
    if (!socketRef.current) {
      
      socketRef.current = io("http://localhost:5000", {
        transports: ['websocket']
      });
  
      socketRef.current.on('connect', () => {
        
      });
  
      socketRef.current.on('nouvelleConsommation', (data) => {
        
        setDerniereConso(data);
        setMultipriseActive(true);
  
        // Reset du timer
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          
          setMultipriseActive(false);
          setDerniereConso(null);
        }, 60000); // 60 secondes de marge si plus de nouvelles données WebSocket
      });
  
      socketRef.current.on('disconnect', () => {
        
      });
    }
  
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  

  useEffect(() => {
    const fetchFavoris = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/appareils', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data;

        // On filtre uniquement les appareils favoris
        const favorisFiltres = data.filter((appareil) => appareil.favori === true);

        setFavoris(favorisFiltres);
      } catch (err) {
        
      }
    };

    fetchFavoris();
  }, [token]);


  useEffect(() => {
    if (!utilisateur?.preferences?.theme) return;
    const theme = utilisateur.preferences.theme;
    if (theme === 'dark') {
      document.body.classList.add('bg-dark', 'text-white');
    } else {
      document.body.classList.remove('bg-dark', 'text-white');
    }
    return () => {
      document.body.classList.remove('bg-dark', 'text-white');
    };
  }, [utilisateur?.preferences?.theme]);





  return (
    <div className="container py-4 text-dark" style={{ fontFamily: 'Poppins, sans-serif' }}>
      
      {/* SECTION UTILISATEUR */}
      <div className="user-header d-flex justify-content-between align-items-start mb-4">
        {/* Partie gauche : photo de profil + titre + message de bienvenue */}
        <div className="d-flex align-items-start gap-3">
          {/* Emplacement pour la photo de profil */}
          <div
            className="profile-picture-placeholder rounded-circle bg-light"
            style={{
              width: 60,
              height: 60,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
          {utilisateur?.photoProfil ? (
          <img
          src={`http://localhost:5000/${utilisateur.photoProfil}`}
          alt="Profil"
          className="rounded-circle"
          crossOrigin="anonymous"
          style={{ width: 60, height: 60, objectFit: 'cover' }}
        />
        
        
          ) : (
            <div className="profile-picture-placeholder rounded-circle bg-light" style={{ width: 60, height: 60 }}></div>
          )}

        </div>

          {/* Titre et message de bienvenue */}
          <div>
            <h1 className="app-title mb-1">PowerTrack ⚡</h1>
            <h2 className="welcome-message">
              Salut, <strong>{user?.prenom || 'Utilisateur'}</strong> !
            </h2>
          </div>
        </div>

        {/* Partie droite : boutons  (Settings) et  (Notification) alignés verticalement */}
        <div className="d-flex flex-column align-items-center gap-2">
          <IconButton
            icon="icons8-settings-50.png"
            label=""
            onClick={() => navigate('/parametre')}
            className="rounded-circle"
          />

          <IconButton
            icon="icons8-notification-48.png"
            label=""
            onClick={() => navigate('/notifications')}
            className="rounded-circle"
          />

        </div>
      </div>

      {/* SECTION CONSOMMATION */}
      <div className="bg-white rounded p-3 shadow-sm mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold">Utilisation de l'énergie</h5>
          <IconButton
            icon="icons8-historical-data.png"
            label="Historique"
            size="sm"
            onClick={() => window.location.href = "/historique"}
          />
        </div>

        <h6 className="text-primary mt-3">📡 Donnée en temps réel</h6>
        <table className="table table-sm text-center mb-0">
          <thead>
            <tr>
              <th>Heure</th>
              <th>Énergie (kWh)</th>
              <th>Courant (A)</th>
            </tr>
          </thead>
          <tbody>
            {multipriseActive && derniereConso ? (
              <tr>
                <td>{new Date(derniereConso.timestamp).toLocaleTimeString('fr-FR', { timeZone: 'UTC' })}</td>
                <td>{(derniereConso.value * 0.001).toFixed(4)}</td>
                <td>{derniereConso.value.toFixed(3)}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan="3">
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border spinner-border-sm text-danger me-2" role="status"></div>
                    <span className="text-danger">Multiprise éteinte ou hors ligne...</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SECTION FAVORIS */}
      <div className="bg-white rounded p-3 shadow-sm mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="fw-bold">Appareils (Favoris)</h5>
          <IconButton
            icon="icons8-devices.png"
            label="Appareils"
            onClick={() => window.location.href = "gestion-appareils"}
          />
        </div>

        {favoris.length > 0 ? (
          <div className="favoris-grid">
            {favoris.map((item, index) => (
              <div key={item._id || index} className="favori-item">
                <div className="favori-icon bg-primary"></div>
                <span className="favori-nom">{item.nom}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted fst-italic">Aucun appareil en favori pour l’instant.</div>
        )}


      </div>

      {/* SECTION CONTACT */}
      <div className="bg-white rounded p-3 shadow-sm text-center">
        <h5 className="mb-2">Contactez-nous</h5>
        <IconButton
          icon="icons8-envoyer-un-document.png"
          label="Contact"
          onClick={() => window.location.href = "/contact"}
          className="px-4"
        />
      </div>
    </div>
  );
}

export default Dashboard;