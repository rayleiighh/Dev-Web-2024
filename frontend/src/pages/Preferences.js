// ✅ Preferences.js (mise à jour avec bouton retour type Bootstrap)
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './themes.css';
import { useNavigate } from 'react-router-dom';

const Preferences = ({ user, setUser }) => {
  const [preferences, setPreferences] = useState({
    unite: 'kWh',
    theme: 'light',
    emailNotifications: true,
  });

  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${preferences.theme}-theme`);
  }, [preferences.theme]);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/utilisateurs/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPreferences(res.data.preferences || {});
      } catch (err) {
        console.error("Erreur chargement préférences:", err);
      }
    };

    fetchPreferences();
  }, [token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newPreferences = {
      ...preferences,
      [name]: type === 'checkbox' ? checked : value,
    };
    setPreferences(newPreferences);

    if (name === 'theme') {
      document.body.classList.remove('light-theme', 'dark-theme');
      document.body.classList.add(`${value}-theme`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/utilisateurs/me', {
        preferences,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Préférences enregistrées avec succès.');
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      setMessage("Erreur lors de l'enregistrement des préférences.");
    }
  };

  return (
    <div className="preferences-container">
      <button
        className="btn btn-outline-dark rounded-circle"
        onClick={() => navigate(-1)}
        aria-label="Retour"
        style={{ marginBottom: '1rem' }}
      >
        <i className="bi bi-arrow-left"></i>
      </button>

      <h2>Préférences utilisateur</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Unité de consommation :
          <select name="unite" value={preferences.unite} onChange={handleChange}>
            <option value="kWh">kWh</option>
            <option value="Wh">Wh</option>
          </select>
        </label>
        <label>
          Thème :
          <select name="theme" value={preferences.theme} onChange={handleChange}>
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
          </select>
        </label>
        <label>
          Notifications par email :
          <input
            type="checkbox"
            name="emailNotifications"
            checked={preferences.emailNotifications}
            onChange={handleChange}
          />
        </label>
        <button type="submit">Sauvegarder</button>
      </form>
    </div>
  );
};

export default Preferences;
