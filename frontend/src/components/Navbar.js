// 📌 Navbar.js - Barre de navigation dynamique
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">PowerTrack</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            {user ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">Tableau de Bord</Link>
                </li>
                <li className="nav-item">
                  <button className="btn btn-danger" onClick={handleLogout}>Déconnexion</button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/">Connexion</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Inscription</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
