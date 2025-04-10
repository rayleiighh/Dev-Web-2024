import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Notifications.css';
import { useNavigate } from 'react-router-dom'; // ← Ajout de l'import pour la navigation

const NotificationsPage = ({ user, notifications, setNotifications }) => {
  const [error, setError] = useState(null);
  const theme = user?.preferences?.theme;
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifications`, {
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
  }, []);
  
  const navigate = useNavigate(); // ← Pour revenir à la page précédente

  const supprimerNotification = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/notifications/${id}`, {
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
