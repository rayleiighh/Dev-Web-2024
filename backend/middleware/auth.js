// middleware/auth.js

const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;

// Middleware d'authentification JWT
exports.verifAuth = (req, res, next) => {
  const authHeader = req.header('Authorization'); // 🔥 Assure-toi de bien récupérer l'en-tête
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Accès refusé : Token manquant ou mal formaté" });
  }

  const token = authHeader.split(' ')[1]; // 🔥 Extraire uniquement le token
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.id; // 🔥 Stocke l'ID utilisateur dans la requête
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
  console.log("🔍 Utilisateur ID extrait du token:", req.userId);
};