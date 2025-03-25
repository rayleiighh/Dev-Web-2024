const express = require('express');
const router = express.Router();
const { register, login, getMonProfil, updateMonProfil, supprimerMonCompte, updatePreferences } = require('../controllers/utilisateurController');
const { verifAuth } = require('../middleware/auth');
const { body } = require('express-validator');

if (!register) {
    console.error("❌ ERREUR: La fonction register n'est pas définie dans utilisateurController.js");
}
if (!getMonProfil) {
    console.error("❌ ERREUR: La fonction getMonProfil n'est pas définie dans utilisateurController.js");
}
if (!updateMonProfil) {
    console.error("❌ ERREUR: La fonction updateMonProfil n'est pas définie dans utilisateurController.js");
}
if (!supprimerMonCompte) {
    console.error("❌ ERREUR: La fonction supprimerMonCompte n'est pas définie dans utilisateurController.js");
}
if (!updatePreferences) {
    console.error("❌ ERREUR: La fonction updatePreferences n'est pas définie dans utilisateurController.js");
}

// Routes publiques
router.post('/register', [
    body('prenom').notEmpty().withMessage('Le prénom est requis'),
    body('nom').notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('motDePasse').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
], register);

router.post('/login', login);
// Routes protégées
router.get('/me', verifAuth, getMonProfil);  
router.put('/me', verifAuth, updateMonProfil); 
router.delete('/supprimer-compte', verifAuth, supprimerMonCompte);

// Mise à jour des préférences utilisateur
router.patch('/preferences', verifAuth, updatePreferences);

module.exports = router;
