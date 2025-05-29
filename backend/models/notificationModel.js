const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  utilisateurs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur'}],
  // Référence à l'utilisateur destinataire de la notification
  multiprise: { type: mongoose.Schema.Types.ObjectId, ref: 'Multiprise', required: true },
  // Appareil concerné par la notification (ex: appareil qui dépasse le seuil)
  contenu:     { type: String, required: true },    
  envoyee:     { type: Boolean, default: false }    // Statut d'envoi de la notification (false = pas encore envoyée par email)
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
