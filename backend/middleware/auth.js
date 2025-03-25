// middleware/auth.js

const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;

// Middleware d'authentification JWT
function verifAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.warn("⚠️ Tentative d'accès sans token !");
    return res.status(401).json({ message: "Accès refusé : pas de token fourni" });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  if (!token) {
    return res.status(401).json({ message: "Format du token invalide." });
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    req.userId = payload.id;
    console.log("🔍 Utilisateur ID extrait du token:", req.userId);
    next();
  } catch (err) {
    console.error("❌ Erreur d'authentification :", err.message);
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
}

module.exports = { verifAuth };
