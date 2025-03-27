import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Profil.css';

const Profil = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [photo, setPhoto] = useState(null); // 🆕 Ajout pour la photo

  useEffect(() => {
    if (user) {
      setNom(user.nom);
      setEmail(user.email);
    }
  }, [user]);

  const handleFileChange = (e) => {
    setPhoto(e.target.files[0]); // 🆕 stocke la photo sélectionnée
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      // 1. Mise à jour des infos (nom, email, mdp)
      await axios.put(
        'http://localhost:5000/api/utilisateurs/me',
        { nom, email, ancienMotDePasse, nouveauMotDePasse },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Envoi de la photo si elle existe
      if (photo) {
        const formData = new FormData();
        formData.append('photo', photo);

        await axios.patch('http://localhost:5000/api/utilisateurs/profil/photo', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // 3. Recharge les infos utilisateur à jour
      const res = await axios.get('http://localhost:5000/api/utilisateurs/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);

      setMessage("✅ Profil mis à jour avec succès");
      setErreur('');
      setAncienMotDePasse('');
      setNouveauMotDePasse('');
      setPhoto(null);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      setErreur(error.response?.data?.message || "Erreur lors de la mise à jour du profil");
      setMessage('');
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-3">
        <button onClick={() => navigate(-1)} className="btn btn-outline-dark rounded-circle me-2">
          <i className="bi bi-arrow-left"></i>
        </button>
        <h2 className="mb-0">👤 Mon Profil</h2>
      </div>

      {message && <p className="text-success">{message}</p>}
      {erreur && <p className="text-danger">{erreur}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom</label>
          <input type="text" className="form-control" value={nom} onChange={(e) => setNom(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <hr />
        <div className="form-group">
          <label>Ancien mot de passe</label>
          <input type="password" className="form-control" value={ancienMotDePasse} onChange={(e) => setAncienMotDePasse(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Nouveau mot de passe</label>
          <input type="password" className="form-control" value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)} />
        </div>
        <div className="form-group mt-3">
          <label>Photo de profil</label>
          <input type="file" className="form-control" onChange={handleFileChange} />
        </div>
        <button type="submit" className="btn btn-primary mt-3">Enregistrer</button>
      </form>
    </div>
  );
};

export default Profil;
