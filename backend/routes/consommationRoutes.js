const express = require('express');
const router = express.Router();
const consommationController = require('../controllers/consommationController');
const { verifAuth } = require('../middleware/auth');

// 🔒 Enregistrer une consommation individuelle
+ router.post('/', verifAuth, consommationController.creerConsommation);

// 🔒 Enregistrer un batch de consommations
+ router.post('/batch', verifAuth, consommationController.creerBatchConsommation);

// 🔒 Récupérer toutes les consommations formatées
+ router.get('/', verifAuth, consommationController.getConsommations);

// 🔒 Récupérer la dernière consommation
router.get('/latest', verifAuth, consommationController.getDerniereConsommation);

// 🔒 Récupérer une consommation par ID
+ router.get('/:id', verifAuth, consommationController.getConsommationParId);

// 🔒 Calculer la consommation moyenne pour un appareil
+ router.get('/moyenne/:appareilId', verifAuth, consommationController.calculerMoyenneConsommation);

module.exports = router;
