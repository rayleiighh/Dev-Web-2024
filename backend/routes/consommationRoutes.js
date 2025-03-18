// routes/consommationRoutes.js

const express = require('express');
const router = express.Router();
const consommationController = require('../controllers/consommationController');
const Consommation = require('../models/consommationModel');  // ✅ Remplace `Reading` par `Consommation`
const { verifAuth } = require('../middleware/auth');

// 🔒 Route protégée : Enregistrer une consommation
router.post('/consommations', verifAuth, async (req, res) => {
    try {
        console.log("📡 Requête reçue :", req.body); // 🛠 Debug: Affiche ce que le backend reçoit

        const { value } = req.body;
        if (typeof value !== 'number') {
            return res.status(400).json({ error: "La valeur doit être un nombre." });
        }

        const newConsommation = new Consommation({ value });  // ✅ Utilisation de `Consommation`
        await newConsommation.save();  // Sauvegarde dans MongoDB

        console.log(`✅ Mesure reçue : ${value} A`);
        res.status(201).json({ message: "Donnée enregistrée", value });
    } catch (err) {
        console.error("❌ Erreur lors de l'enregistrement :", err);
        res.status(500).json({ error: err.message });
    }
});

// 🔓 Route publique : Récupérer toutes les consommations
router.get('/consommations', async (req, res) => {
    try {
        const data = await Consommation.find().sort({ timestamp: -1 }).limit(50); // ✅ Remplace `Reading` par `Consommation`
        res.json(data);
    } catch (err) {
        console.error("❌ Erreur récupération consommations:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🔒 Routes protégées pour récupérer, modifier et supprimer une consommation
router.get('/:id', verifAuth, consommationController.getConsommationParId);
router.put('/:id', verifAuth, consommationController.updateConsommation);
router.delete('/:id', verifAuth, consommationController.supprimerConsommation);
router.get('/moyenne/:appareilId', verifAuth, consommationController.calculerMoyenneConsommation);

module.exports = router;
