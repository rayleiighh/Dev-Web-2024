// controllers/consommationController.js

const Consommation = require('../models/consommationModel');
const Appareil = require('../models/appareilModel');
const Notification = require('../models/notificationModel');
const Utilisateur = require('../models/utilisateurModel');
const { sendEmail, sendSMS } = require('../services/notificationService');

// Créer un nouvel enregistrement de consommation
exports.creerConsommation = async (req, res) => {
  try {
    const { appareil: appareilId, debut, fin, quantite } = req.body;
    if (!appareilId || !debut || !fin || quantite === undefined) {
      return res.status(400).json({ message: "appareil, debut, fin et quantite sont requis." });
    }

    const appareil = await Appareil.findById(appareilId).populate('utilisateur');
    if (!appareil) {
      return res.status(404).json({ message: "Appareil spécifié introuvable." });
    }

    if (appareil.utilisateur._id.toString() !== req.userId) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à enregistrer une consommation pour cet appareil." });
    }

    // Enregistrer la consommation
    const nouvelleConso = new Consommation({ appareil: appareilId, debut, fin, quantite });
    await nouvelleConso.save();

    // 🔥 Vérifier si la consommation dépasse le seuil de l’appareil
    if (appareil.seuilConso && quantite > appareil.seuilConso) {
      const utilisateur = appareil.utilisateur;
      const message = `⚠️ Alerte consommation ! Votre appareil "${appareil.nom}" a dépassé le seuil de ${appareil.seuilConso} kWh avec une consommation de ${quantite} kWh.`;

      // Enregistrement de la notification dans MongoDB
      const notif = new Notification({
        utilisateur: utilisateur._id,
        appareil: appareilId,
        contenu: message,
        envoyee: false
      });
      await notif.save();

      // 🔥 Envoi d'un email à l'utilisateur
      if (utilisateur.email) {
        sendEmail(utilisateur.email, "Alerte de consommation", message);
      }

      // 🔥 Envoi d'un SMS (si numéro de téléphone disponible)
      if (utilisateur.telephone) {
        sendSMS(utilisateur.telephone, message);
      }
    }

    res.status(201).json({ message: "Consommation enregistrée", consommation: nouvelleConso });
  } catch (error) {
    console.error("Erreur ajout consommation:", error);
    res.status(500).json({ message: "Erreur serveur" });
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
