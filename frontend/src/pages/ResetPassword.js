import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();

  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [afficher, setAfficher] = useState(false);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false); //  Nouvel état

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (motDePasse !== confirmation) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true); //  Début du chargement
    try {
      const res = await axios.post(`http://localhost:5000/api/utilisateurs/reset-mot-de-passe/${token}`, {
        nouveauMotDePasse: motDePasse,
      });
      setMessage(res.data.message);
      setErreur('');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la réinitialisation.");
      setMessage('');
    } finally {
      setLoading(false); // Fin du chargement
    }
  };

  return (
    <div className="auth-container">
      <h2>Réinitialiser le mot de passe</h2>
      {message && <p className="text-success">{message}</p>}
      {erreur && <p className="text-danger">{erreur}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type={afficher ? "text" : "password"}
          placeholder="Nouveau mot de passe"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          required
        />
        <input
          type={afficher ? "text" : "password"}
          placeholder="Confirmez le mot de passe"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          required
        />

        <div className="custom-toggle my-3">
          <label className="switch">
            <input type="checkbox" checked={afficher} onChange={() => setAfficher(!afficher)} />
            <span className="slider round"></span>
          </label>
          <span className="ms-2">Afficher les mots de passe</span>
        </div>

        <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Changement...
            </>
          ) : (
            'Changer le mot de passe'
          )}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
