const express = require('express');
const router = express.Router();
const consommationController = require('../controllers/consommationController');
const { verifAuthUtilisateur } = require('../middleware/authUtilisateur');
const { verifAuthDevice } = require('../middleware/authDevice');
const { Parser } = require('json2csv');
const Consommation = require('../models/consommationModel');


router.get('/export-csv', verifAuthUtilisateur, consommationController.exporterConsommationsEnCSV);

//Enregistrer une consommation individuelle (web app)
router.post('/', verifAuthUtilisateur, consommationController.creerConsommation);

//Enregistrer un batch de consommations (pico)
router.post('/batch', verifAuthDevice, consommationController.creerBatchConsommation);

//Récupérer toutes les consommations formatées (web app)
router.get('/', verifAuthUtilisateur, consommationController.getConsommations);

// Récupérer la dernière consommation (web app)
router.get('/latest', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  }, consommationController.getDerniereConsommation);

//Récupérer une consommation par ID (web app)
router.get('/:id', verifAuthUtilisateur, consommationController.getConsommationParId);

//Calculer la consommation moyenne pour un appareil (web app)
router.get('/moyenne/:appareilId', verifAuthUtilisateur, consommationController.calculerMoyenneConsommation);


module.exports = router; 