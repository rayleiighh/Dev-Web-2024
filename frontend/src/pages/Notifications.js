import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Aucun token trouvé. L'utilisateur n'est peut-être pas connecté.");
      return;
    }
  
    axios.get('http://localhost:5000/api/notifications', {
      headers: { Authorization: `Bearer ${token}` } // 🔥 Assure que le token est bien ajouté
    })
    .then(res => setNotifications(res.data))
    .catch(err => {
      console.error("Erreur lors de la récupération des notifications:", err);
      setError("Impossible de récupérer les notifications.");
    });
  }, []);
  

  return (
    <div className="container mt-4">
      <h2>🔔 Notifications</h2>
      {error && <p className="text-danger">{error}</p>}
      {notifications.length === 0 ? (
        <p>Aucune notification.</p>
      ) : (
        <ul className="list-group">
          {notifications.map((notif) => (
            <li key={notif._id} className="list-group-item d-flex justify-content-between align-items-center">
              {notif.contenu ? notif.contenu : "Message indisponible"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
