import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = ({ user, setUser }) => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [seuils, setSeuils] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Récupération utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/utilisateurs/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUtilisateur(res.data);
      } catch (err) {
        console.error("Erreur utilisateur:", err);
        setError("Impossible de récupérer l'utilisateur.");
      }
    };
    fetchUser();
  }, [token]);

  // Appliquer le thème choisi par l'utilisateur
  useEffect(() => {
    if (!utilisateur?.preferences?.theme) return;
    const theme = utilisateur.preferences.theme;
    if (theme === 'dark') {
      document.body.classList.add('bg-dark', 'text-white');
    } else {
      document.body.classList.remove('bg-dark', 'text-white');
    }
    return () => {
      document.body.classList.remove('bg-dark', 'text-white');
    };
  }, [utilisateur?.preferences?.theme]);

  const handleSeuilChange = (e, appareilId) => {
    setSeuils({ ...seuils, [appareilId]: e.target.value });
  };

  const handleUpdateSeuil = async (appareilId) => {
    const seuil = seuils[appareilId];
    if (!seuil || isNaN(seuil)) {
      alert("❗ Veuillez entrer un seuil numérique valide.");
      return;
    }
    try {
      await axios.patch(
        `http://localhost:5000/api/appareils/${appareilId}/seuil`,
        { seuil: parseInt(seuil) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Seuil mis à jour !");
    } catch (err) {
      console.error("Erreur mise à jour seuil:", err);
      alert("❌ Erreur lors de la mise à jour.");
    }
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

  const unite = utilisateur?.preferences?.unite || 'kWh';

  return (
    <div className="dashboard-container">
      <h2>Bienvenue, {utilisateur?.prenom} {utilisateur?.nom} !</h2>
      <p>Email : {utilisateur?.email}</p>
      <h3>📡 Appareils Connectés</h3>
      <ul className="list-group">
        {utilisateur?.appareils && utilisateur.appareils.length > 0 ? (
          utilisateur.appareils.map((appareil) => (
            <li key={appareil._id} className="list-group-item">
              <strong>{appareil.nom}</strong> – {appareil.marque}<br />
              Seuil : {appareil.seuil ?? 'non défini'} {unite}
              <div className="mt-2 d-flex gap-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder={`Nouveau seuil (${unite})`}
                  value={seuils[appareil._id] || ''}
                  onChange={(e) => handleSeuilChange(e, appareil._id)}
                />
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleUpdateSeuil(appareil._id)}
                >
                  Enregistrer
                </button>
              </div>
            </li>
          ))
        ) : (
          <li>Aucun appareil connecté.</li>
        )}
      </ul>
      <button onClick={handleDeleteAccount} className="delete-account-button">Supprimer mon compte</button>
    </div>
  );
};

export default Dashboard;