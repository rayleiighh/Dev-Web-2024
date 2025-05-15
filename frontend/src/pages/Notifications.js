import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Notifications.css';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = ({ user, notifications, setNotifications }) => {
  const [error, setError] = useState(null);
  const theme = user?.preferences?.theme;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setNotifications(res.data);
      } catch (err) {
        console.error("❌ Erreur lors du chargement des notifications:", err);
        setError("Impossible de charger les notifications.");
      }
    };

    if (notifications.length === 0) {
      fetchNotifications();
    }
  }, []); // Pas de dépendance ici pour éviter une boucle infinie

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
      <div className="d-flex align-items-center mb-4">
        <button
          className="btn btn-outline-dark rounded-circle fixed-button"
          onClick={() => navigate(-1)}
          aria-label="Retour"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <h5 className="ms-auto me-auto">Notifications</h5>
      </div>

      {/* Contenu des notifications */}
      {error && <p className="text-danger">{error}</p>}
      {notifications.length === 0 ? (
        <p>Aucune notification.</p>
      ) : (
        <ul className="notif-list">
          {notifications.map((notif) => (
            <li key={notif._id} className="notif-card-modern">
              <div className="notif-header">
                <div className="notif-icon-modern">
                  <i className={`bi ${
                    notif.contenu.toLowerCase().includes("mode nuit") ? "bi-moon-fill" : "bi-exclamation-triangle-fill"
                  }`}></i>
                </div>
                <div className="notif-main">
                  <div className="notif-title-modern">
                    {notif.contenu.toLowerCase().includes("mode nuit") ? "Mode nuit activé" : "Alerte de consommation"}
                  </div>
                  <div className="notif-detail-modern">{notif.contenu}</div>
                </div>
              </div>

              <div className="notif-footer">
                <span className="notif-date-modern">{new Date(notif.createdAt).toLocaleString()}</span>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => supprimerNotification(notif._id)}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
