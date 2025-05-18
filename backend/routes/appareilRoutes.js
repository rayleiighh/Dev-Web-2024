const express = require('express');
const router = express.Router();
const {
  getAppareils,
  updateAppareilEtat,
  initPrises,
  createAppareil,
  updateModeNuit,
  updateNomAppareil,
  toggleFavori
} = require('../controllers/appareilController');

const { verifAuthUtilisateur } = require('../middleware/authUtilisateur');
const { verifAuthDevice } = require('../middleware/authDevice');

const autoriserAppareils = require("../middleware/autoriserAppareils");

router.get("/", autoriserAppareils, getAppareils);
router.patch("/:id/etat", verifAuthUtilisateur, updateAppareilEtat); 
router.post('/init', verifAuthDevice , initPrises);
router.post('/', verifAuthDevice , createAppareil);
router.patch('/:id/mode-nuit', autoriserAppareils , updateModeNuit);
router.patch('/:id/nom', verifAuthUtilisateur, updateNomAppareil);
router.patch('/:id/favori', verifAuthUtilisateur, toggleFavori);



module.exports = router;
