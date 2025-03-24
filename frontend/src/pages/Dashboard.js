import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './Dashboard.css';
import 'bootstrap/dist/css/bootstrap.min.css';
// import UserAvatar from '../components/UserAvatar';
import IconButton from '../components/IconButton'; // ✅ Ajoute cette ligne

function Dashboard({ user }) {
  const [derniereConso, setDerniereConso] = useState(null);
  // const [onglet, setOnglet] = useState("today");
  const socketRef = useRef(null);

  const favoris = [
    { nom: 'iPhone de Saad', couleur: 'primary' },
    { nom: 'PC Asus', couleur: 'danger' }
  ];

  useEffect(() => {
    const fetchDerniereConso = async () => {
      try {
        const response = await fetch('/api/consommations/latest');
        const data = await response.json();
        setDerniereConso(data);
      } catch (error) {
        console.error('Erreur récupération dernière consommation:', error);
      }
    };

    fetchDerniereConso();

    if (!socketRef.current) {
      socketRef.current = io("http://localhost:5000", {
        transports: ['websocket']
      });

      socketRef.current.on('connect', () => {
        console.log("🟢 Connecté au WebSocket !");
      });

      socketRef.current.on('nouvelleConsommation', (data) => {
        console.log("⚡ Donnée WebSocket reçue :", data);
        setDerniereConso(data);
      });

      socketRef.current.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      socketRef.current.on('disconnect', () => {
        console.log("🔌 WebSocket déconnecté");
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log("🔌 Socket déconnectée proprement");
      }
    };
  }, []);

  return (
    <div className="container py-4 text-dark" style={{ fontFamily: 'Poppins, sans-serif' }}>
      
      {/* SECTION UTILISATEUR */}
      <div className="user-header d-flex justify-content-between align-items-start mb-4">
        {/* Partie gauche : photo de profil + titre + message de bienvenue */}
        <div className="d-flex align-items-start gap-3">
          {/* Emplacement pour la photo de profil */}
          <div className="profile-picture-placeholder rounded-circle bg-light" style={{ width: 60, height: 60 }}>
            {/* La photo de profil sera ajoutée ici plus tard */}
          </div>

          {/* Titre et message de bienvenue */}
          <div>
            <h1 className="app-title mb-1">PowerTrack ⚡</h1>
            <h2 className="welcome-message">
              Salut, <strong>{user?.prenom || 'Utilisateur'}</strong> !
            </h2>
          </div>
        </div>

        {/* Partie droite : boutons ⚙️ (Settings) et 🔔 (Notification) alignés verticalement */}
        <div className="d-flex flex-column align-items-end gap-2">
          {/* Bouton Settings (⚙️) */}
          <IconButton
            icon="icons8-option-100.png" // Remplacez par l'icône ⚙️
            label=""
            onClick={() => {}}
            className="rounded-circle"
          />
          {/* Bouton Notification (🔔) */}
          <IconButton
            icon="icons8-notification.png" // Remplacez par l'icône 🔔
            label=""
            onClick={() => {}}
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
            {derniereConso ? (
              <tr>
                <td>{new Date(derniereConso.timestamp).toLocaleTimeString()}</td>
                <td>{(derniereConso.value * 0.001).toFixed(4)}</td>
                <td>{derniereConso.value.toFixed(3)}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan="3">
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span>En attente de données temps réel...</span>
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
            onClick={() => window.location.href = "/appareils"}
          />
        </div>
        {favoris.map((item, index) => (
          <div key={index} className="d-flex align-items-center mb-3">
            <div className={`rounded-circle bg-${item.couleur} me-3`} style={{ width: 40, height: 40 }}></div>
            <span>{item.nom}</span>
          </div>
        ))}
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