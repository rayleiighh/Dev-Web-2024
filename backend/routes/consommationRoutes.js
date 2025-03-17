// routes/consommationRoutes.js

const express = require('express');
const router = express.Router();
const consommationController = require('../controllers/consommationController');
const { verifAuth } = require('../middleware/auth');

router.use(verifAuth);

// Créer un enregistrement de consommation pour un appareil (de l'utilisateur)
router.post('/', consommationController.creerConsommation);

// Récupérer toutes les consommations de l'utilisateur (tous appareils, ou filtrer par appareil via req.query.appareil)
router.get('/', consommationController.getConsommations);

// Récupérer une consommation spécifique par son ID
router.get('/:id', consommationController.getConsommationParId);

// Mettre à jour une consommation (ex: corriger quantite ou période)
router.put('/:id', consommationController.updateConsommation);

// Supprimer une consommation
router.delete('/:id', consommationController.supprimerConsommation);

// Calculer la consommation moyenne sur une période donnée pour un appareil
router.get('/moyenne/:appareilId', consommationController.calculerMoyenneConsommation);

module.exports = router;