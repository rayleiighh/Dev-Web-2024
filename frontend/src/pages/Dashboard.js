import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './Dashboard.css';
import 'bootstrap/dist/css/bootstrap.min.css';



function Dashboard({ user }) {
  const [derniereConso, setDerniereConso] = useState(null);
  const socketRef = useRef(null); // 🔒 pour garantir une seule instance de socket

  const favoris = [
    { nom: 'iPhone de Saad', couleur: 'primary' },
    { nom: 'PC Asus', couleur: 'danger' }
  ];

  useEffect(() => {
    // Récupérer la dernière mesure au chargement
    const fetchDerniereConso = async () => {
      try {
        const response = await fetch('/api/consommations/latest');
        const data = await response.json();
        setDerniereConso(data);
      } catch (error) {
        console.error('Erreur récupération dernière consommation:', error);
      }
    };
  
    fetchDerniereConso();
  
    // Établir la connexion WebSocket
    
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:5000", {
        transports: ['websocket'], // Forcer l'utilisation de WebSocket
      });
  
      socketRef.current.on('connect', () => {
        console.log("🟢 Connecté au WebSocket !");
      });
  
      socketRef.current.on('nouvelleConsommation', (data) => {
        console.log("⚡ Donnée WebSocket reçue :", data);
        setDerniereConso(data);
      });
  
      socketRef.current.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
  
      socketRef.current.on('disconnect', () => {
        console.log("🔌 WebSocket déconnecté");
      });
    }
  
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log("🔌 Socket déconnectée proprement");
      }
    };
  }, []);


  return (
    <div className="container py-4 text-dark" style={{ fontFamily: 'sans-serif' }}>
      
      {/* SECTION UTILISATEUR */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <h4 className="mb-2 mb-md-0">Salut, <strong>{user?.prenom || 'Utilisateur'}</strong> !</h4>
        <div className="d-flex gap-3">
          <button className="btn btn-light position-relative rounded-circle">
            <i className="bi bi-bell"></i>
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">1</span>
          </button>
          <button className="btn btn-light rounded-circle">
            <i className="bi bi-gear-fill"></i>
          </button>
        </div>
      </div>

      {/* ROW PRINCIPALE */}
      <div className="row g-4">
        
        {/* COLONNE GAUCHE – CONSOMMATION */}
        <div className="col-12 col-lg-6">
          <div className="bg-white rounded p-3 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="text-primary fw-bold">📊 Dernière consommation</h6>
              <button className="btn btn-primary btn-sm rounded-pill px-3" onClick={() => window.location.href = "/historique"}>
                <i className="bi bi-clock-history me-1"></i> Historique
              </button>
            </div>

            <table className="table table-sm text-center mb-0">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Énergie (kWh)</th>
                  <th>Courant (A)</th>
                </tr>
              </thead>
              <tbody>
                {derniereConso ? (
                  <tr>
                    <td>{new Date(derniereConso.timestamp).toLocaleTimeString()}</td>
                    <td>{(derniereConso.value * 0.001).toFixed(4)}</td>
                    <td>{derniereConso.value.toFixed(3)}</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="3">
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                        <span>⏳ En attente de données temps réel...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLONNE DROITE – APPAREILS FAVORIS */}
        <div className="col-12 col-lg-6">
          <div className="bg-white rounded p-3 shadow-sm mb-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold">Appareils (Favoris)</h6>
              <button className="btn btn-primary btn-sm rounded-pill">
                <i className="bi bi-columns-gap me-1"></i> Appareils
              </button>
            </div>
            {favoris.map((item, index) => (
              <div key={index} className="d-flex align-items-center mb-3">
                <div className={`rounded-circle bg-${item.couleur} me-3`} style={{ width: 40, height: 40 }}></div>
                <span>{item.nom}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION CONTACT */}
        <div className="col-12">
          <div className="bg-white rounded p-3 shadow-sm text-center">
            <h6 className="mb-2">Contactez-nous</h6>
            <button className="btn btn-primary rounded-pill px-4" onClick={() => window.location.href = "/contact"}>
              Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;