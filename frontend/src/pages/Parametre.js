import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Parametre.css';

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
      await axios.delete('http://localhost:5000/api/utilisateurs/supprimer-compte', {
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
    <div className="parametre-container">
  <div className="top-left">
    <button
      className="btn btn-outline-dark rounded-circle fixed-button"
      onClick={() => navigate(-1)}
    >
      <i className="bi bi-arrow-left"></i>
    </button>
  </div>

  <h2 className="parametre-title">Paramètres</h2>

  <div className="btn-group">
    <button className="parametre-btn btn-modifier" onClick={() => navigate('/profil')}>
      Modifier mon profil
    </button>
    <button className="parametre-btn btn-preferences" onClick={() => navigate('/preferences')}>
      Gérer mes préférences
    </button>
    <button className="parametre-btn btn-deconnexion" onClick={handleLogout}>
      Se déconnecter
    </button>
    <button className="parametre-btn btn-supprimer" onClick={handleDeleteAccount}>
      Supprimer mon compte
    </button>
     </div>
    </div>



  );
}

export default Parametre;
