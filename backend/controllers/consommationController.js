const mongoose = require('mongoose');
const Consommation = require('../models/consommationModel');
const Appareil = require('../models/appareilModel');
const Notification = require('../models/notificationModel');

// 📌 Créer un nouvel enregistrement de consommation
exports.creerConsommation = async (req, res) => {
  try {
    const { appareil: appareilId, value } = req.body;

    // Validation des données
    if (!value || typeof value !== 'number') {
      return res.status(400).json({ message: "La valeur `value` est requise et doit être un nombre." });
    }

    // Vérifier si un appareil est spécifié
    let appareil = null;
    if (appareilId) {
      if (!mongoose.Types.ObjectId.isValid(appareilId)) {
        return res.status(400).json({ message: "ID d'appareil invalide." });
      }

      appareil = await Appareil.findById(appareilId);
      if (!appareil) {
        return res.status(404).json({ message: "Appareil spécifié introuvable." });
      }
      if (appareil.utilisateur.toString() !== req.userId) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à enregistrer une consommation pour cet appareil." });
      }
    }

    // Enregistrement de la consommation
    const nouvelleConso = new Consommation({
      appareil: appareilId || null,
      value,
      timestamp: new Date(),
    });

    await nouvelleConso.save();

    // Récupérer la dernière mesure depuis la base de données
    const derniereConso = await Consommation.findOne().sort({ timestamp: -1 });

    // Émettre la dernière mesure via WebSocket
    if (global.io && derniereConso) {
      console.log("💡 Émission de l'événement 'nouvelleConsommation'");
      global.io.emit('nouvelleConsommation', {
        _id: derniereConso._id,
        value: derniereConso.value,
        timestamp: derniereConso.timestamp,
        appareil: appareil ? { _id: appareil._id, nom: appareil.nom } : null,
      });
    } else {
      console.log("⚠️ global.io est undefined ou aucune consommation trouvée");
    }

    // Notification si dépassement du seuil
    if (appareil && appareil.seuilConso && value > appareil.seuilConso) {
      const contenuNotif = `Consommation élevée: ${value} A (seuil: ${appareil.seuilConso}) pour "${appareil.nom}"`;
      const notif = new Notification({
        utilisateur: req.userId,
        appareil: appareilId,
        contenu: contenuNotif,
        envoyee: false,
      });
      await notif.save();
    }

    res.status(201).json({ message: "Consommation enregistrée", consommation: nouvelleConso });
  } catch (err) {
    console.error("❌ Erreur création consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la création de la consommation." });
  }
};

// 📌 Récupérer une consommation par ID
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
    const consommations = await Consommation.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('appareil');
    res.status(200).json(consommations);
  } catch (err) {
    console.error("❌ Erreur récupération consommations:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération." });
  }
};


// 📌 Récupérer la dernière consommation
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

// 📌 Calculer la consommation moyenne sur une période
// 📌 Calculer la consommation moyenne sur une période
exports.calculerMoyenneConsommation = async (req, res) => {
  try {
    const appareilId = req.params.appareilId;
    const { debut, fin } = req.query;

    // Validation des paramètres
    if (!appareilId || !debut || !fin) {
      return res.status(400).json({
        message: "Veuillez fournir un ID d'appareil et une plage de dates (debut, fin)"
      });
    }

    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(appareilId)) {
      return res.status(400).json({ message: "ID d'appareil invalide." });
    }

    // Convertir les dates en objets Date
    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);

    // Vérifier si les dates sont valides
    if (isNaN(dateDebut.getTime())) {
      return res.status(400).json({ message: "Date de début invalide." });
    }
    if (isNaN(dateFin.getTime())) {
      return res.status(400).json({ message: "Date de fin invalide." });
    }

    // Rechercher les consommations de cet appareil dans l'intervalle
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