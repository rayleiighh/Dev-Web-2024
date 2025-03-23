import { useEffect, useState } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);
//test
function Historique() {
  const [historique, setHistorique] = useState([]);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConsommations = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = "http://localhost:5000/api/consommations";
      const params = [];

      if (dateDebut) params.push(`debut=${dateDebut}`);
      if (dateFin) params.push(`fin=${dateFin}`);
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
      console.log("Données de l'API :", data);

      if (Array.isArray(data)) {
        setHistorique(data);
      } else if (data.data && Array.isArray(data.data)) {
        setHistorique(data.data); // Si la réponse est un objet avec une propriété `data`
      } else {
        throw new Error("La réponse de l'API n'est pas un tableau");
      }
    } catch (error) {
      console.error("❌ Erreur de chargement :", error);
      setError(error.message);
      setHistorique([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsommations(); // Chargement initial
    const interval = setInterval(fetchConsommations, 5000); // Polling toutes les 5 secondes
    return () => clearInterval(interval);
  }, [dateDebut, dateFin]);

  // Préparation des données du graphique
  const chartData = {
    labels: historique.map(entry => new Date(entry.timestamp).toLocaleTimeString()),
    datasets: [{
      label: 'Courant (A)',
      data: historique.map(entry => entry.value),
      fill: false,
      borderColor: 'rgb(75,192,192)',
      tension: 0.1
    }]
  };

  const handleExport = () => {
    alert("📥 Export CSV en cours de développement !");
  };

  if (loading) {
    return <p>Chargement en cours...</p>;
  }

  if (error) {
    return <p>Erreur : {error}</p>;
  }

  if (!Array.isArray(historique)) {
    return <p>Erreur : les données ne sont pas disponibles.</p>;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>📊 Historique des consommations</h4>
        <button onClick={() => window.location.href = "/"} className="btn btn-outline-secondary">
          ⬅ Retour Dashboard
        </button>
      </div>

      {/* Filtres de date */}
      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <input
            type="date"
            className="form-control"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            type="date"
            className="form-control"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <button className="btn btn-success w-100" onClick={handleExport}>
            📁 Export CSV
          </button>
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-white p-3 rounded shadow-sm mb-4">
        <Line data={chartData} />
      </div>

      {/* Tableau des données */}
      <div className="table-responsive">
        <table className="table table-striped table-bordered text-center">
          <thead className="table-primary">
            <tr>
              <th>Horodatage</th>
              <th>Appareil</th>
              <th>Énergie (kWh)</th>
              <th>Courant (A)</th>
            </tr>
          </thead>
          <tbody>
            {historique.length > 0 ? historique.map((entry, index) => (
              <tr key={index}>
                <td>{new Date(entry.timestamp).toLocaleString()}</td>
                <td>{entry.appareil?.nom || "Appareil inconnu"}</td>
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