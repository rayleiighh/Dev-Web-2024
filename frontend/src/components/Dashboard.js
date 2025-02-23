import React, { useEffect, useState } from 'react';
import { getMesures, deleteMesure } from '../services/api';
import MesureList from './MesureList';
import { io } from 'socket.io-client';

// Connexion WebSocket avec le serveur backend
const socket = io("http://localhost:5000");

const Dashboard = () => {
    const [mesures, setMesures] = useState([]);

    useEffect(() => {
        fetchMesures();

        // Écoute les mises à jour du backend via WebSocket
        socket.on("maj-mesures", (updatedMesures) => {
            console.log("📡 Mise à jour reçue :", updatedMesures);
            setMesures(updatedMesures);
        });

        // Nettoyer la connexion WebSocket lorsque le composant est démonté
        return () => socket.off("maj-mesures");
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
            fetchMesures();
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
