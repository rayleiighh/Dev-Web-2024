import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false); // ✅ État pour l'animation
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // ✅ Démarrer le chargement

    try {
      const res = await axios.post('http://localhost:5000/api/utilisateurs/oubli-motdepasse', {
        email
      });
      setMessage(res.data.message);
      setErreur('');
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'envoi.");
      setMessage('');
    } finally {
      setLoading(false); // ✅ Fin du chargement
    }
  };

  return (
    <div className="auth-container">
      <div className="d-flex align-items-center mb-3">
        <button onClick={() => navigate(-1)} className="btn btn-outline-dark rounded-circle me-2 fixed-button">
          <i className="bi bi-arrow-left"></i>
        </button>
      </div>

      <h2>Mot de passe oublié</h2>
      <p>Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
      {message && <p className="text-success">{message}</p>}
      {erreur && <p className="text-danger">{erreur}</p>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Votre email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* ✅ Bouton animé pendant l'envoi */}
        <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Envoi en cours...
            </>
          ) : (
            'Envoyer'
          )}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
