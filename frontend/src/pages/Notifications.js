import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Notifications.css';
import { useNavigate } from 'react-router-dom'; // ← Ajout de l'import pour la navigation

const NotificationsPage = ({ user, notifications, setNotifications }) => {
  const [error, setError] = useState(null);
  const theme = user?.preferences?.theme;
  const navigate = useNavigate(); // ← Pour revenir à la page précédente

  const supprimerNotification = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("❌ Erreur lors de la suppression:", err);
      setError("Erreur lors de la suppression de la notification.");
    }
  };

  return (
    <div className={`container mt-4 ${theme === 'dark' ? 'notifications-dark' : ''}`}>
      {/* Flèche de retour + Titre */}
      <div className="d-flex align-items-center justify-content-between px-3 py-2">
        <button
          className="btn btn-outline-dark rounded-circle"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <h5 className="mb-0">Notifications</h5>
        <div></div>
      </div>

      {/* Contenu des notifications */}
      {error && <p className="text-danger">{error}</p>}
      {notifications.length === 0 ? (
        <p>Aucune notification.</p>
      ) : (
        <ul className="list-group">
          {notifications.map((notif, index) => (
            <li
              key={`${notif._id}-${index}`}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
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
