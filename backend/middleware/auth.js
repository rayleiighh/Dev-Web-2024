// middleware/auth.js

const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;

// Middleware d'authentification JWT
function verifAuth(req, res, next) {
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
}

module.exports = { verifAuth };
