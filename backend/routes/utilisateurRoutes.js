const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController'); 
const { verifAuth } = require('../middleware/auth'); 
const { verifAuthAdmin } = require('../middleware/auth');
const { body } = require('express-validator');
// en gros pour contrer les injections faut utiliser le .escape de body qui  Échappe les caractères spéciaux pour éviter l'injection


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
router.put('/me', verifAuth, utilisateurController.updateMonProfil); 
router.delete('/me', verifAuth, utilisateurController.supprimerMonCompte);

router.delete('/utilisateurs/:id', verifAuthAdmin, utilisateurController.supprimerUnUtilisateur);

router.post('/register', [
    body('prenom').trim().escape().notEmpty().withMessage('Le prénom est requis'),
    body('nom').trim().escape().notEmpty().withMessage('Le nom est requis'),
    body('email').trim().escape().isEmail().withMessage('Email invalide'),
    body('motDePasse').trim().isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
], utilisateurController.register);


module.exports = router;
