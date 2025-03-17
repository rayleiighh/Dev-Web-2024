// controllers/notificationController.js

const Notification = require('../models/notificationModel');
const Utilisateur = require('../models/utilisateurModel');

// Obtenir les notifications de l'utilisateur connecté
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ utilisateur: req.userId })
      .populate('appareil') // Vérifie que l'appareil est bien peuplé
      .sort({ createdAt: -1 });

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ message: "Aucune notification trouvée." });
    }

    res.status(200).json(notifications);
  } catch (err) {
    console.error("Erreur récupération notifications:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des notifications." });
  }
};


// Marquer une notification comme envoyée (et simuler l'envoi de mail)
exports.envoyerNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    // Récupérer la notification et vérifier qu'elle appartient à l'utilisateur
    const notification = await Notification.findById(notificationId).populate('utilisateur').populate('appareil');
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée." });
    }
    if (notification.utilisateur._id.toString() !== req.userId) {
      return res.status(403).json({ message: "Cette notification n'appartient pas à l'utilisateur." });
    }
    // Simuler l'envoi de l'email de notification:
    // Par exemple, on pourrait utiliser un service email ici. On va simplement marquer envoyee = true.
    notification.envoyee = true;
    await notification.save();
    res.status(200).json({ message: "Notification envoyée (email simulé)", notification });
  } catch (err) {
    console.error("Erreur envoi notification:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'envoi de la notification." });
  }
};

// Supprimer une notification
exports.supprimerNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    // Vérifier que la notification appartient à l'utilisateur
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée." });
    }
    if (notification.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Vous ne pouvez pas supprimer cette notification." });
    }
    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: "Notification supprimée." });
  } catch (err) {
    console.error("Erreur suppression notification:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression de la notification." });
  }
};