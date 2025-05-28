import { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Historique.css';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

function Historique() {
  const today = new Date().toISOString().split('T')[0];
  const [historique, setHistorique] = useState([]);
  const [dateDebut, setDateDebut] = useState(today);
  const [dateFin, setDateFin] = useState(today);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [dateError, setDateError] = useState('');
  const [loading, setLoading] = useState(true);
  const [chargementCSV, setChargementCSV] = useState(false);
  const [erreurExport, setErreurExport] = useState(null);

  const reinitialiserFiltres = () => {
    setDateDebut(today);
    setDateFin(today);
  };

  const appliquerFiltres = () => {
    if (estDateValide()) {
      fetchConsommations();
    }
  };


  const estDateValide = () => {
    if (!dateDebut || !dateFin) return true;
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const now = new Date();
  
    if (debut > fin) {
      setDateError(" La date de début doit être avant la date de fin.");
      return false;
    }
    if (debut > now || fin > now) {
      setDateError(" Les dates ne peuvent pas être dans le futur.");
      return false;
    }
    setDateError('');
    return true;
  };
  
  const fetchConsommations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = "http://localhost:5000/api/consommations";
      console.log(" URL avec dates UTC :", url);

      let finFormatee = dateFin;
      if (dateFin) {
        finFormatee = `${dateFin}T23:59:59.999Z`;
      }
      let debutFormatee = dateDebut;
      if (dateDebut) {
        debutFormatee = `${dateDebut}T00:00:00.000Z`;
      }
      const params = [];

      if (dateDebut) params.push(`debut=${debutFormatee}`);
      if (dateFin) params.push(`fin=${finFormatee}`);
      if (params.length) url += "?" + params.join("&");

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
      }

      const data = await response.json();
      console.log(" Données de l'API :", data);

      if (Array.isArray(data)) {
        setHistorique(data);
      } else if (data.data && Array.isArray(data.data)) {
        setHistorique(data.data);
      } else {
        throw new Error("La réponse de l'API n'est pas un tableau");
      }
    } catch (error) {
      console.error(" Erreur de chargement :", error);
      setError(error.message);
      setHistorique([]);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin]);

  useEffect(() => {
    if (estDateValide()) {
      fetchConsommations();
    }
  }, []); 
  const limitedData = historique.slice(0, 30);
  const chartData = {
    labels: limitedData.map((entry, idx) => idx % 3 === 0 ? entry.timestampLisible : ""),
    datasets: [{
      label: 'Courant (A)',
      data: limitedData.map(entry => entry.value),
      fill: false,
      borderColor: 'rgb(75,192,192)',
      tension: 0.1
    }]
  };

const handleExport = async () => {
  if (!dateDebut) {
    setErreurExport(" Veuillez choisir une date de début.");
    return;
  }

  try {
    setErreurExport(null); // reset erreur
    setChargementCSV(true);

    const token = localStorage.getItem("token");

    const query = new URLSearchParams();
    query.append("debut", `${dateDebut}T00:00:00.000Z`);
    query.append("fin", dateFin ? `${dateFin}T23:59:59.999Z` : new Date().toISOString());

    const response = await fetch(`http://localhost:5000/api/consommations/export-csv?${query.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error("Erreur HTTP : " + response.status);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'consommations.csv');
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erreur export CSV :", error);
    alert("Erreur lors de l'export CSV, voir console.");
  } finally {
    setChargementCSV(false);
  }
};


  
  
  if (error) return <p>❌ Erreur : {error}</p>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>📊 Historique des consommations</h4>
  
        <button className="btn btn-outline-dark rounded-circle fixed-button" 
          onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i> 
        </button>
      </div>
  
      {dateError && (
        <div className="alert alert-danger" role="alert">
          {dateError}
        </div>
      )}
  
      <div className="filter-container d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <input
            type="date"
            className="form-control"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
          />
          <input
            type="date"
            className="form-control"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={appliquerFiltres}>
            Appliquer
          </button>
          <button className="btn btn-secondary btn-sm" onClick={reinitialiserFiltres}>
            Réinitialiser
          </button>
        </div>
  
        <div className="summary-wrapper">
          <div className="summary-box text-end">
            <p className="mb-0"><strong>Période choisie avec filtre :</strong></p>
            <p className="mb-0 text-muted">{dateDebut} ➜ {dateFin}</p>
            <p className="mb-0 text-muted">MAJ : {new Date().toLocaleString()}</p>
          </div>

          <button className="btn btn-success bouton-export btn-sm" onClick={handleExport} disabled={chargementCSV}>
            {chargementCSV ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Export...
              </>
            ) : (
              "📁 Export CSV"
            )}
          </button>

          {erreurExport && (
            <span className="text-danger small mt-1">{erreurExport}</span>
          )}
        </div>

      </div>
  
      <div className="bg-white p-3 rounded shadow-sm mb-4">
        <Line data={chartData} />
      </div>
  
      <div className="table-responsive">
        <table className="table table-striped table-bordered text-center">
          <thead className="table-primary">
            <tr>
              <th>Horodatage</th>
              <th>Identifiant Multiprise</th>
              <th>Énergie (kWh)</th>
              <th>Courant (A)</th>
            </tr>
          </thead>
          <tbody>
            {historique.length > 0 ? historique.slice(0, 10).map((entry, index) => (
              <tr key={index}>
                <td>{entry.timestampLisible}</td>
                <td>{entry.multiprise?.identifiantUnique || "Multiprise inconnue"}</td>
                <td>{(entry.value * 0.001).toFixed(4)}</td>
                <td>{entry.value.toFixed(3)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4">Aucune donnée disponible</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}  

export default Historique;