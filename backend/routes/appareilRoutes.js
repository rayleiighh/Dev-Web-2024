// routes/appareilRoutes.js

const express = require('express');
const router = express.Router();
const appareilController = require('../controllers/appareilController');
const { verifAuth } = require('../middleware/auth');

// Toutes les routes appareils sont protégées (besoin d'un token JWT valide)
router.use(verifAuth);

// Créer un nouvel appareil
router.post('/', appareilController.creerAppareil);

// Récupérer tous les appareils de l'utilisateur connecté
router.get('/', appareilController.getAppareils);

// Récupérer un appareil spécifique de l'utilisateur (par ID)
router.get('/:id', appareilController.getAppareilParId);

// Mettre à jour un appareil (ex: nom, seuilConso, etc.)
router.put('/:id', appareilController.updateAppareil);

// Supprimer un appareil
router.delete('/:id', appareilController.supprimerAppareil);

// Allumer un appareil (mettre etat = true)
router.put('/:id/on', appareilController.allumerAppareil);

// Éteindre un appareil (mettre etat = false)
router.put('/:id/off', appareilController.eteindreAppareil);

// Activer le mode nuit sur un appareil (fournir heureDebut/heureFin dans req.body)
router.put('/:id/mode-nuit/activer', appareilController.activerModeNuit);

// Désactiver le mode nuit sur un appareil
router.put('/:id/mode-nuit/desactiver', appareilController.desactiverModeNuit);

module.exports = router;