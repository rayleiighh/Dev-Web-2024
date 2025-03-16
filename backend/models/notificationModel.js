// models/notificationModel.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  // Référence à l'utilisateur destinataire de la notification
  appareil:    { type: mongoose.Schema.Types.ObjectId, ref: 'Appareil', required: true },
  // Appareil concerné par la notification (ex: appareil qui dépasse le seuil)
  contenu:     { type: String, required: true },    // Contenu du message de notification
  envoyee:     { type: Boolean, default: false }    // Statut d'envoi de la notification (false = pas encore envoyée par email)
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
