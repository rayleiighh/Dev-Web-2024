// ✅ Preferences.js (mise à jour : thème clair/sombre en FR pour backend)
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './themes.css';
import { useNavigate } from 'react-router-dom';

const Preferences = ({ user, setUser }) => {
  const [preferences, setPreferences] = useState({
    unite: 'kWh',
    theme: 'clair',
    emailNotifications: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${preferences.theme === 'sombre' ? 'dark' : 'light'}-theme`);
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
      document.body.classList.add(`${value === 'sombre' ? 'dark' : 'light'}-theme`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // sécurité en plus
    setLoading(true);
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
    } finally {
      // Délai pour bloquer les spams rapides
      setTimeout(() => setLoading(false), 1500); 
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
            <option value="clair">Clair</option>
            <option value="sombre">Sombre</option>
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
        <button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Sauvegarder"}
        </button>
      </form>
    </div>
  );
};

export default Preferences;
