const express = require('express');
const router = express.Router();
const {
  getAppareils,
  updateAppareilEtat,
  initPrises,
  createAppareil,
  updateModeNuit
} = require('../controllers/appareilController');
const { verifAuth } = require('../middleware/auth');

const auth = require('../middleware/auth');

router.get('/', verifAuth, getAppareils);
router.patch('/:id/etat', verifAuth, updateAppareilEtat);
router.post('/init', verifAuth, initPrises);
router.post('/', verifAuth, createAppareil);
router.patch('/:id/mode-nuit', verifAuth, updateModeNuit);


module.exports = router;
