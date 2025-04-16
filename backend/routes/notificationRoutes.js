const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifAuthUtilisateur } = require('../middleware/authUtilisateur');
const Notification = require('../models/notificationModel');
const Utilisateur = require('../models/utilisateurModel'); 
const { sendEmail } = require('../services/notificationsService');

router.use(verifAuthUtilisateur);

// 🔍 Récupérer toutes les notifications de l'utilisateur
router.get('/', async (req, res) => {
    console.log("🔍 Vérification utilisateur:", req.userId);
    
    if (!req.userId) {
        return res.status(401).json({ message: "Utilisateur non authentifié." });
    }
    
    try {
      const notifications = await Notification.find({ utilisateurs: req.userId })
        .populate('multiprise')
        .sort({ createdAt: -1 });

      console.log("🔍 Notifications trouvées:", notifications);
      
      if (!notifications || notifications.length === 0) {
        return res.status(404).json({ message: "Aucune notification trouvée pour cet utilisateur." });
      }
      
      res.status(200).json(notifications);
    } catch (err) {
      console.error("Erreur récupération notifications:", err);
      res.status(500).json({ message: "Erreur serveur lors de la récupération des notifications." });
    }
});

// 📩 Marquer une notification comme envoyée
router.put('/:id/envoyer', notificationController.envoyerNotification);

// ❌ Supprimer une notification
router.delete('/:id', notificationController.supprimerNotification);

router.post('/generer-infos', notificationController.genererNotificationInfo);

router.post('/', notificationController.creerNotification);

module.exports = router;
