const Notification = require('../models/notificationModel');
const Multiprise = require('../models/multipriseModel');
const Consommation = require('../models/consommationModel');
const Utilisateur = require('../models/utilisateurModel');
const { sendEmail } = require('../services/notificationsService');

const mongoose = require('mongoose');

async function generateInfoNotifications() {
  try {
    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0); // UTC minuit

    const multiprises = await Multiprise.find({ statut: 'actif' });

    for (const multiprise of multiprises) {
      const consommations = await Consommation.find({
        multiprise: multiprise._id,
        timestamp: { $gte: startOfDay, $lte: now }
      });

      if (!consommations.length) continue;

      console.log(" Conso pour", multiprise.nom, ":", consommations.map(c => c.value));

      const total = consommations.reduce((sum, c) => sum + Number(c.value), 0);
      const moyenne = total / consommations.length;

      const contenu = ` Info Conso - ${multiprise.nom} : Votre consommation moyenne aujourd'hui est de ${moyenne.toFixed(2)} kWh.`;

      const notification = await Notification.create({
        contenu,
        multiprise: multiprise._id,
        utilisateurs: multiprise.utilisateurs
      });

      // Envoi email à chaque utilisateur lié
      for (const userId of multiprise.utilisateurs) {
        const user = await Utilisateur.findById(userId);
        if (user?.preferences?.emailNotifications && user.email) {
          try {
            await sendEmail(
              user.email,
              'Résumé consommation électrique',
              `Bonjour,\n\n${contenu}\n\nCordialement.`
            );
          } catch (e) {
            console.error('Erreur envoi email à', user.email, e.message);
          }
        }
      }

      console.log(' Notification envoyée pour', multiprise.nom);
    }

  } catch (error) {
    console.error(' Erreur génération notifications infos :', error);
  }
}

module.exports = generateInfoNotifications;
