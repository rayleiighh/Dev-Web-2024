// 📌 Dashboard.js - Page principale après connexion
import React from 'react';
import './Dashboard.css';

const Dashboard = ({ user }) => {
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
    </div>
  );
};

export default Dashboard;
