// controllers/notificationController.js

const Notification = require('../models/notificationModel');
const Utilisateur = require('../models/utilisateurModel');
const { sendEmail, sendSMS } = require('../services/notificationsService');



// nouvelle méthode dans notificationController.js
exports.creerNotification = async (req, res) => {
  try {
    const { contenu, multiprise } = req.body;
    
    // Validation
    if (!contenu || !multiprise) {
      return res.status(400).json({ message: "Contenu et multiprise requis" });
    }

    const notification = await Notification.create({
      contenu,
      utilisateur: req.userId,
      multiprise
    });

    // Envoi email
    const utilisateur = await Utilisateur.findById(req.userId);
    if (utilisateur?.preferences?.emailNotifications && utilisateur.email) {
      try {
        await sendEmail(
          utilisateur.email,
          "Nouvelle alerte",
          `Bonjour,\n\n${contenu}\n\nCordialement`
        );
        notification.envoyee = true;
        await notification.save();
      } catch (emailError) {
        console.error("Erreur email:", emailError);
      }
    }

    res.status(201).json(notification);
  } catch (err) {
    console.error("Erreur création notification:", err);
    res.status(500).json({ message: "Erreur création notification" });
  }
};
// Obtenir les notifications de l'utilisateur connecté
exports.getNotifications = async (req, res) => {
  try {
    const filtreEnvoye = req.query.envoyee;
    let criteria = { utilisateur: req.userId };
    if (filtreEnvoye !== undefined) {
      criteria.envoyee = filtreEnvoye === 'true';
    }
    
    const notifications = await Notification.find(criteria).populate('multiprise').sort({ createdAt: -1 });

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ message: "Aucune notification trouvée." });
    }

    res.status(200).json(notifications);
  } catch (err) {
    console.error("Erreur récupération notifications:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des notifications." });
  }
};

// Marquer une notification comme envoyée (et envoyer email/SMS)
exports.envoyerNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId).populate('utilisateur').populate('multiprise');
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée." });
    }
    if (notification.utilisateur._id.toString() !== req.userId) {
      return res.status(403).json({ message: "Cette notification n'appartient pas à l'utilisateur." });
    }
    
    // Vérification de l'email avant envoi
    try {
      console.log("📧 Tentative d'envoi d'email à:", notification.utilisateur.email);
      if (notification.utilisateur.preferences?.emailNotifications) {
        if (!notification.utilisateur.email) {
          console.error("❌ Adresse email manquante !");
        } else {
          await sendEmail(notification.utilisateur.email, "Nouvelle alerte de consommation", notification.contenu);
          notification.envoyee = true;
          await notification.save();
          console.log("✅ Email envoyé après création de notification !");
        }
      } else {
        console.log("❌ Email non envoyé : préférence désactivée.");
      }
    } catch (err) {
      console.error("❌ Erreur lors de l'envoi de l'e-mail :", err);
    }
    
    res.status(200).json({ message: "Notification envoyée (email/SMS)", notification });
  } catch (err) {
    console.error("Erreur envoi notification:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'envoi de la notification." });
  }
};

// Supprimer une notification
exports.supprimerNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée." });
    }
    if (notification.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Vous ne pouvez pas supprimer cette notification." });
    }
    await Notification.findByIdAndDelete(notificationId);
    
    // 🔥 Envoi WebSocket pour informer le frontend
    const io = req.app.get('io');
    if (io) {
      io.emit("supprimer-notification", notificationId);
    }
    
    res.status(200).json({ message: "Notification supprimée." });
  } catch (err) {
    console.error("Erreur suppression notification:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression de la notification." });
  }
};
