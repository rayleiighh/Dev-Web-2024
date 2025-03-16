// routes/utilisateurRoutes.js

const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');

// Route d'inscription - crée un nouvel utilisateur
router.post('/register', utilisateurController.register);

// Route de connexion - authentifie l'utilisateur et renvoie un token
router.post('/login', utilisateurController.login);

module.exports = router;
