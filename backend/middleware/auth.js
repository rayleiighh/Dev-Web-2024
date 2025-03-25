// middleware/auth.js

const jwt = require('jsonwebtoken');
require('dotenv').config();
const readline = require('readline');
const SECRET_KEY = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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

// Middleware d'authentification JWT + vérification mot de passe admin
function verifAuthAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Accès refusé : pas de token fourni" });
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    req.userId = payload.id;

    // Demande du mot de passe administrateur
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Veuillez entrer le mot de passe administrateur : ', (inputPassword) => {
      rl.close();
      if (inputPassword === ADMIN_PASSWORD) {
        console.log('✅ Accès administrateur autorisé.');
        next();
      } else {
        console.log('❌ Mot de passe administrateur incorrect.');
        return res.status(403).json({ message: "Accès refusé : mot de passe administrateur incorrect" });
      }
    });

  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

module.exports = { verifAuth, verifAuthAdmin };

