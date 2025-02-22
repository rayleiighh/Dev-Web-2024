import React, { useEffect, useState } from 'react';
import { getMesures, deleteMesure } from '../services/api'; // Vérifie si ces fonctions sont bien utilisées
import MesureList from './MesureList';

const Dashboard = () => {
    const [mesures, setMesures] = useState([]);

    useEffect(() => {
        fetchMesures();
    }, []);

    const fetchMesures = async () => {
        try {
            const data = await getMesures();
            setMesures(data);
        } catch (error) {
            console.error("Erreur lors du chargement des mesures", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteMesure(id);
            fetchMesures(); // Rafraîchir la liste après suppression
        } catch (error) {
            console.error("Erreur lors de la suppression de la mesure", error);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Tableau de Bord</h2>
            <MesureList mesures={mesures} onDelete={handleDelete} />
        </div>
    );
};

export default Dashboard;