import React, { useState } from 'react';
import './Contact.css';
import { useNavigate } from 'react-router-dom';

const Contact = ({ user }) => {
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: user?.nom || 'Utilisateur inconnu',
          email: user?.email || 'non défini',
          message
        })
      });

      const data = await res.json();
      setConfirmation(data.message);
      setMessage('');
    } catch (error) {
      
      setConfirmation("Une erreur s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <button
        className="btn btn-outline-dark rounded-circle fixed-bouton"
        onClick={() => navigate(-1)}
      >
        <i className="bi bi-arrow-left"></i>
      </button>

      <div className="contact-container">
        <h2 className="contact-title">Contactez-nous</h2>
        <form onSubmit={handleSubmit} className="contact-form">
        <textarea
            placeholder="Votre message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // empêche le saut de ligne
                handleSubmit(e); 
              }
            }}
          />

          <button type="submit" disabled={loading}>
            {loading ? <span className="loader" /> : 'Envoyer'}
          </button>
          {confirmation && <p className="confirmation-message">{confirmation}</p>}
        </form>
      </div>
    </div>
  );
};

export default Contact;
