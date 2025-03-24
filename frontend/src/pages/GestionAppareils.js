import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GestionAppareils.css'; // Fichier CSS pour le style

function GestionAppareils() {
  const navigate = useNavigate();

  // Liste des appareils (peut être récupérée depuis une API ou un état global)
  const appareils = [
    { id: 1, nom: 'Prisel' },
    { id: 2, nom: 'Prisel2' },
    { id: 3, nom: 'Prisel3' },
    { id: 4, nom: 'Prisel4' },
  ];

  // Fonction pour gérer la modification d'un appareil
  const handleModifier = (id) => {
    console.log(`Modifier l'appareil avec l'ID : ${id}`);
    // Rediriger vers une page de modification ou ouvrir un modal
  };

  // Fonction pour retourner au tableau de bord
  const handleRetour = () => {
    navigate('/dashboard'); // Redirige vers le tableau de bord
  };

  return (
    <div className="gestion-appareils-container">
      <h1>Gestion des appareils</h1>

      {/* Liste des appareils */}
      <div className="appareils-list">
        {appareils.map((appareil) => (
          <div key={appareil.id} className="appareil-item">
            <span>{appareil.nom}</span>
            <button
              className="modifier-btn"
              onClick={() => handleModifier(appareil.id)}
            >
              modifier
            </button>
          </div>
        ))}
      </div>

      {/* Bouton pour retourner au tableau de bord */}
      <button className="retour-btn" onClick={handleRetour}>
        Retour au tableau de bord
      </button>
    </div>
  );
}

export default GestionAppareils;