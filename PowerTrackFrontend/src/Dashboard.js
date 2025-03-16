import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import './styles.css';
// Zebiri Saad

const Dashboard = () => {
    const navigate = useNavigate();

    // Vérifie si l'utilisateur est connecté

    const handleLogout = () => {
        console.log("Déconnexion...");
        localStorage.removeItem("token"); // Suppression du token
        navigate('/login'); // Redirection vers la page de connexion
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Tableau de bord</h1>
                <button className="logout-button" onClick={handleLogout}>
                    <FaSignOutAlt /> Déconnexion
                </button>
            </header>
            
            <div className="dashboard-content">
                <div className="info-card">
                    <h2>Consommation en temps réel</h2>
                    <p>⚡ 250W</p>
                </div>
                
                <div className="info-card">
                    <h2>Historique</h2>
                    <p>Dernière consommation enregistrée : 320W</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
