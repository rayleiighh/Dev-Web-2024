const express = require('express');
const router = express.Router();
const { register, login, getMonProfil, updateMonProfil, supprimerMonCompte, updatePreferences } = require('../controllers/utilisateurController');
const { verifAuthUtilisateur } = require('../middleware/authUtilisateur');
const { body } = require('express-validator');
const upload = require('../middleware/upload');  // Importer le middleware
const { updateProfilePicture } = require('../controllers/utilisateurController');
const { mettreAJourProfil } = require('../controllers/utilisateurController');
const { verifierEmail } = require('../controllers/utilisateurController');
const { demandeResetMotDePasse } = require('../controllers/utilisateurController');
const { reinitialiserMotDePasse } = require('../controllers/utilisateurController');


if (!register) {
    console.error("ERREUR: La fonction register n'est pas définie dans utilisateurController.js");
}
if (!getMonProfil) {
    console.error("ERREUR: La fonction getMonProfil n'est pas définie dans utilisateurController.js");
}
if (!updateMonProfil) {
    console.error("❌ ERREUR: La fonction updateMonProfil n'est pas définie dans utilisateurController.js");
}
if (!supprimerMonCompte) {
    console.error("ERREUR: La fonction supprimerMonCompte n'est pas définie dans utilisateurController.js");
}
if (!updatePreferences) {
    console.error("ERREUR: La fonction updatePreferences n'est pas définie dans utilisateurController.js");
}


router.post('/register', [
    body('prenom').notEmpty().withMessage('Le prénom est requis'),
    body('nom').notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('motDePasse').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
], register);

router.get('/verifier-email', verifierEmail);
router.post('/login', login);
router.post('/oubli-motdepasse', demandeResetMotDePasse);
router.post('/reset-mot-de-passe/:token', reinitialiserMotDePasse);

router.get('/me', verifAuthUtilisateur, getMonProfil);  

router.delete('/supprimer-compte', verifAuthUtilisateur, supprimerMonCompte);
router.patch('/profil', verifAuthUtilisateur, mettreAJourProfil);
router.patch('/profil/photo', verifAuthUtilisateur, upload.single('photo'), updateProfilePicture);




router.patch('/preferences', verifAuthUtilisateur, updatePreferences);

module.exports = router;
