// controllers/utilisateurController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/utilisateurModel');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    const { prenom, nom, email, motDePasse } = req.body;
    if (!prenom || !nom || !email || !motDePasse) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }
    
    const utilisateurExiste = await Utilisateur.findOne({ email });
    if (utilisateurExiste) {
      return res.status(400).json({ message: "Un compte avec cet email existe déjà." });
    }
    
    const nouvelUtilisateur = new Utilisateur({ prenom, nom, email, motDePasse });
    await nouvelUtilisateur.save();
    
    const token = jwt.sign({ id: nouvelUtilisateur._id }, SECRET_KEY, { expiresIn: '2h' });
    return res.status(201).json({ message: "Inscription réussie", token, utilisateur: { id: nouvelUtilisateur._id, email, nom, prenom } });
  } catch (err) {
    console.error("Erreur lors de l'inscription:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    if (!email || !motDePasse) {
      return res.status(400).json({ message: "Email et mot de passe sont requis." });
    }
    
    const utilisateur = await Utilisateur.findOne({ email });
    if (!utilisateur) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }
    
    const match = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!match) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }
    
    const token = jwt.sign({ id: utilisateur._id }, SECRET_KEY, { expiresIn: '2h' });
    return res.status(200).json({ message: "Connexion réussie", token, utilisateur: { id: utilisateur._id, email, nom: utilisateur.nom, prenom: utilisateur.prenom } });
  } catch (err) {
    console.error("Erreur lors de la connexion:", err);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
};

exports.getMonProfil = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findById(req.userId).select('-motDePasse').populate('appareils');
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.status(200).json(utilisateur);
  } catch (err) {
    console.error("Erreur récupération profil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération du profil." });
  }
};

exports.updateMonProfil = async (req, res) => {
  try {
    const updates = req.body;
    if (updates.motDePasse) {
      updates.motDePasse = await bcrypt.hash(updates.motDePasse, 10);
    }
    const utilisateurMisAJour = await Utilisateur.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true }).select('-motDePasse');
    res.status(200).json({ message: "Profil mis à jour avec succès", utilisateur: utilisateurMisAJour });
  } catch (err) {
    console.error("Erreur mise à jour profil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du profil." });
  }
};

exports.supprimerMonCompte = async (req, res) => {
  try {
    await Utilisateur.findByIdAndDelete(req.userId);
    res.status(200).json({ message: "Compte utilisateur supprimé avec succès" });
  } catch (err) {
    console.error("Erreur suppression compte:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression du compte." });
  }
};
