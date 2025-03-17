import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Utilisateur non authentifié.");
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(response.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des notifications:", err);
        setError("Impossible de récupérer les notifications.");
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Bienvenue, {user?.prenom} {user?.nom} !</h2>
      <p>Votre email : {user?.email}</p>

      <h3>Vos Appareils Connectés :</h3>
      <ul>
        {user?.appareils && user.appareils.length > 0 ? (
          user.appareils.map((appareil) => (
            <li key={appareil._id}>{appareil.nom} - {appareil.marque}</li>
          ))
        ) : (
          <p>Aucun appareil connecté.</p>
        )}
      </ul>

      {/* 🔥 Section Notifications */}
      <h3>📢 Notifications</h3>
      {error && <p className="text-danger">{error}</p>}
      {notifications.length === 0 ? (
        <p>Aucune notification.</p>
      ) : (
        <ul className="list-group">
          {notifications.map((notif) => (
            <li key={notif._id} className="list-group-item d-flex align-items-center">
              ⚠️ {notif.contenu}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
