const express = require("express");
const router = express.Router();
const Multiprise = require("../models/multipriseModel");
const Utilisateur = require("../models/utilisateurModel");

// 🔗 Appairage automatique d'une multiprise
router.post("/link", async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: "deviceId requis" });
    }

    // 🔍 Rechercher une multiprise existante
    let multiprise = await Multiprise.findOne({ identifiantUnique: deviceId });

    // 🆕 Si elle n'existe pas encore → création automatique
    if (!multiprise) {
      // 🔒 Optionnel : valider le format du deviceId
      if (!deviceId.startsWith("RASP_")) {
        return res.status(400).json({ message: "Format de deviceId invalide" });
      }

      multiprise = new Multiprise({
        identifiantUnique: deviceId,
        nom: "Multiprise " + deviceId,  // 🔧 nom par défaut généré
        actif: true,
      });

      await multiprise.save();
      console.log("🆕 Multiprise créée automatiquement :", deviceId);
    }

    // 🔁 Vérifier si déjà liée
    if (multiprise.utilisateur) {
      return res.status(409).json({ message: "Multiprise déjà liée" });
    }

    // 👤 Associer à un utilisateur (ici : le 1er pour test)
    const utilisateur = await Utilisateur.findOne();
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    multiprise.utilisateur = utilisateur._id;
    multiprise.dateAppairage = new Date();
    await multiprise.save();

    console.log("✅ Multiprise liée avec succès :", deviceId);
    res.status(200).json({ message: "Multiprise liée", id: multiprise._id });

  } catch (err) {
    console.error("❌ Erreur dans /link :", err.message);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;
