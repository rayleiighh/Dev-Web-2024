import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './GestionAppareils.css';
import { io } from "socket.io-client";
import { useNavigate } from 'react-router-dom';

const socket = io("http://localhost:5000");

function GestionAppareils() {
  const [prises, setPrises] = useState([]);
  const [modeNuit, setModeNuit] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPrises, setSelectedPrises] = useState([]);
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const navigate = useNavigate();

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
        setModeNuit(data.some(p => p.modeNuit?.actif));
      } else {
        console.error("❌ Mauvais format reçu :", data);
      }
    } catch (error) {
      console.error("❌ Erreur fetch prises :", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expirée. Merci de vous reconnecter.");
      navigate("/login");
      return;
    }
    if (!token) {
      console.warn("❌ Aucun token détecté, redirection vers login");
      navigate("/login");
      return;
    }

    fetchAppareils();

    socket.on("etat_prise_changee", (data) => {
      console.log("📡 Changement reçu :", data);
      setPrises(prev =>
        prev.map(p =>
          p._id === data.id ? { ...p, etat: data.etat } : p
        )
      );
      console.log(`⚡ Prise ${data.gpioIndex} mise à jour : ${data.etat ? "ON" : "OFF"}`);
    });

    return () => {
      socket.off("etat_prise_changee");
    };
  }, []);

  const toggleEtatPrise = async (id) => {
    const prise = prises.find(p => p._id === id);
    const nouveauEtat = !prise.etat;

    console.log(`🟢 Changement d'état de ${prise.nom} → ${nouveauEtat ? 'ON' : 'OFF'}`);

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

  const handleSaveModeNuit = async () => {
    const token = localStorage.getItem("token");

    for (const prise of prises) {
      const isSelected = selectedPrises.includes(prise._id);

      const body = {
        actif: isSelected,
        heureDebut: isSelected ? heureDebut : null,
        heureFin: isSelected ? heureFin : null
      };

      try {
        const res = await fetch(`http://localhost:5000/api/appareils/${prise._id}/mode-nuit`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          console.error(`❌ Erreur sur la prise ${prise.nom} (${res.status})`);
        }
      } catch (error) {
        console.error(`❌ Erreur requête prise ${prise.nom} :`, error);
      }
    }

    await fetchAppareils();
    setShowModal(false);
  };

  const handleModifier = (id) => {
    const p = prises.find(p => p._id === id);
    alert(`Modifier l’appareil : ${p.nom}`);
  };

  return (
    <div className="container-gestion">
      <div className="d-flex align-items-center justify-content-between px-3 py-2">
        <button className="btn btn-outline-dark rounded-circle" onClick={() => navigate(-1)}>
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
              title="Configurer le mode nuit"
              onClick={() => {
                setSelectedPrises(prises.filter(p => p.modeNuit?.actif).map(p => p._id));
                setHeureDebut(prises.find(p => p.modeNuit?.actif)?.modeNuit?.heureDebut || "");
                setHeureFin(prises.find(p => p.modeNuit?.actif)?.modeNuit?.heureFin || "");
                setShowModal(true);
              }}
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
              >
                {prise.modeNuit?.actif && <span className="icone-nuit">🌙</span>}
              </div>

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

      {showModal && (
        <>
          <div className="overlay" onClick={() => setShowModal(false)}></div>

          <div className="modal-night">
            <h5 className="mb-3">🌙 Configuration du Mode Nuit</h5>

            <p className="text-muted">Sélectionnez les prises à activer en mode nuit :</p>

            <div className="prise-list">
              {prises.map((prise) => (
                <div key={prise._id} className="d-flex justify-content-between align-items-center mb-2">
                  <span>{prise.nom}</span>
                  <input
                    type="checkbox"
                    checked={selectedPrises.includes(prise._id)}
                    onChange={() => {
                      if (selectedPrises.includes(prise._id)) {
                        setSelectedPrises(selectedPrises.filter(id => id !== prise._id));
                      } else {
                        setSelectedPrises([...selectedPrises, prise._id]);
                      }
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-between my-3">
              <div>
                <label>Début :</label>
                <input
                  type="time"
                  className="form-control"
                  value={heureDebut}
                  onChange={(e) => setHeureDebut(e.target.value)}
                />
              </div>
              <div>
                <label>Fin :</label>
                <input
                  type="time"
                  className="form-control"
                  value={heureFin}
                  onChange={(e) => setHeureFin(e.target.value)}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSaveModeNuit}>Enregistrer</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default GestionAppareils;
