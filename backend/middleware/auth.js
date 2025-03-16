// middleware/auth.js

const jwt = require('jsonwebtoken');
const SECRET_KEY = "votreSecretJWT";  // Clé secrète pour signer les tokens (à mettre en variable d'env en production)

// Middleware pour vérifier le token JWT
function verifAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // Récupère le token après "Bearer "
  if (!token) {
    return res.status(401).json({ message: "Accès refusé : pas de token fourni" });
  }
  try {
    // Vérification et décodage du token
    const payload = jwt.verify(token, SECRET_KEY);
    // Attachons l'ID utilisateur décodé à la requête pour utilisation dans les controllers
    req.userId = payload.id;
    next(); // token valide, on passe au prochain middleware/contrôleur
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

module.exports = { verifAuth };