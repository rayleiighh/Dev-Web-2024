// routes/consommationRoutes.js

const express = require('express');
const router = express.Router();
const consommationController = require('../controllers/consommationController');
const Reading = require('../models/Reading'); 
const { verifAuth } = require('../middleware/auth');

router.use(verifAuth);

// Créer un enregistrement de consommation pour un appareil (de l'utilisateur)
router.post('/readings', async (req, res) => {
    try {
        console.log("📡 Requête reçue :", req.body);  // 🛠 Debug: Affiche ce que le backend reçoit
        const { value } = req.body;
        if (typeof value !== 'number') {
            return res.status(400).json({ error: "La valeur doit être un nombre." });
        }

        const newReading = new Reading({ value });
        await newReading.save();  // Sauvegarde dans MongoDB

        console.log(`✅ Mesure reçue : ${value} A`);
        res.status(201).json({ message: "Donnée enregistrée", value });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer toutes les consommations de l'utilisateur (tous appareils, ou filtrer par appareil via req.query.appareil)
router.get('/readings', async (req, res) => {
    try {
        const data = await Reading.find().sort({ timestamp: -1 }).limit(50);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer une consommation spécifique par son ID
router.get('/:id', consommationController.getConsommationParId);

// Mettre à jour une consommation (ex: corriger quantite ou période)
router.put('/:id', consommationController.updateConsommation);

// Supprimer une consommation
router.delete('/:id', consommationController.supprimerConsommation);

// Calculer la consommation moyenne sur une période donnée pour un appareil
router.get('/moyenne/:appareilId', consommationController.calculerMoyenneConsommation);

module.exports = router;