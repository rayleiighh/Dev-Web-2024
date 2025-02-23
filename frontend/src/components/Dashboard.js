import React, { useEffect, useState } from 'react';
import { getMesures, deleteMesure } from '../services/api';
import MesureList from './MesureList';
import { io } from 'socket.io-client';

// Connexion WebSocket au bon port
const socket = io("http://localhost:5000");

const Dashboard = () => {
    const [mesures, setMesures] = useState([]);

    useEffect(() => {
        fetchMesures();

        // WebSocket : Met à jour les mesures en temps réel
        socket.on("maj-mesures", (updatedMesures) => {
            console.log("📡 Mise à jour WebSocket reçue :", updatedMesures);
            setMesures(updatedMesures);
        });

        return () => socket.off("maj-mesures");
    }, []);

    const fetchMesures = async () => {
        try {
            const data = await getMesures();
            setMesures(data);
        } catch (error) {
            console.error("❌ Erreur lors du chargement des mesures :", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteMesure(id);
            fetchMesures();
        } catch (error) {
            console.error("❌ Erreur lors de la suppression de la mesure :", error);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Tableau de Bord</h2>
            {mesures.length === 0 ? (
                <p>Aucune donnée disponible.</p>
            ) : (
                <MesureList mesures={mesures} onDelete={handleDelete} />
            )}
        </div>
    );
};

export default Dashboard;
