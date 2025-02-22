import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getMesures, deleteMesure } from '../services/api';
import MesureList from './MesureList';


const Dashboard = () => {
    const [mesures, setMesures] = useState([]); // État pour stocker les données

    // useEffect pour exécuter fetchMesures au chargement du composant
    useEffect(() => {
        fetchMesures();
    }, []);

    // Fonction pour récupérer les mesures depuis l'API
    const fetchMesures = async () => {
        try {
            const response = await axios.get('http://localhost:5000/mesures');
            setMesures(response.data); // Met à jour l'état avec les données reçues
        } catch (error) {
            console.error('Erreur lors de la récupération des mesures:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteMesure(id);
            fetchMesures(); // Rafraîchir la liste après suppression
        } catch (error) {
            console.error("Erreur lors de la suppression de la mesure", error);
        }
    }

    
/* # code avant d'avoir utiliser celui de MesureList
    return (
        <div style={styles.container}>
            <h2>Tableau de Bord</h2>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th>Appareil</th>
                        <th>Consommation (W)</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {mesures.length > 0 ? (
                        mesures.map((mesure) => (
                            <tr key={mesure._id}>
                                <td>{mesure.appareil}</td>
                                <td>{mesure.consommation} W</td>
                                <td>{new Date(mesure.date).toLocaleString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" style={styles.emptyRow}>Aucune donnée disponible</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
*/
return (
    <div style={{ padding: '20px' }}>
        <h2>Tableau de Bord</h2>
        <MesureList mesures={mesures} />
    </div>
);
};

const styles = {
    container: {
        padding: '20px',
        textAlign: 'center'
    },
    table: {
        width: '80%',
        margin: 'auto',
        borderCollapse: 'collapse'
    },
    emptyRow: {
        textAlign: 'center',
        padding: '10px'
    },
    th: {
        backgroundColor: '#282c34',
        color: 'white',
        padding: '10px',
        border: '1px solid black'
    },
    td: {
        padding: '10px',
        border: '1px solid black'
    }
};

export default Dashboard;
