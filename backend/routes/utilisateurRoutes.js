const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');  // ✅ Assurez-vous que ce fichier est bien importé
const { verifAuth } = require('../middleware/auth'); 
const { body } = require('express-validator');

// Vérifier que les fonctions existent bien
if (!utilisateurController.updateMonProfil) {
    console.error("❌ ERREUR: La fonction updateMonProfil n'est pas définie dans utilisateurController.js");
}
if (!utilisateurController.getMonProfil) {
    console.error("❌ ERREUR: La fonction getMonProfil n'est pas définie dans utilisateurController.js");
}

// Routes publiques
router.post('/register', utilisateurController.register);
router.post('/login', utilisateurController.login);

// Routes protégées
router.get('/me', verifAuth, utilisateurController.getMonProfil);  
router.put('/me', verifAuth, utilisateurController.updateMonProfil);  // 🔴 L'erreur vient probablement d'ici
router.delete('/me', verifAuth, utilisateurController.supprimerMonCompte);
router.post('/register', [
    body('prenom').notEmpty().withMessage('Le prénom est requis'),
    body('nom').notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('motDePasse').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
], utilisateurController.register);
module.exports = router;
