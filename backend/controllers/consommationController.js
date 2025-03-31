const mongoose = require('mongoose');
const Consommation = require('../models/consommationModel');
const Appareil = require('../models/appareilModel');
const Notification = require('../models/notificationModel');
const Multiprise = require("../models/multipriseModel");
const { sendEmail } = require('../services/notificationsService');


exports.creerConsommation = async (req, res) => {
  try {
    const { identifiantUnique, value } = req.body;

    if (!identifiantUnique || typeof value !== "number") {
      return res.status(400).json({ message: "identifiantUnique et value sont requis." });
    }

    // 🔍 Chercher la multiprise via son identifiant unique
    const multiprise = await Multiprise.findOne({ identifiantUnique });

    if (!multiprise) {
      return res.status(404).json({ message: "Multiprise introuvable." });
    }

    if (multiprise.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Non autorisé à enregistrer pour cette multiprise." });
    }

    // ⚡ Enregistrer la consommation
    const nouvelleConso = new Consommation({
      multiprise: new mongoose.Types.ObjectId(multiprise._id),
      value,
      timestamp: new Date(),
    });

    await nouvelleConso.save();

    // 📡 Envoyer en WebSocket (si actif)
    if (global.io) {
      global.io.to(req.userId).emit("nouvelleConsommation", {
        _id: nouvelleConso._id,
        value: nouvelleConso.value,
        timestamp: nouvelleConso.timestamp,
        multiprise: {
          _id: multiprise._id,
          nom: multiprise.nom,
          identifiantUnique: multiprise.identifiantUnique,
        },
      });
    }

    // 🚨 Notification + e-mail si seuil dépassé
    const SEUIL_ALERTE = 10; // 🔧 à adapter si tu veux un seuil dynamique par multiprise plus tard
    if (value > SEUIL_ALERTE) {
      const contenuNotif = `Consommation élevée: ${value} A détectée sur "${multiprise.nom}"`;

      const notif = new Notification({
        utilisateur: new mongoose.Types.ObjectId(req.userId),
        multiprise: new mongoose.Types.ObjectId(multiprise._id),
        contenu: contenuNotif,
        envoyee: false,
      });

      await notif.save();

      // 📬 Envoi email si activé
      const Utilisateur = require("../models/utilisateurModel");
      const utilisateur = await Utilisateur.findById(req.userId);

      if (utilisateur?.preferences?.emailNotifications && utilisateur.email) {
        try {
          await sendEmail(utilisateur.email, "🔔 Alerte de consommation", contenuNotif);
          notif.envoyee = true;
          await notif.save();
        } catch (err) {
          console.error("Erreur lors de l'envoi de l'email :", err);
        }
      }
    }

    res.status(201).json({ message: "Consommation enregistrée", consommation: nouvelleConso });
  } catch (err) {
    console.error("❌ Erreur création consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la création de la consommation." });
  }
};

exports.creerBatchConsommation = async (req, res) => {
  try {
    const { measurements } = req.body;
    if (!Array.isArray(measurements) || measurements.length === 0) {
      return res.status(400).json({ message: "La liste des mesures est requise et ne doit pas être vide." });
    }

    const createdMeasurements = [];
    for (const measurement of measurements) {
      if (typeof measurement.value !== 'number') {
        return res.status(400).json({ message: "Chaque mesure doit contenir une propriété 'value' numérique." });
      }

      const nouvelleConso = new Consommation({
        value: measurement.value,
        timestamp: measurement.timestamp ? new Date(measurement.timestamp * 1000) : new Date()
      });
      await nouvelleConso.save();
      createdMeasurements.push(nouvelleConso);

      // Émission immédiate via WebSocket pour chaque mesure insérée
      if (global.io) {
        global.io.emit('nouvelleConsommation', {
          _id: nouvelleConso._id,
          value: nouvelleConso.value,
          timestamp: nouvelleConso.timestamp
        });
      }
    }

    res.status(201).json({ message: "Mesures enregistrées", measurements: createdMeasurements });
  } catch (err) {
    console.error("❌ Erreur lors de la création du batch de consommations:", err);
    res.status(500).json({ message: "Erreur serveur lors de la création des mesures." });
  }
};

exports.getConsommationParId = async (req, res) => {
  try {
    const consommation = await Consommation.findById(req.params.id).populate('appareil');
    if (!consommation) {
      return res.status(404).json({ message: "Consommation introuvable." });
    }
    res.status(200).json(consommation);
  } catch (err) {
    console.error("❌ Erreur récupération consommation par ID:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération de la consommation." });
  }
};

exports.getConsommations = async (req, res) => {
  try {
    const consommations = await Consommation.find().sort({ timestamp: -1 }).limit(50);
    // Formatage côté serveur : conversion de la date en chaîne lisible
    const dataFormatee = consommations.map(c => {
      const dateObj = new Date(c.timestamp);
      const dateLisible = dateObj.toLocaleString('fr-FR', {
        timeZone: 'UTC',
        dateStyle: 'short',
        timeStyle: 'medium'
      });
      return { ...c._doc, timestamp: dateLisible };
    });
    res.status(200).json(dataFormatee);
  } catch (err) {
    console.error("❌ Erreur récupération consommations:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération." });
  }
};

exports.getDerniereConsommation = async (req, res) => {
  try {
    const derniereConso = await Consommation.findOne().sort({ timestamp: -1 });
    if (!derniereConso) {
      return res.status(404).json({ message: "Aucune consommation trouvée." });
    }
    res.status(200).json(derniereConso);
  } catch (err) {
    console.error("❌ Erreur récupération dernière consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération de la dernière consommation." });
  }
};

exports.calculerMoyenneConsommation = async (req, res) => {
  try {
    const appareilId = req.params.appareilId;
    const { debut, fin } = req.query;

    if (!appareilId || !debut || !fin) {
      return res.status(400).json({ message: "Veuillez fournir un ID d'appareil et une plage de dates (debut, fin)" });
    }
    if (!mongoose.Types.ObjectId.isValid(appareilId)) {
      return res.status(400).json({ message: "ID d'appareil invalide." });
    }

    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);
    if (isNaN(dateDebut.getTime())) {
      return res.status(400).json({ message: "Date de début invalide." });
    }
    if (isNaN(dateFin.getTime())) {
      return res.status(400).json({ message: "Date de fin invalide." });
    }

    const consommations = await Consommation.find({
      appareil: appareilId,
      timestamp: { $gte: dateDebut, $lte: dateFin }
    });

    if (consommations.length === 0) {
      return res.status(200).json({
        message: "Aucune consommation trouvée sur cette période.",
        moyenne: 0,
        unite: "A",
        nombreEnregistrements: 0
      });
    }

    const total = consommations.reduce((sum, c) => sum + c.value, 0);
    const moyenne = total / consommations.length;

    res.status(200).json({
      message: `Consommation moyenne entre ${debut} et ${fin}`,
      moyenne,
      unite: "A",
      nombreEnregistrements: consommations.length
    });
  } catch (err) {
    console.error("❌ Erreur calcul moyenne consommation :", err);
    res.status(500).json({ message: "Erreur serveur lors du calcul de la moyenne." });
  }
};
