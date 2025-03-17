// routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifAuth } = require('../middleware/auth');
const Notification = require('../models/notificationModel'); // 🔥 Ajoute cette ligne si elle manque

router.use(verifAuth);

// Obtenir toutes les notifications de l'utilisateur (avec possibilité de filtrer ?envoyee=false par ex.)
router.get('/', verifAuth, async (req, res) => {
    console.log("🔍 Vérification utilisateur:", req.userId); // 🔥 Affiche l'ID reçu

    if (!req.userId) {
        return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    try {
      const notifications = await Notification.find({ utilisateur: req.userId }) // 🔥 Comparaison avec une string
        .populate('appareil')
        .sort({ createdAt: -1 });

      console.log("🔍 Notifications trouvées:", notifications); // 🔥 Voir ce que MongoDB retourne

      if (!notifications || notifications.length === 0) {
        return res.status(404).json({ message: "Aucune notification trouvée pour cet utilisateur." });
      }

      res.status(200).json(notifications);
    } catch (err) {
      console.error("Erreur récupération notifications:", err);
      res.status(500).json({ message: "Erreur serveur lors de la récupération des notifications." });
    }
});





// Marquer une notification comme envoyée (simuler l'envoi d'email)
router.put('/:id/envoyer', notificationController.envoyerNotification);

// Supprimer une notification (par ID)
router.delete('/:id', notificationController.supprimerNotification);

module.exports = router;