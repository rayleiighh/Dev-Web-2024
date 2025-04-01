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
      utilisateurs: [req.userId],
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
    const userId = req.userId;

    const notifications = await Notification.find({
      utilisateurs: userId,
    })
      .populate("multiprise")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("❌ Erreur récupération notifications :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// Marquer une notification comme envoyée (et envoyer email/SMS)
exports.envoyerNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification introuvable." });
    }

    for (const userId of notification.utilisateurs) {
      const utilisateur = await Utilisateur.findById(userId);
      if (utilisateur?.preferences?.emailNotifications && utilisateur.email) {
        try {
          await sendEmail(utilisateur.email, "🔔 Nouvelle alerte", notification.contenu);
          console.log("✅ Email envoyé à :", utilisateur.email);
        } catch (err) {
          console.error("❌ Erreur email pour", utilisateur.email, ":", err);
        }
      }
    }

    notification.envoyee = true;
    await notification.save();

    res.status(200).json({ message: "Emails envoyés avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des emails :", error);
    res.status(500).json({ message: "Erreur lors de l'envoi des notifications." });
  }
};

// Supprimer une notification
exports.supprimerNotification = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);

    if (!notif) {
      return res.status(404).json({ message: "Notification introuvable." });
    }

    if (!notif.utilisateurs.map(id => id.toString()).includes(req.userId)) {
      return res.status(403).json({ message: "Non autorisé à supprimer cette notification." });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Notification supprimée." });
  } catch (error) {
    console.error("❌ Erreur suppression notification :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

