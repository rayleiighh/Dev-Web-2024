// controllers/utilisateurController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/utilisateurModel');
const Appareil = require('../models/appareilModel');
const Consommation = require('../models/consommationModel');
const Notification = require('../models/notificationModel');
const nodemailer = require('nodemailer');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET;

async function login(req, res) {
  try {
      const { email, motDePasse } = req.body;

      // Vérifier si l'utilisateur existe
      const utilisateur = await Utilisateur.findOne({ email });
      if (!utilisateur) {
          return res.status(401).json({ message: "Email ou mot de passe incorrect." });
      }

      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
      if (!isMatch) {
          return res.status(401).json({ message: "Email ou mot de passe incorrect." });
      }

      // Générer un token JWT
      const token = jwt.sign({ id: utilisateur._id }, process.env.JWT_SECRET, { expiresIn: '2h' });

      res.status(200).json({
          message: "Connexion réussie",
          token,
          utilisateur: { id: utilisateur._id, email: utilisateur.email, nom: utilisateur.nom, prenom: utilisateur.prenom }
      });
  } catch (err) {
      console.error("Erreur lors de la connexion:", err);
      res.status(500).json({ message: "Erreur serveur." });
  }
}

// Inscription d'un nouvel utilisateur avec envoi d'email
async function register(req, res) {
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

    const prisesParDefaut = [
      { nom: "Prise 1", gpioIndex: 0, utilisateur: nouvelUtilisateur._id },
      { nom: "Prise 2", gpioIndex: 1, utilisateur: nouvelUtilisateur._id },
      { nom: "Prise 3", gpioIndex: 2, utilisateur: nouvelUtilisateur._id },
      { nom: "Prise 4", gpioIndex: 3, utilisateur: nouvelUtilisateur._id },
    ];
    await require('../models/appareilModel').insertMany(prisesParDefaut);
    console.log("✅ Prises créées automatiquement pour :", nouvelUtilisateur.email);

    // Envoi d'un email de confirmation
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: 'PowerTrack - Suivi Énergie <powertrack5000@gmail.com>',
      to: nouvelUtilisateur.email,
      replyTo: 'powertrack5000@gmail.com',
      subject: "Bienvenue sur PowerTrack !",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f7f7f7; border-radius: 8px; border: 1px solid #ddd;">
          <h2 style="color: #2c3e50;">Bonjour ${nouvelUtilisateur.prenom},</h2>
          <p>Bienvenue sur <strong>PowerTrack</strong> !</p>
          <p>Votre compte a été créé avec succès ✅</p>
          <p style="margin-top: 30px;">Nous sommes ravis de vous compter parmi nous. 🔌</p>
    
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ccc;" />
    
          <p style="font-size: 14px; color: #999;">Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer ce message.</p>
        </div>
        <p style="font-size: 13px; color: #999; margin-top: 30px;">
        — L’équipe PowerTrack<br>
        <a href="mailto:powertrack5000@gmail.com">powertrack5000@gmail.com</a>
        </p>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.error("Erreur lors de l'envoi de l'email :", error);
      else console.log("Email de confirmation envoyé :", info.response);
    });

    const token = jwt.sign({ id: nouvelUtilisateur._id }, SECRET_KEY, { expiresIn: '2h' });

    return res.status(201).json({
      message: "Inscription réussie",
      token,
      utilisateur: { id: nouvelUtilisateur._id, email, nom, prenom }
    });
  } catch (err) {
    console.error("Erreur lors de l'inscription:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
  }
}

// Supprimer le compte utilisateur et toutes ses données associées
async function supprimerMonCompte(req, res) {
  try {
    const appareils = await Appareil.find({ utilisateur: req.userId });
    const appareilIds = appareils.map(a => a._id);

    await Consommation.deleteMany({ appareil: { $in: appareilIds } });
    await Notification.deleteMany({ appareil: { $in: appareilIds } });
    await Appareil.deleteMany({ utilisateur: req.userId });
    await Utilisateur.findByIdAndDelete(req.userId);

    res.status(200).json({ message: "Compte utilisateur et toutes les données supprimés avec succès." });
  } catch (err) {
    console.error("Erreur suppression compte:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression du compte." });
  }
}

// Mettre à jour les préférences utilisateur
async function updatePreferences(req, res) {
  try {
    const { unite, theme, emailNotifications } = req.body;
    const user = await Utilisateur.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          'preferences.unite': unite,
          'preferences.theme': theme,
          'preferences.emailNotifications': emailNotifications,
        }
      },
      { new: true }
    );
    res.status(200).json({ message: "Préférences mises à jour", user });
  } catch (err) {
    console.error("Erreur update préférences:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// Récupérer le profil utilisateur
async function getMonProfil(req, res) {
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
}

// Mettre à jour le profil utilisateur
async function updateMonProfil(req, res) {
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
}

module.exports = { register, login, getMonProfil, updateMonProfil, supprimerMonCompte, updatePreferences };