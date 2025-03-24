// 📄 src/pages/Preferences.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Preferences = ({ user, setUser }) => {
  const [preferences, setPreferences] = useState({
    unite: 'kWh',
    theme: 'light',
    emailNotifications: true,
  });

  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

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
    setPreferences({
      ...preferences,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch('http://localhost:5000/api/utilisateurs/preferences', preferences, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("✅ Préférences mises à jour !");
  
      // 🔁 Re-fetch du user à jour
      const res = await axios.get('http://localhost:5000/api/utilisateurs/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data); // 🔥 met à jour le user global dans App.js
  
    } catch (err) {
      console.error("Erreur mise à jour:", err);
      setMessage("❌ Erreur lors de la mise à jour.");
    }
  };

  useEffect(() => {
    const theme = preferences.theme;
    if (theme === 'dark') {
      document.body.classList.add('bg-dark', 'text-white');
    } else {
      document.body.classList.remove('bg-dark', 'text-white');
    }
    return () => {
      document.body.classList.remove('bg-dark', 'text-white');
    };
  }, [preferences.theme]);

  return (
    <div className="container mt-4">
      <h2>🛠️ Paramètres & Préférences</h2>

      {message && <p className="alert alert-info mt-3">{message}</p>}

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-3">
          <label>Unité de consommation :</label>
          <select name="unite" value={preferences.unite} onChange={handleChange} className="form-select">
            <option value="kWh">kWh</option>
            <option value="Wh">Wh</option>
          </select>
        </div>

        <div className="mb-3">
          <label>Thème :</label>
          <select name="theme" value={preferences.theme} onChange={handleChange} className="form-select">
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
          </select>
        </div>

        <div className="form-check mb-3">
          <input
            type="checkbox"
            name="emailNotifications"
            checked={preferences.emailNotifications}
            onChange={handleChange}
            className="form-check-input"
            id="notifCheck"
          />
          <label className="form-check-label" htmlFor="notifCheck">
            Recevoir des alertes par email 📩
          </label>
        </div>

        <button type="submit" className="btn btn-primary">Enregistrer</button>
      </form>
    </div>
  );
};

export default Preferences;
