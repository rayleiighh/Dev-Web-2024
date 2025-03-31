const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Multiprise = require('../models/multipriseModel');

const SECRET_KEY = process.env.JWT_SECRET;

router.post('/login', async (req, res) => {
  const { deviceId, secret } = req.body;

  if (!deviceId || !secret) {
    return res.status(400).json({ message: "deviceId et secret requis" });
  }

  try {
    const multiprise = await Multiprise.findOne({ identifiantUnique: deviceId });

    if (!multiprise) {
      return res.status(404).json({ message: "Multiprise inconnue" });
    }

    if (multiprise.secret !== secret) {
      return res.status(403).json({ message: "Clé secrète incorrecte" });
    }

    const token = jwt.sign({ deviceId }, SECRET_KEY, { expiresIn: "3h" });

    return res.status(200).json({ token });
  } catch (err) {
    console.error("❌ Erreur device login :", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
