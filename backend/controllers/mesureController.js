const Mesure = require('../models/Mesure');

// Récupérer toutes les mesures
exports.getAllMesures = async (req, res) => {
    try {
        const mesures = await Mesure.find();
        res.status(200).json(mesures);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Ajouter une nouvelle mesure
exports.createMesure = async (req, res) => {
    try {
        const { appareil, consommation } = req.body;

        // Vérification des données
        if (!appareil || !consommation) {
            return res.status(400).json({ message: "Tous les champs sont requis." });
        }

        const nouvelleMesure = new Mesure({ appareil, consommation });
        await nouvelleMesure.save();
        
        res.status(201).json(nouvelleMesure);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Supprimer une mesure par ID
exports.deleteMesure = async (req, res) => {
    try {
        const { id } = req.params;
        const mesure = await Mesure.findByIdAndDelete(id);

        if (!mesure) {
            return res.status(404).json({ message: "Mesure non trouvée." });
        }

        res.status(200).json({ message: "Mesure supprimée avec succès." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
