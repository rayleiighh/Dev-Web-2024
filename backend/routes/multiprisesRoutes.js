const express = require("express");
const router = express.Router();
const Multiprise = require("../models/multipriseModel");

const generateSecret = () => {
  return [...Array(32)]
    .map(() => Math.floor(Math.random() * 36).toString(36))
    .join("");
};

router.post("/link", async (req, res) => {
  const { deviceId } = req.body;

  if (!deviceId) {
    return res.status(400).json({ message: "deviceId requis" });
  }

  try {
    let multiprise = await Multiprise.findOne({ identifiantUnique: deviceId });

    if (!multiprise) {
      const secret = generateSecret();

      multiprise = new Multiprise({
        nom: "Nouvelle multiprise",
        identifiantUnique: deviceId,
        secret,
        statut: "actif",
      });

      await multiprise.save();
      console.log("🆕 Multiprise créée automatiquement :", deviceId);

      return res.status(200).json({ deviceSecret: secret });
    }

    return res.status(200).json({ deviceSecret: multiprise.secret });
  } catch (err) {
    console.error("❌ Erreur dans /link :", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
