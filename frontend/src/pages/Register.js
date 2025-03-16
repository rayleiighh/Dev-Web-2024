import React, { useState } from 'react';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch('http://localhost:5000/api/utilisateurs/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          motDePasse: password,
          prenom: 'Test',
          nom: 'User'
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'inscription.");
      }
  
      setMessage('Inscription réussie ! Connecte-toi.');
    } catch (error) {
      console.error("Erreur :", error);
      setMessage(error.message);
    }
  };
  return (
    <div className="container text-center mt-5">
      <h2>Créer un compte</h2>
      <form onSubmit={handleRegister} className="w-50 mx-auto">
        <input type="email" placeholder="Email" className="form-control mb-3" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe" className="form-control mb-3" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="btn btn-primary">S'inscrire</button>
      </form>
      {message && <p className="mt-3 text-danger">{message}</p>}
    </div>
  );
}

export default Register;
