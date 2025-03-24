// controllers/consommationController.js

const Consommation = require('../models/consommationModel');
const Appareil = require('../models/appareilModel');
const Notification = require('../models/notificationModel');
const Utilisateur = require('../models/utilisateurModel');
const { sendEmail } = require('../services/notificationsService');
const mongoose = require('mongoose');



// Créer un nouvel enregistrement de consommation
exports.creerConsommation = async (req, res) => {
  try {
    const { appareilId, valeur } = req.body;
    console.log("👉 appareilId reçu:", appareilId);
    console.log("🔐 user connecté:", req.userId);

    const appareil = await Appareil.findOne({
      _id: new mongoose.Types.ObjectId(appareilId),
      utilisateur: new mongoose.Types.ObjectId(req.userId)
    });

    if (!appareil) {
      return res.status(404).json({ message: "Appareil introuvable ou accès refusé." });
    }

    const now = new Date();

    const consommation = new Consommation({
      appareil: appareilId,
      quantite: valeur / 1000,
      valeur,
      debut: now,
      fin: new Date(now.getTime() + 3600000)
    });

    console.log("💡 Seuil de l'appareil :", appareil.seuil);
    console.log("⚡ Valeur enregistrée :", valeur);

    await consommation.save();

    // 🚨 Dépassement de seuil
    if (valeur > appareil.seuil) {
      const contenu = `⚠️ Alerte : ${appareil.nom} consomme ${valeur} kWh (seuil = ${appareil.seuil} kWh).`;

      const notification = new Notification({
        utilisateur: appareil.utilisateur,
        appareil: appareil._id,
        contenu,
        envoyee: false
      });

      await notification.save();

      // 🔌 ENVOI TEMPS RÉEL via WebSocket
      const io = req.app.get('io'); // récupère l'instance Socket.IO
      io.emit("nouvelle-notification", notification); // 🚀 émet à tous les clients

      try {
        const user = await Utilisateur.findById(appareil.utilisateur);
        await sendEmail(user.email, "Nouvelle alerte de consommation", contenu);
        notification.envoyee = true;
        await notification.save();
        console.log("✅ Notification envoyée automatiquement par email");
      } catch (err) {
        console.error("❌ Erreur lors de l'envoi de l'e-mail :", err.message);
      }
    }

    res.status(201).json({ message: "Consommation enregistrée avec succès", consommation });

  } catch (err) {
    console.error("❌ Erreur serveur :", err);
    res.status(500).json({ message: "Erreur lors de l'enregistrement de la consommation" });
  }
};


// Obtenir les consommations (tous appareils de l'utilisateur, ou filtrées par appareil)
exports.getConsommations = async (req, res) => {
  try {
    const appareilFiltre = req.query.appareil;
    let consommations;
    if (appareilFiltre) {
      // Vérifier que l'appareil en question appartient bien au user
      const app = await Appareil.findById(appareilFiltre);
      if (!app || app.utilisateur.toString() !== req.userId) {
        return res.status(403).json({ message: "Accès refusé ou appareil invalide." });
      }
      // Filtrer par cet appareil
      consommations = await Consommation.find({ appareil: appareilFiltre });
    } else {
      // Récupérer tous les appareils de l'utilisateur, puis leurs consommations
      const appareilsUser = await Appareil.find({ utilisateur: req.userId }).select('_id');
      const appareilIds = appareilsUser.map(a => a._id);
      consommations = await Consommation.find({ appareil: { $in: appareilIds } });
    }
    res.status(200).json(consommations);
  } catch (err) {
    console.error("Erreur récupération consommations:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des consommations." });
  }
};

// Obtenir une consommation par son ID
exports.getConsommationParId = async (req, res) => {
  try {
    const consoId = req.params.id;
    const conso = await Consommation.findById(consoId).populate('appareil');
    if (!conso) {
      return res.status(404).json({ message: "Enregistrement de consommation non trouvé." });
    }
    // Vérifier que la consommation appartient à un appareil de l'utilisateur
    if (conso.appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès non autorisé à cette ressource." });
    }
    res.status(200).json(conso);
  } catch (err) {
    console.error("Erreur récupération consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération de la consommation." });
  }
};

// Mettre à jour un enregistrement de consommation
exports.updateConsommation = async (req, res) => {
  try {
    const consoId = req.params.id;
    const conso = await Consommation.findById(consoId).populate('appareil');
    if (!conso) {
      return res.status(404).json({ message: "Consommation non trouvée." });
    }
    // Vérifier propriétaire via l'appareil lié
    if (conso.appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Vous n'avez pas accès à cette consommation." });
    }
    // Mettre à jour les champs
    const { debut, fin, quantite } = req.body;
    if (debut !== undefined) conso.debut = new Date(debut);
    if (fin !== undefined) conso.fin = new Date(fin);
    if (quantite !== undefined) conso.quantite = quantite;
    const consoMAJ = await conso.save();
    res.status(200).json({ message: "Consommation mise à jour", consommation: consoMAJ });
  } catch (err) {
    console.error("Erreur mise à jour consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour de la consommation." });
  }
};

// Supprimer un enregistrement de consommation
exports.supprimerConsommation = async (req, res) => {
  try {
    const consoId = req.params.id;
    // On vérifie d'abord si la consommation existe et appartient bien au user
    const conso = await Consommation.findById(consoId).populate('appareil');
    if (!conso) {
      return res.status(404).json({ message: "Consommation non trouvée." });
    }
    if (conso.appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Vous ne pouvez pas supprimer cette consommation." });
    }
    await Consommation.findByIdAndDelete(consoId);
    res.status(200).json({ message: "Consommation supprimée." });
  } catch (err) {
    console.error("Erreur suppression consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression de la consommation." });
  }
};

// Calculer la consommation moyenne sur une période pour un appareil donné
exports.calculerMoyenneConsommation = async (req, res) => {
  try {
    const appareilId = req.params.appareilId;
    const { debut, fin } = req.query; // on attend des dates en paramètre de requête
    if (!debut || !fin) {
      return res.status(400).json({ message: "Veuillez fournir une date de debut et de fin (paramètres ?debut=...&fin=...)."});
    }
    // Vérifier que l'appareil appartient bien à l'utilisateur
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) {
      return res.status(404).json({ message: "Appareil non trouvé." });
    }
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Cet appareil n'appartient pas à l'utilisateur connecté." });
    }
    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);
    // Récupérer toutes les consommations de cet appareil dans l'intervalle [debut, fin]
    const consommations = await Consommation.find({ 
      appareil: appareilId,
      debut: { $gte: dateDebut },
      fin:   { $lte: dateFin }
    });
    if (consommations.length === 0) {
      return res.status(200).json({ message: "Aucune consommation enregistrée dans cette période.", moyenne: 0 });
    }
    // Calcul de la moyenne
    const total = consommations.reduce((sum, c) => sum + c.quantite, 0);
    const moyenne = total / consommations.length;
    res.status(200).json({ 
      message: `Consommation moyenne de l'appareil ${appareil.nom} du ${debut} au ${fin}`, 
      moyenne: moyenne,
      unite: "kWh",
      nombreEnregistrements: consommations.length
    });
  } catch (err) {
    console.error("Erreur calcul moyenne consommation:", err);
    res.status(500).json({ message: "Erreur serveur lors du calcul de la moyenne." });
  }
};
