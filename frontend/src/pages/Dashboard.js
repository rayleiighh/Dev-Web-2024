import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div className="container text-center mt-5">
      <h2>Tableau de bord</h2>
      <nav>
        <Link to="/devices" className="btn btn-outline-primary m-2">Gestion des appareils</Link>
        <Link to="/notifications" className="btn btn-outline-warning m-2">Notifications</Link>
        <Link to="/support" className="btn btn-outline-info m-2">Support / Contact</Link>
        <Link to="/faq" className="btn btn-outline-secondary m-2">FAQ</Link>
      </nav>
    </div>
  );
}

export default Dashboard;
