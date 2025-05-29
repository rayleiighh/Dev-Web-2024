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
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoActuelle, setPhotoActuelle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setNom(user.nom);
      setEmail(user.email);
      setPhotoActuelle(user.photoProfil); 
    }
  }, [user]);

  const handleFileChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (nouveauMotDePasse && nouveauMotDePasse !== confirmationMotDePasse) {
      setErreur("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      //  Mise à jour du profil
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/utilisateurs/profil`,
        { nom, email, ancienMotDePasse, nouveauMotDePasse },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      //  Mise à jour de la photo
      if (photo) {
        const formData = new FormData();
        formData.append('photo', photo);

        await axios.patch(`${process.env.REACT_APP_API_URL}/api/utilisateurs/profil/photo`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // Recharge les infos utilisateur à jour
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/utilisateurs/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setPhotoActuelle(res.data.photoProfil); 

      setMessage("Profil mis à jour avec succès");
      setErreur('');
      setAncienMotDePasse('');
      setNouveauMotDePasse('');
      setConfirmationMotDePasse('');
      setPhoto(null);
    } catch (error) {
      console.error(error);
      setErreur(error.response?.data?.message || "Erreur lors de la mise à jour du profil");
      setMessage('');
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-3">
        <button onClick={() => navigate(-1)} className="btn btn-outline-dark rounded-circle me-2 fixed-button">
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

        <div className="form-group my-3">
            <label>Photo actuelle</label><br />
            <div
              className="profile-picture-placeholder rounded-circle bg-light border"
              style={{
                width: 120,
                height: 120,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {user?.photoProfil ? (
                <img
                  src={`${process.env.REACT_APP_API_URL}/${user.photoProfil}`}
                  alt="Profil"
                  className="rounded-circle"
                  crossOrigin="anonymous"
                  style={{ width: 120, height: 120, objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="rounded-circle bg-light"
                  style={{ width: 120, height: 120 }}
                ></div>
              )}
            </div>
        </div>



        <div className="form-group mt-3">
          <label>Photo de profil</label>
          <input type="file" className="form-control" onChange={handleFileChange} />
        </div>

        <hr />
        <div className="form-group">
          <label>Ancien mot de passe</label>
          <input type={showPassword ? "text" : "password"} className="form-control" value={ancienMotDePasse} onChange={(e) => setAncienMotDePasse(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Nouveau mot de passe</label>
          <input type={showPassword ? "text" : "password"} className="form-control" value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Confirmez le nouveau mot de passe</label>
          <input type={showPassword ? "text" : "password"} className="form-control" value={confirmationMotDePasse} onChange={(e) => setConfirmationMotDePasse(e.target.value)} />
        </div>

        <div className="custom-toggle my-3">
          <label className="switch">
            <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
            <span className="slider round"></span>
          </label>
          <span className="ms-2">Afficher les mots de passe</span>
        </div>

        <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer'
          )}
        </button>
      </form>
    </div>
  );
};

export default Profil;
