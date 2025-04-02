// middleware/autoriserAppareils.js
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;

function autoriserAppareils(req, res, next) {
  console.log("🔐 Middleware mixte activé :", req.originalUrl);

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token requis" });

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const payload = jwt.verify(token, SECRET_KEY);

    if (payload.id) {
      req.userId = payload.id; // utilisateur
    } else if (payload.deviceId) {
      req.deviceId = payload.deviceId; // multiprise
    } else {
      return res.status(401).json({ message: "Token sans identifiant valide" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

module.exports = autoriserAppareils;
