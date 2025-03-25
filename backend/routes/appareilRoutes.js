const express = require('express');
const router = express.Router();
const {
  getAppareils,
  updateAppareilEtat,
  initPrises,
  createAppareil
} = require('../controllers/appareilController');
const { verifAuth } = require('../middleware/auth');

const auth = require('../middleware/auth');

router.get('/', verifAuth, getAppareils);
router.patch('/:id/etat', verifAuth, updateAppareilEtat);
router.post('/init', verifAuth, initPrises);
router.post('/', verifAuth, createAppareil);


module.exports = router;
