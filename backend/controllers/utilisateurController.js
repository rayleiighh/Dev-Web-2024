const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/utilisateurModel');
const Appareil = require('../models/appareilModel');
const Consommation = require('../models/consommationModel');
const Notification = require('../models/notificationModel');
const nodemailer = require('nodemailer');

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

    // ✅ Transporteur Mailtrap
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // important : false pour STARTTLS sur port 587
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
      if (error) {
        console.error("Erreur lors de l'envoi de l'email :", error);
      } else {
        console.log("Email de confirmation envoyé :", info.response);
      }
    });

    const token = jwt.sign({ id: nouvelUtilisateur._id }, SECRET_KEY, { expiresIn: '2h' });

    return res.status(201).json({
      message: "Inscription réussie",
      token,
      utilisateur: {
        id: nouvelUtilisateur._id,
        email,
        nom,
        prenom
      }
    });

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

// Récupérer le profil utilisateur
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

// Mettre à jour le profil utilisateur
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

// Supprimer le compte utilisateur et toutes ses données associées
exports.supprimerMonCompte = async (req, res) => {
  try {
    // Récupérer les appareils liés à cet utilisateur
    const appareils = await Appareil.find({ utilisateur: req.userId });
    const appareilIds = appareils.map(a => a._id);

    // Supprimer toutes les consommations et notifications liées aux appareils
    await Consommation.deleteMany({ appareil: { $in: appareilIds } });
    await Notification.deleteMany({ appareil: { $in: appareilIds } });

    // Supprimer les appareils de l'utilisateur
    await Appareil.deleteMany({ utilisateur: req.userId });

    // Supprimer l'utilisateur lui-même
    await Utilisateur.findByIdAndDelete(req.userId);

    res.status(200).json({ message: "Compte utilisateur supprimé avec succès." });
  } catch (err) {
    console.error("Erreur suppression compte:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression du compte." });
  }
};
