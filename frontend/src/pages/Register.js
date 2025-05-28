import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Register = () => {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (password !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }
  
    setPasswordError("");
    setLoading(true);
  
    try {
      await axios.post('http://localhost:5000/api/utilisateurs/register', {
        prenom,
        nom,
        email,
        motDePasse: password,
        deviceId
      });
      navigate('/');
    } catch (err) {
      setError("Échec de l’inscription. Vérifiez vos informations ou le numéro de série.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="auth-container">
      <h2>Inscription</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
        <input type="text" placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{
            border: passwordError ? '1px solid red' : undefined
          }}
        />
        {passwordError && (
          <p style={{ color: 'red', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {passwordError}
          </p>
        )}
        <input type="text" placeholder="Numéro de série de la multiprise" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? "Chargement..." : "S'inscrire"}</button>
      </form>
      <p>Déjà un compte ? <a href="/">Connectez-vous</a></p>
    </div>
  );
};

export default Register;
