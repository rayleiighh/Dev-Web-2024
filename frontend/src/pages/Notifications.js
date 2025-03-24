import React, { useState } from 'react';
import axios from 'axios';

const NotificationsPage = ({ notifications, setNotifications }) => {
  const [error, setError] = useState(null);

  // 🔥 Fonction pour supprimer une notification
  const supprimerNotification = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Rafraîchir l'affichage localement
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("❌ Erreur lors de la suppression :", err);
      setError("Erreur lors de la suppression de la notification.");
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
              <button
                className="btn btn-sm btn-danger"
                onClick={() => supprimerNotification(notif._id)}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
