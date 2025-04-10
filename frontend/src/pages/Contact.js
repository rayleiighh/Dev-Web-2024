import React, { useState } from 'react';
import './Contact.css';
import { useNavigate } from 'react-router-dom';

const Contact = () => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, message })
      });

      const data = await res.json();
      setConfirmation(data.message);
      setNom('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Erreur lors de l’envoi du message :', error);
      setConfirmation("Une erreur s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <button
        className="btn btn-outline-dark rounded-circle"
        onClick={() => navigate(-1)}
        aria-label="Retour"
        style={{ marginBottom: '1rem' }}
      >
        <i className="bi bi-arrow-left"></i>
      </button>

      <div className="contact-container">
        <h2 className="contact-title">Contactez-nous</h2>
        <form onSubmit={handleSubmit} className="contact-form">
          <input
            type="text"
            placeholder="Votre nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Votre adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <textarea
            placeholder="Votre message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
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
