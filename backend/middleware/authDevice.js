require('dotenv').config();
const jwt = require('jsonwebtoken');
const Multiprise = require('../models/multipriseModel');

const SECRET_KEY = process.env.JWT_SECRET;

async function verifAuthDevice(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    const deviceId = payload.deviceId;

    if (!deviceId) return res.status(400).json({ message: "deviceId absent du token" });

    const multiprise = await Multiprise.findOne({ identifiantUnique: deviceId });
    if (!multiprise) return res.status(404).json({ message: "Multiprise inconnue" });

    req.deviceId = deviceId;
    req.multiprise = multiprise;
    console.log(" Auth OK multiprise :", deviceId);
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token device invalide ou expiré" });
  }
}

module.exports = { verifAuthDevice };
