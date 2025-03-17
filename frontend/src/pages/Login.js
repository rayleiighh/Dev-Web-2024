// 📌 Login.js - Page de connexion
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/utilisateurs/login', { email, motDePasse: password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.utilisateur);
      navigate('/dashboard');
    } catch (err) {
      setError('Échec de connexion. Vérifiez vos identifiants.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Connexion</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Se connecter</button>
      </form>
      <p>Pas encore de compte ? <a href="/register">Inscrivez-vous</a></p>
    </div>
  );
};

export default Login;
