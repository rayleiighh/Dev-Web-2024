// middleware/auth.js
require('dotenv').config();
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

// Middleware d'authentification JWT
function verifAuth(req, res, next) {
  console.log("🔍 Middleware d'auth activé pour :", req.originalUrl);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: "Accès refusé : pas de token fourni" });
  }
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    req.userId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
  console.log("utlisateur ID extrait du token:", req.userId);
}

module.exports = { verifAuth };
