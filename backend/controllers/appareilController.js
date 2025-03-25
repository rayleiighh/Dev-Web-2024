// controllers/appareilController.js

const Appareil = require('../models/appareilModel');
const Consommation = require('../models/consommationModel'); // si besoin de supprimer conso liées
const Notification = require('../models/notificationModel'); // si besoin de notifier lors de changements

// Créer un nouvel appareil pour l'utilisateur connecté
exports.creerAppareil = async (req, res) => {
  try {
    const { nom, seuilConso, heureDebut, heureFin } = req.body;
    if (!nom) {
      return res.status(400).json({ message: "Le nom de l'appareil est requis." });
    }
    // Créer l'appareil avec l'utilisateur propriétaire (req.userId)
    const nouvelAppareil = new Appareil({
      nom: nom,
      utilisateur: req.userId,
      seuilConso: seuilConso || 0,
      // Si des heures de mode nuit sont fournies, on active le mode nuit
      modeNuit: {
        actif: heureDebut && heureFin ? true : false,
        heureDebut: heureDebut,
        heureFin: heureFin
      }
    });
    const appareilSauvegarde = await nouvelAppareil.save();
    res.status(201).json({ message: "Appareil créé", appareil: appareilSauvegarde });
  } catch (err) {
    console.error("Erreur création appareil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la création de l'appareil." });
  }
};

// Mettre à jour un seuil de consommation d'un appareil
exports.mettreAJourSeuil = async (req, res) => {
  try {
    const { seuil } = req.body;
    const appareilId = req.params.id;
    const userId = req.userId;

    if (!seuil || isNaN(seuil)) {
      return res.status(400).json({ message: "Seuil invalide." });
    }

    const appareil = await Appareil.findOne({ _id: appareilId, utilisateur: userId });
    if (!appareil) {
      return res.status(404).json({ message: "Appareil non trouvé ou accès refusé." });
    }

    appareil.seuil = seuil;
    await appareil.save();

    res.status(200).json({ message: "Seuil mis à jour avec succès.", appareil });
  } catch (err) {
    console.error("Erreur mise à jour seuil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du seuil." });
  }
};

// Récupérer tous les appareils de l'utilisateur connecté
exports.getAppareils = async (req, res) => {
  try {
    // Trouver tous les appareils dont le champ utilisateur correspond à req.userId
    const appareils = await Appareil.find({ utilisateur: req.userId });
    res.status(200).json(appareils);
  } catch (err) {
    console.error("Erreur récupération appareils:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des appareils." });
  }
};

// Récupérer un appareil spécifique (par ID) appartenant à l'utilisateur
exports.getAppareilParId = async (req, res) => {
  try {
    const appareilId = req.params.id;
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) {
      return res.status(404).json({ message: "Appareil non trouvé." });
    }
    // Vérifier que l'appareil appartient bien à l'utilisateur connecté
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé à cet appareil." });
    }
    res.status(200).json(appareil);
  } catch (err) {
    console.error("Erreur récupération appareil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération de l'appareil." });
  }
};

// Mettre à jour un appareil
exports.updateAppareil = async (req, res) => {
  try {
    const appareilId = req.params.id;
    // Vérifier existence de l'appareil et appartenance
    let appareil = await Appareil.findById(appareilId);
    if (!appareil) {
      return res.status(404).json({ message: "Appareil non trouvé." });
    }
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé : cet appareil n'appartient pas à l'utilisateur." });
    }
    // Mettre à jour les champs autorisés
    const { nom, seuilConso, etat, modeNuit } = req.body;
    if (nom !== undefined) appareil.nom = nom;
    if (seuilConso !== undefined) appareil.seuilConso = seuilConso;
    if (etat !== undefined) appareil.etat = etat;
    if (modeNuit !== undefined) {
      // modeNuit est un objet { actif, heureDebut, heureFin }
      appareil.modeNuit.actif = modeNuit.actif !== undefined ? modeNuit.actif : appareil.modeNuit.actif;
      appareil.modeNuit.heureDebut = modeNuit.heureDebut || appareil.modeNuit.heureDebut;
      appareil.modeNuit.heureFin = modeNuit.heureFin || appareil.modeNuit.heureFin;
    }
    const appareilMisAJour = await appareil.save();
    res.status(200).json({ message: "Appareil mis à jour", appareil: appareilMisAJour });
  } catch (err) {
    console.error("Erreur mise à jour appareil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour de l'appareil." });
  }
};

// Supprimer un appareil
exports.supprimerAppareil = async (req, res) => {
  try {
    const appareilId = req.params.id;
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) {
      return res.status(404).json({ message: "Appareil non trouvé." });
    }
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Cet appareil n'appartient pas à l'utilisateur." });
    }
    // Supprimer l'appareil
    await Appareil.findByIdAndDelete(appareilId);
    // Supprimer les consommations liées à cet appareil, et notifications liées
    await Consommation.deleteMany({ appareil: appareilId });
    await Notification.deleteMany({ appareil: appareilId });
    res.status(200).json({ message: "Appareil supprimé avec succès" });
  } catch (err) {
    console.error("Erreur suppression appareil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression de l'appareil." });
  }
};

// Allumer un appareil (mettre etat à true)
exports.allumerAppareil = async (req, res) => {
  try {
    const appareilId = req.params.id;
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) return res.status(404).json({ message: "Appareil non trouvé." });
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé à cet appareil." });
    }
    appareil.etat = true;
    await appareil.save();
    res.status(200).json({ message: "Appareil allumé (etat = true)", appareil });
  } catch (err) {
    console.error("Erreur allumage appareil:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'allumage de l'appareil." });
  }
};

// Éteindre un appareil (mettre etat à false)
exports.eteindreAppareil = async (req, res) => {
  try {
    const appareilId = req.params.id;
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) return res.status(404).json({ message: "Appareil non trouvé." });
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Accès refusé à cet appareil." });
    }
    appareil.etat = false;
    await appareil.save();
    res.status(200).json({ message: "Appareil éteint (etat = false)", appareil });
  } catch (err) {
    console.error("Erreur extinction appareil:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'extinction de l'appareil." });
  }
};

// Activer le mode nuit sur un appareil (avec heures début/fin)
exports.activerModeNuit = async (req, res) => {
  try {
    const appareilId = req.params.id;
    const { heureDebut, heureFin } = req.body;
    if (!heureDebut || !heureFin) {
      return res.status(400).json({ message: "Veuillez fournir l'heureDebut et heureFin pour activer le mode nuit." });
    }
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) return res.status(404).json({ message: "Appareil non trouvé." });
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Cet appareil n'appartient pas à l'utilisateur." });
    }
    // Mettre à jour le modeNuit
    appareil.modeNuit.actif = true;
    appareil.modeNuit.heureDebut = heureDebut;
    appareil.modeNuit.heureFin = heureFin;
    // On peut en plus éteindre l'appareil immédiatement si l'heure actuelle est dans la plage nuit.
    // (Ici on ne le fait pas explicitement, on se contente d'enregistrer les préférences)
    await appareil.save();
    res.status(200).json({ message: `Mode nuit activé pour l'appareil (de ${heureDebut} à ${heureFin})`, appareil });
  } catch (err) {
    console.error("Erreur activation mode nuit:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'activation du mode nuit." });
  }
};

// Désactiver le mode nuit sur un appareil
exports.desactiverModeNuit = async (req, res) => {
  try {
    const appareilId = req.params.id;
    const appareil = await Appareil.findById(appareilId);
    if (!appareil) return res.status(404).json({ message: "Appareil non trouvé." });
    if (appareil.utilisateur.toString() !== req.userId) {
      return res.status(403).json({ message: "Cet appareil n'appartient pas à l'utilisateur." });
    }
    // Désactiver le mode nuit
    appareil.modeNuit.actif = false;
    // On peut décider de laisser heureDebut/heureFin tel quel ou les effacer
    // appareil.modeNuit.heureDebut = undefined;
    // appareil.modeNuit.heureFin = undefined;
    await appareil.save();
    res.status(200).json({ message: "Mode nuit désactivé pour l'appareil", appareil });
  } catch (err) {
    console.error("Erreur désactivation mode nuit:", err);
    res.status(500).json({ message: "Erreur serveur lors de la désactivation du mode nuit." });
  }
};