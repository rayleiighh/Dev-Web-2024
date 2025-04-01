require('dotenv').config();
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/utilisateurModel');

const SECRET_KEY = process.env.JWT_SECRET;

async function verifAuthUtilisateur(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token requis' });

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    const utilisateur = await Utilisateur.findById(payload.id);

    if (!utilisateur) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    req.utilisateur = utilisateur;
    req.userId = utilisateur._id;
    console.log("🧑‍💻 Utilisateur authentifié :", utilisateur.email);
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
}

module.exports = { verifAuthUtilisateur };
