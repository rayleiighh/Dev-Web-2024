import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';


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
     // 🔌 WebSocket
  const socket = io('http://localhost:5000');

  socket.on('connect', () => {
    console.log('✅ WebSocket Notifications connecté');
  });

  socket.on('nouvelle-notification', (notif) => {
    console.log('📥 Nouvelle notification reçue via WS:', notif);
    setNotifications(prev => [notif, ...prev]);
  });

  return () => {
    socket.disconnect();
    console.log('❌ WebSocket Notifications déconnecté');};
  }, []);
  
// 🔥 Fonction pour supprimer une notification
const supprimerNotification = async (id) => {
  try {
    const token = localStorage.getItem("token");
    await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Rafraîchir l'affichage
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  } catch (err) {
    console.error("❌ Erreur lors de la suppression :", err);
    alert("Erreur lors de la suppression de la notification.");
  }
};

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
            {notif.contenu}
            <button className="btn btn-sm btn-danger" onClick={() => supprimerNotification(notif._id)}>Supprimer</button>
          </li>
        ))}

        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
