import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { Line } from 'react-chartjs-2';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Enregistrement des modules nécessaires à Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard({ user }) {
  const [dataPoints, setDataPoints] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/readings');
        const data = await response.json();
        setDataPoints(data.map(doc => ({
          time: new Date(doc.timestamp).toLocaleTimeString(),
          value: doc.value
        })));
      } catch (error) {
        console.error("Erreur récupération données :", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Mise à jour toutes les 5 secondes
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: dataPoints.map(p => p.time),
    datasets: [{
      label: 'Intensité (A)',
      data: dataPoints.map(p => p.value),
      borderColor: 'rgba(75,192,192,1)',
      backgroundColor: 'rgba(75,192,192,0.2)',
      fill: true,
      tension: 0.3
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { type: 'category' },
      y: { beginAtZero: true }
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Bienvenue, {user.prenom} {user.nom} !</h2>
      <p>Votre email : {user.email}</p>
      <h3>Vos Appareils Connectés :</h3>
      <ul>
        {user.appareils && user.appareils.length > 0 ? (
          user.appareils.map((appareil) => (
            <li key={appareil._id}>
              {appareil.nom} - {appareil.marque}
            </li>
          ))
        ) : (
          <ul>Aucun appareil connecté.</ul>
        )}
      </ul>
      <hr />
      <h3>📊 Intensité en temps réel</h3>
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

export default Dashboard;
