const mongoose = require('mongoose');
const Consommation = require('../models/consommationModel');
const Appareil = require('../models/appareilModel');
const Notification = require('../models/notificationModel');
const Multiprise = require("../models/multipriseModel");
const { sendEmail } = require('../services/notificationsService');
const { Parser } = require('json2csv'); 


exports.creerConsommation = async (req, res) => {
  try {
    const { identifiantUnique, value } = req.body;

    if (!identifiantUnique || typeof value !== "number") {
      return res.status(400).json({ message: "identifiantUnique et value sont requis." });
    }

    // Find the power strip using its unique identifier
    const multiprise = await Multiprise.findOne({ identifiantUnique });

    if (!multiprise) {
      return res.status(404).json({ message: "Multiprise introuvable." });
    }

    if (!multiprise.utilisateurs || !Array.isArray(multiprise.utilisateurs)) {
      return res.status(500).json({ message: "Aucun utilisateur lié à cette multiprise." });
    }
    console.log(" req.userId =", req.userId);
    console.log(" multiprise.utilisateurs =", multiprise.utilisateurs);
    console.log(" as string =", multiprise.utilisateurs.map(u => u.toString()));


    const userId = req.userId.toString(); // Secure the comparison

    const isAutorise =
      Array.isArray(multiprise.utilisateurs) &&
      multiprise.utilisateurs.map(u => u.toString()).includes(userId);

    if (!isAutorise) {
      return res.status(403).json({ message: "Non autorisé à enregistrer pour cette multiprise." });
    }

    // Save the consumption
    const nouvelleConso = new Consommation({
      multiprise: new mongoose.Types.ObjectId(multiprise._id),
      value,
      timestamp: new Date(),
    });

    await nouvelleConso.save();

    // Send via WebSocket (if active)
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

    // Notification + email if threshold (= seuil) exceeded 
    const SEUIL_ALERTE = 10; 
    if (value > SEUIL_ALERTE) {
      const contenuNotif = `Consommation élevée: ${value} A détectée sur "${multiprise.nom}"`;


      const utilisateursCibles = multiprise.utilisateurs || [];

      const notif = new Notification({
        utilisateurs: utilisateursCibles,
        multiprise: multiprise._id,
        contenu: contenuNotif,
        envoyee: false,
      });

      await notif.save();

      //  Send email if enabled
      const Utilisateur = require("../models/utilisateurModel");
      const utilisateur = await Utilisateur.findById(req.userId);

      for (const userId of utilisateursCibles) {
        const utilisateur = await Utilisateur.findById(userId);
        if (utilisateur?.preferences?.emailNotifications && utilisateur.email) {
          try {
            await sendEmail(utilisateur.email, "🔔 Alerte de consommation", contenuNotif);
          } catch (err) {
            console.error("Erreur envoi mail :", err);
          }
        }
      }
    }

    res.status(201).json({ message: "Consommation enregistrée", consommation: nouvelleConso });
  } catch (err) {
    console.error(" Erreur création consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la création de la consommation." });
  }
};

exports.creerBatchConsommation = async (req, res) => {
  try {
    const { measurements } = req.body;
    if (!Array.isArray(measurements) || measurements.length === 0) {
      return res.status(400).json({ message: "La liste des mesures est requise et ne doit pas être vide." });
    }

    if (!req.deviceId) {
      return res.status(401).json({ message: "Authentification par multiprise requise." });
    }

    const multiprise = await Multiprise.findOne({ identifiantUnique: req.deviceId });
    if (!multiprise) {
      return res.status(404).json({ message: "Multiprise non trouvée." });
    }

    const createdMeasurements = [];
    for (const measurement of measurements) {
      if (typeof measurement.value !== 'number') {
        return res.status(400).json({ message: "Chaque mesure doit contenir une propriété 'value' numérique." });
      }

      const nouvelleConso = new Consommation({
        value: measurement.value,
        timestamp: measurement.timestamp ? new Date(measurement.timestamp * 1000) : new Date(),
        multiprise: multiprise._id  
      });

      await nouvelleConso.save();
      createdMeasurements.push(nouvelleConso);

      //  Immediate WebSocket emission
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
    console.error(" Erreur lors de la création du batch de consommations:", err);
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
    console.error(" Erreur récupération consommation par ID:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération de la consommation." });
  }
};

exports.getConsommations = async (req, res) => {
  try {
    const { debut, fin } = req.query;

    const filtre = {};

    if (debut || fin) {
      filtre.timestamp = {};
      if (debut) {
        const dateDebut = new Date(debut);
        if (!isNaN(dateDebut)) filtre.timestamp.$gte = dateDebut;
      }
      if (fin) {
        const dateFin = new Date(fin);
        if (!isNaN(dateFin)) filtre.timestamp.$lte = dateFin;
      }
    }

    // Préparer la requête
    let requete = Consommation.find(filtre).sort({ timestamp: -1 });

    
    if (!debut && !fin) {
      requete = requete.limit(20);
    }

    const consommations = await requete;

    const dataFormatee = consommations.map(c => {
      const dateObj = new Date(c.timestamp);
      const dateLisible = dateObj.toLocaleString('fr-FR', {
        timeZone: 'UTC',
        dateStyle: 'short',
        timeStyle: 'medium'
      });
      return {
        _id: c._id,
        value: c.value,
        timestamp: c.timestamp,
        appareil: c.appareil,
        multiprise: c.multiprise,
        timestampISO: c.timestamp,
        timestampLisible: dateLisible
      };
    });

    res.status(200).json(dataFormatee);
  } catch (err) {
    console.error(" Erreur récupération consommations:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération." });
  }
};



exports.getDerniereConsommation = async (req, res) => {
  try {
    const consommation = await Consommation.findOne().sort({ timestamp: -1 });

    if (!consommation) {
      return res.status(404).json({ message: "Aucune consommation trouvée." });
    }

    const nowUTC = new Date(Date.now()); 
    const timestampUTC = new Date(consommation.timestamp);

    let diffInSeconds = (nowUTC.getTime() - timestampUTC.getTime()) / 1000;
    console.log(`Différence avec dernière consommation : ${diffInSeconds.toFixed(1)} secondes`);

    if (diffInSeconds < 0) {
      console.warn(" Timestamp dans le futur détecté !");
      diffInSeconds = Math.abs(diffInSeconds); 
    }

    if (diffInSeconds > 45) {
      return res.status(200).json({ active: false, message: "Multiprise éteinte" });
    }

    return res.status(200).json({
      active: true,
      _id: consommation._id,
      value: consommation.value,
      timestamp: consommation.timestamp
    });

  } catch (err) {
    console.error("Erreur récupération dernière consommation:", err);
    res.status(500).json({ message: "Erreur serveur." });
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
    console.error(" Erreur calcul moyenne consommation :", err);
    res.status(500).json({ message: "Erreur serveur lors du calcul de la moyenne." });
  }
};

exports.exporterConsommationsEnCSV = async (req, res) => {
  try {
    const { debut, fin } = req.query;

    if (!debut) {
      return res.status(400).json({ message: "La date de début est requise pour exporter les données." });
    }

    const dateDebut = new Date(debut);
    const dateFin = fin ? new Date(fin) : new Date();

    if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
      return res.status(400).json({ message: "Dates invalides." });
    }

    const consommations = await Consommation.find({
      timestamp: { $gte: dateDebut, $lte: dateFin }
    }).populate('multiprise').lean();

    const dataFormatee = consommations.map(c => {
      const dateLisible = new Date(c.timestamp).toLocaleString('fr-FR', {
        timeZone: 'UTC',
        dateStyle: 'short',
        timeStyle: 'medium'
      });

      return {
        "Horodatage": dateLisible,
        "Identifiant Multiprise": c.multiprise?.identifiantUnique || "Multiprise Inconnue",
        "Énergie (kWh)": (c.value * 0.001).toFixed(4),
        "Courant (A)": c.value.toFixed(3)
      };
    });

    const fields = ["Horodatage", "Identifiant Multiprise", "Énergie (kWh)", "Courant (A)"];
    const opts = { fields };

    const parser = new Parser(opts);
    const csv = parser.parse(dataFormatee);

    res.header('Content-Type', 'text/csv');
    res.attachment('consommations.csv');
    return res.send(csv);
  } catch (err) {
    console.error('Erreur export CSV:', err);
    res.status(500).json({ message: 'Erreur serveur lors de l’export CSV.' });
  }
};


