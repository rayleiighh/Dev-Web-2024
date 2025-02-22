import axios from 'axios';

// Définition de l'URL du backend
const API_URL = 'http://localhost:5000';

// Fonction pour récupérer toutes les mesures
export const getMesures = async () => {
    try {
        const response = await axios.get(`${API_URL}/mesures`);
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la récupération des mesures :", error);
        throw error;
    }
};

// Fonction pour ajouter une nouvelle mesure
export const addMesure = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/mesures`, data, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error("Erreur lors de l'ajout d'une mesure :", error);
        throw error;
    }
};

// Fonction pour supprimer une mesure par ID
export const deleteMesure = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/mesures/${id}`);
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la suppression de la mesure :", error);
        throw error;
    }
};
