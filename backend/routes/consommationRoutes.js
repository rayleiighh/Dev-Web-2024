const express = require('express');
const router = express.Router();
const consommationController = require('../controllers/consommationController');
const Consommation = require('../models/consommationModel');
const { verifAuth } = require('../middleware/auth');

// 🔒 Route protégée : Enregistrer une consommation
router.post('/consommations', verifAuth, consommationController.creerConsommation);

// 🔓 Route publique : Récupérer toutes les consommations
router.get('/consommations', async (req, res) => {
  try {
    const data = await Consommation.find().sort({ timestamp: -1 }).limit(50);
    res.json(data);
  } catch (err) {
    console.error("❌ Erreur récupération consommations:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🔒 Route protégée : Récupérer la dernière consommation
router.get('/consommations/latest', verifAuth, consommationController.getDerniereConsommation);

// 🔒 Route protégée : Récupérer une consommation par ID
router.get('/consommations/:id', verifAuth, consommationController.getConsommationParId);

// 🔒 Route protégée : Calculer la consommation moyenne pour un appareil
router.get('/consommations/moyenne/:appareilId', verifAuth, consommationController.calculerMoyenneConsommation);

module.exports = router;