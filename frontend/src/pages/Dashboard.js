// 📌 Dashboard.js - Page principale après connexion
import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm("Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible !");
    if (!confirmation) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/api/utilisateurs/supprimer-compte', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Suppression des données locales
      localStorage.removeItem('token');
      setUser(null);
      navigate('/'); // Redirige vers la page de connexion
    } catch (error) {
      console.error("Erreur lors de la suppression du compte :", error);
      alert("Une erreur est survenue lors de la suppression du compte.");
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Bienvenue, {user.prenom} {user.nom} !</h2>
      <p>Votre email : {user.email}</p>

      <h3>Vos Appareils Connectés :</h3>
      <ul>
        {user.appareils && user.appareils.length > 0 ? (
          user.appareils.map((appareil) => (
            <li key={appareil._id}>{appareil.nom} - {appareil.marque}</li>
          ))
        ) : (
          <p>Aucun appareil connecté.</p>
        )}
      </ul>

      {/* Bouton de suppression de compte */}
      <button onClick={handleDeleteAccount} className="delete-account-button">
        Supprimer mon compte
      </button>
    </div>
  );
};

export default Dashboard;
