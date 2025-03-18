// controllers/consommationController.js

const mongoose = require('mongoose'); 
const Consommation = require('../models/consommationModel');
const Appareil = require('../models/appareilModel');
const Notification = require('../models/notificationModel');

// 📌 Créer un nouvel enregistrement de consommation
exports.creerConsommation = async (req, res) => {
  try {
    const { appareil: appareilId, value } = req.body;

    if (!value || typeof value !== 'number') {
      return res.status(400).json({ message: "La valeur `value` est requise et doit être un nombre." });
    }

    // Vérifier si un appareil est spécifié
    let appareil = null;
    if (appareilId) {
      appareil = await Appareil.findById(appareilId);
      if (!appareil) {
        return res.status(404).json({ message: "Appareil spécifié introuvable." });
      }
      if (appareil.utilisateur.toString() !== req.userId) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à enregistrer une consommation pour cet appareil." });
      }
    }

    // 🔥 Enregistrement de la consommation
    const nouvelleConso = new Consommation({
      appareil: appareilId || null,
      value: value,
      timestamp: new Date()
    });

    await nouvelleConso.save();

    // 📌 Vérifier si la consommation dépasse un seuil et créer une notification
    if (appareil && appareil.seuilConso && value > appareil.seuilConso) {
      const contenuNotif = `Consommation élevée: ${value} A (seuil: ${appareil.seuilConso}) pour "${appareil.nom}"`;
      const notif = new Notification({
        utilisateur: req.userId,
        appareil: appareilId,
        contenu: contenuNotif,
        envoyee: false
      });
      await notif.save();
    }

    res.status(201).json({ message: "Consommation enregistrée", consommation: nouvelleConso });
  } catch (err) {
    console.error("❌ Erreur création consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la création de la consommation." });
  }
};

// 📌 Récupérer toutes les consommations
exports.getConsommations = async (req, res) => {
  try {
    const consommations = await Consommation.find().sort({ timestamp: -1 }).limit(50);
    res.status(200).json(consommations);
  } catch (err) {
    console.error("❌ Erreur récupération consommations:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des consommations." });
  }
};

// 📌 Récupérer une consommation par son ID
exports.getConsommationParId = async (req, res) => {
  try {
    const consoId = req.params.id;

    // 🛑 Vérifier si l'ID est un ObjectId valide avant d'interroger MongoDB
    if (!mongoose.Types.ObjectId.isValid(consoId)) {
      return res.status(400).json({ message: "ID de consommation invalide." });
    }

    const conso = await Consommation.findById(consoId).populate('appareil');

    if (!conso) {
      return res.status(404).json({ message: "Enregistrement de consommation non trouvé." });
    }

    res.status(200).json(conso);
  } catch (err) {
    console.error("❌ Erreur récupération consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération de la consommation." });
  }
};

// 📌 Mettre à jour une consommation
exports.updateConsommation = async (req, res) => {
  try {
    const consoId = req.params.id;
    const { value } = req.body;

    if (typeof value !== 'number') {
      return res.status(400).json({ message: "La valeur `value` doit être un nombre." });
    }

    const conso = await Consommation.findById(consoId);
    if (!conso) {
      return res.status(404).json({ message: "Consommation non trouvée." });
    }

    conso.value = value;
    const consoMAJ = await conso.save();

    res.status(200).json({ message: "Consommation mise à jour", consommation: consoMAJ });
  } catch (err) {
    console.error("❌ Erreur mise à jour consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour de la consommation." });
  }
};

// 📌 Supprimer une consommation
exports.supprimerConsommation = async (req, res) => {
  try {
    const consoId = req.params.id;
    const conso = await Consommation.findById(consoId);

    if (!conso) {
      return res.status(404).json({ message: "Consommation non trouvée." });
    }

    await Consommation.findByIdAndDelete(consoId);
    res.status(200).json({ message: "Consommation supprimée." });
  } catch (err) {
    console.error("❌ Erreur suppression consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression de la consommation." });
  }
};

// 📌 Calculer la consommation moyenne sur une période
exports.calculerMoyenneConsommation = async (req, res) => {
  try {
    const { debut, fin } = req.query;

    if (!debut || !fin) {
      return res.status(400).json({ message: "Veuillez fournir une date de début et de fin." });
    }

    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);

    const consommations = await Consommation.find({
      timestamp: { $gte: dateDebut, $lte: dateFin }
    });

    if (consommations.length === 0) {
      return res.status(200).json({ message: "Aucune consommation enregistrée sur cette période.", moyenne: 0 });
    }

    const total = consommations.reduce((sum, c) => sum + c.value, 0);
    const moyenne = total / consommations.length;

    res.status(200).json({ 
      message: `Consommation moyenne du ${debut} au ${fin}`, 
      moyenne: moyenne,
      unite: "A",
      nombreEnregistrements: consommations.length
    });
  } catch (err) {
    console.error("❌ Erreur calcul moyenne consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors du calcul de la moyenne." });
  }
};
