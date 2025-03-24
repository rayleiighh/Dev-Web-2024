import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';
import { io } from 'socket.io-client';

const Dashboard = () => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [seuils, setSeuils] = useState({});
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  // 🔌 Connexion WebSocket
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('✅ Connecté au WebSocket', socket.id);
    });

    socket.on('nouvelle-notification', (notif) => {
      console.log('📥 Nouvelle notification temps réel :', notif);
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      socket.disconnect();
      console.log('❌ Déconnecté du WebSocket');
    };
  }, []);

  // 🔁 Récupérer l'utilisateur (et ses appareils)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/utilisateurs/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUtilisateur(res.data);
      } catch (err) {
        console.error("Erreur lors du chargement de l'utilisateur:", err);
        setError("Impossible de récupérer les informations utilisateur.");
      }
    };

    fetchUser();
  }, [token]);

  // 🔁 Récupérer les notifications au démarrage
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;

      try {
        const response = await axios.get('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(response.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des notifications:", err);
        setError("Impossible de récupérer les notifications.");
      }
    };

    fetchNotifications();
  }, [token]);

  const handleSeuilChange = (e, appareilId) => {
    setSeuils({ ...seuils, [appareilId]: e.target.value });
  };

  const handleUpdateSeuil = async (appareilId) => {
    const seuil = seuils[appareilId];
    if (!seuil || isNaN(seuil)) {
      alert("❗ Veuillez entrer un seuil numérique valide.");
      return;
    }

    try {
      await axios.patch(
        `http://localhost:5000/api/appareils/${appareilId}/seuil`,
        { seuil: parseInt(seuil) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Seuil mis à jour !");
    } catch (err) {
      console.error("Erreur mise à jour seuil:", err);
      alert("❌ Erreur lors de la mise à jour.");
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Bienvenue, {utilisateur?.prenom} {utilisateur?.nom} !</h2>
      <p>Email : {utilisateur?.email}</p>

      <h3>📡 Appareils Connectés</h3>
      <ul className="list-group">
        {utilisateur?.appareils && utilisateur.appareils.length > 0 ? (
          utilisateur.appareils.map((appareil) => (
            <li key={appareil._id} className="list-group-item">
              <strong>{appareil.nom}</strong> – {appareil.marque}<br />
              Seuil : {appareil.seuil ?? 'non défini'} kWh
              <div className="mt-2 d-flex gap-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Nouveau seuil"
                  value={seuils[appareil._id] || ''}
                  onChange={(e) => handleSeuilChange(e, appareil._id)}
                />
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleUpdateSeuil(appareil._id)}
                >
                  Enregistrer
                </button>
              </div>
            </li>
          ))
        ) : (
          <li>Aucun appareil connecté.</li>
        )}
      </ul>

      <h3 className="mt-4">📢 Notifications</h3>
      {error && <p className="text-danger">{error}</p>}
      {notifications.length === 0 ? (
        <p>Aucune notification.</p>
      ) : (
        <ul className="list-group">
          {notifications.map((notif) => (
            <li key={notif._id} className="list-group-item">
              ⚠️ {notif.contenu}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
