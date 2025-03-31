const express = require('express');
const router = express.Router();
const {
  getAppareils,
  updateAppareilEtat,
  initPrises,
  createAppareil,
  updateModeNuit
} = require('../controllers/appareilController');

const { verifAuthUtilisateur } = require('../middleware/authUtilisateur');
const { verifAuthDevice } = require('../middleware/authDevice');

const autoriserAppareils = require("../middleware/autoriserAppareils");

router.get("/", autoriserAppareils, getAppareils);
router.patch("/:id/etat", verifAuthUtilisateur, updateAppareilEtat); 
router.post('/init', verifAuthDevice , initPrises);
router.post('/', verifAuthDevice , createAppareil);
router.patch('/:id/mode-nuit', verifAuthDevice , updateModeNuit);


module.exports = router;
