import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './GestionAppareils.css';
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

function GestionAppareils() {
  const [prises, setPrises] = useState([]);
  const [modeNuit, setModeNuit] = useState(false);

  const fetchAppareils = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/appareils", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (Array.isArray(data)) {
        setPrises(data);
      } else {
        console.error("❌ Mauvais format reçu :", data);
      }
    } catch (error) {
      console.error("❌ Erreur fetch prises :", error);
    }
  };


  // 🔁 Charger les prises depuis le backend
  useEffect(() => {
    fetchAppareils();

    socket.on("etat_prise_changee", (data) => {
      console.log("📡 Changement reçu :", data);
  
      // Mettre à jour l'état local
      setPrises(prev =>
        prev.map(p =>
          p._id === data.id ? { ...p, etat: data.etat } : p
        )
      );
  
      // Console côté utilisateur
      console.log(`⚡ Prise ${data.gpioIndex} mise à jour : ${data.etat ? "ON" : "OFF"}`);
    });
  
    return () => {
      socket.off("etat_prise_changee");
    };
  }, []);

  // ✅ Contrôle de l’état d’une prise
  const toggleEtatPrise = async (id) => {
    const prise = prises.find(p => p._id === id);
    const nouveauEtat = !prise.etat;
  
    // ✅ Affiche dans la console du navigateur
    console.log(`🟢 Changement d'état de ${prise.nom} → ${nouveauEtat ? 'ON' : 'OFF'}`);
  
    // Mise à jour immédiate dans l’UI
    setPrises(prev =>
      prev.map(p =>
        p._id === id ? { ...p, etat: nouveauEtat } : p
      )
    );
  
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/appareils/${id}/etat`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ etat: nouveauEtat })
      });
  
      if (!res.ok) {
        console.error("❌ Erreur HTTP :", res.status);
      }
    } catch (error) {
      console.error("❌ Erreur MAJ backend :", error);
    }
  };
  

  // 🌙 Mode nuit
  const activerModeNuit = async () => {
    setModeNuit(true);
    setPrises(prev => prev.map(p => ({ ...p, etat: false })));

    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/appareils/mode-nuit/activer`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("❌ Erreur mode nuit :", error);
    }
  };

  const handleModifier = (id) => {
    const p = prises.find(p => p._id === id);
    alert(`Modifier l’appareil : ${p.nom}`);
  };

  return (
    <div className="container-gestion">
      <div className="d-flex align-items-center justify-content-between px-3 py-2">
        <button className="btn btn-outline-dark rounded-circle">
          <i className="bi bi-arrow-left"></i>
        </button>
        <h5 className="mb-0">Gestion des appareils</h5>
        <div className="d-flex flex-column align-items-center gap-2">
          <button className="btn btn-light rounded-circle text-primary border border-primary">
            <i className="bi bi-power"></i>
          </button>
          {!modeNuit ? (
            <button
              className="btn btn-light rounded-circle text-dark"
              title="Activer mode nuit"
              onClick={activerModeNuit}
            >
              <i className="bi bi-moon"></i>
            </button>
          ) : (
            <button
              className="btn btn-dark rounded-circle text-warning"
              title="Désactiver mode nuit"
              onClick={() => setModeNuit(false)}
            >
              <i className="bi bi-sun"></i>
            </button>
          )}
        </div>
      </div>

      <div className="multiprise-container">
        <div className="multiprise">
          {prises.map((prise) => (
            <div key={prise._id} className="prise-item">
              <div
                className={`prise-visuelle ${prise.etat ? 'active' : 'inactive'}`}
                onClick={() => toggleEtatPrise(prise._id)}
              ></div>

              <div className="prise-nom">{prise.nom}</div>

              <div className="prise-actions d-flex align-items-center gap-2">
                <button onClick={() => handleModifier(prise._id)} className="btn btn-link text-decoration-none p-0">
                  <i className="bi bi-pencil"></i> <small>modifier</small>
                </button>
                <button className="btn btn-light rounded-circle px-2">
                  <i className="bi bi-three-dots-vertical"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GestionAppareils;
