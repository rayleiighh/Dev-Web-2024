// routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifAuth } = require('../middleware/auth');

router.use(verifAuth);

// Obtenir toutes les notifications de l'utilisateur (avec possibilité de filtrer ?envoyee=false par ex.)
router.get('/', notificationController.getNotifications);

// Marquer une notification comme envoyée (simuler l'envoi d'email)
router.put('/:id/envoyer', notificationController.envoyerNotification);

// Supprimer une notification (par ID)
router.delete('/:id', notificationController.supprimerNotification);

module.exports = router;