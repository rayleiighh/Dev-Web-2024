import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Parametre({ user, setUser }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm("Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible !");
    if (!confirmation) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/utilisateurs/supprimer-compte`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.removeItem('token');
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error("Erreur lors de la suppression du compte :", error);
      alert("Une erreur est survenue lors de la suppression du compte.");
    }
  };

  return (
    <div className="container-gestion">
      <div className="d-flex align-items-center justify-content-between px-3 py-2">
        <button
          className="btn btn-outline-dark rounded-circle"
          onClick={() => navigate(-1)} // Retour à la page précédente
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <h5 className="mb-0">Paramètres</h5>
        <div></div>
      </div>

      <div className="d-flex flex-column align-items-center gap-3 mt-4">
      <button 
          className="btn btn-secondary w-50" 
          onClick={() => navigate('/profil')}
        >
         Modifier mon profil
        </button>

        <button
          className="btn btn-primary w-50"
          onClick={() => navigate('/preferences')}
        >
         Gérer mes préférences
        </button>

        <button
          className="btn btn-outline-danger w-50"
          onClick={handleLogout}
        >
         Se déconnecter
        </button>

        <button
          className="btn btn-danger w-50"
          onClick={handleDeleteAccount}
        >
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}

export default Parametre;
