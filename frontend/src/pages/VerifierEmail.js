import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './VerifierEmail.css'; 

const VerifierEmail = () => {
  const [status, setStatus] = useState('loading'); 
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    const verifier = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/utilisateurs/verifier-email?token=${token}`);
        setStatus('success');
        setMessage(res.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Erreur de vérification.');
      }
    };

    verifier();
  }, [searchParams]);

  return (
    <div className="verification-container">
      <div className="card">
        {status === 'loading' && (
          <p className="loading">Vérification en cours...</p>
        )}

        {status === 'success' && (
          <>
            <h2>Compte confirmé</h2>
            <p>{message}</p>
            <button onClick={() => navigate('/')} className="btn">Se connecter</button>
          </>
        )}

        {status === 'error' && (
          <>
            <h2>Erreur</h2>
            <p>{message}</p>
            <button onClick={() => navigate('/register')} className="btn">Retour à l'inscription</button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifierEmail;
