import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // ✅ Hook pour la redirection

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:5000/api/utilisateurs/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(),  // Nettoie les espaces vides
          motDePasse: password.trim()  // Vérifie que les champs ne sont pas vides
        })
      });
  
      const data = await response.json();
      console.log("🟢 Réponse reçue du backend:", data); // ✅ Vérifie la réponse dans la console navigateur
      
      if (!response.ok) {
        throw new Error(data.message || "Erreur de connexion.");
      }

      if (!data.utilisateur) {
        throw new Error("Aucun utilisateur retourné.");
      }
  
      localStorage.setItem('user', JSON.stringify(data.utilisateur));
      setUser(data.utilisateur);

      console.log("🔄 Redirection vers /dashboard..."); // ✅ Vérifier si cette ligne s'affiche
      navigate('/dashboard');



  
    } catch (error) {
      console.error("Erreur :", error);
      setMessage(error.message);
    }
  };

  return (
    <div className="container text-center mt-5">
      <h2>Se connecter</h2>
      <form onSubmit={handleLogin} className="w-50 mx-auto">
        <input type="email" placeholder="Email" className="form-control mb-3" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe" className="form-control mb-3" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="btn btn-success">Se connecter</button>
      </form>
      {message && <p className="mt-3 text-danger">{message}</p>}
    </div>
  );
}

export default Login;
