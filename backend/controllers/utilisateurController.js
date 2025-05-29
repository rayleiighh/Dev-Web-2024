const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/utilisateurModel');
const Appareil = require('../models/appareilModel');
const Consommation = require('../models/consommationModel');
const Notification = require('../models/notificationModel');
const Multiprise = require('../models/multipriseModel'); 
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

    // Vérifier si l'utilisateur a confirmé son email
    if (!utilisateur.verifie) {
      return res.status(403).json({ message: "Veuillez confirmer votre email avant de vous connecter." });
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
      utilisateur: {
        id: utilisateur._id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        photoProfil: utilisateur.photoProfil || ''  
      }
    });
  } catch (err) {
    console.error("Erreur lors de la connexion:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
}
async function verifierEmail(req, res) {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const utilisateur = await Utilisateur.findById(decoded.id);
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (utilisateur.verifie) {
      return res.status(200).json({ message: "Ce compte a été vérifié." });
    }

    utilisateur.verifie = true;
    await utilisateur.save();

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
      from: 'PowerTrack <powertrack5000@gmail.com>',
      to: utilisateur.email,
      subject: "Bienvenue sur PowerTrack",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; border: 1px solid #e0e0e0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
  <h2 style="color: #2c3e50;">Bienvenue <span style="color: #3498db;">${utilisateur.prenom}</span> !</h2>
  
  <p style="font-size: 16px; color: #333;">
    Votre compte est maintenant <strong>activé</strong>.
  </p>

  <p style="font-size: 16px; color: #333;">
    Vous pouvez maintenant vous connecter et profiter de toutes les fonctionnalités de <strong>PowerTrack</strong>.
  </p>

  <div style="text-align: center; margin-top: 30px;">
    <a href="${process.env.FRONTEND_URL}" style="background-color: #3498db; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      Se connecter à PowerTrack
    </a>
  </div>

  <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;" />

  <p style="font-size: 13px; color: #888; text-align: center;">
    Si vous avez des questions, contactez-nous à <a href="mailto:powertrack5000@gmail.com" style="color: #3498db;">powertrack5000@gmail.com</a>
  </p>
</div>
`
    };

    await transporter.sendMail(mailOptions);
    console.log("Email de bienvenue envoyé !");

    res.status(200).json({ message: "Compte vérifié avec succès !" });

  } catch (err) {
    console.error("Erreur de vérification d'email :", err);
    res.status(500).json({ message: "Erreur lors de la vérification du compte ou lien expiré" });
  }
}




// Inscription d'un nouvel utilisateur avec envoi d'email
async function register(req, res) {
  try {
    const { prenom, nom, email, motDePasse, deviceId } = req.body;

    if (!prenom || !nom || !email || !motDePasse || !deviceId) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const utilisateurExiste = await Utilisateur.findOne({ email });
    if (utilisateurExiste) {
      return res.status(400).json({ message: "Un compte avec cet email existe déjà." });
    }

    const multiprise = await Multiprise.findOne({ identifiantUnique: deviceId });
    if (!multiprise) {
      return res.status(404).json({ message: " Aucune multiprise trouvée avec cet identifiant. Veuillez configurer l'appareil au préalable." });
    }

    //  Crée un nouvel utilisateur non vérifié
    const nouvelUtilisateur = new Utilisateur({
      prenom,
      nom,
      email,
      motDePasse,
      verifie: false
    });
    await nouvelUtilisateur.save();

    //  Ajoute l'utilisateur à la multiprise s'il n'est pas encore lié
    if (!multiprise.utilisateurs.includes(nouvelUtilisateur._id)) {
      multiprise.utilisateurs.push(nouvelUtilisateur._id);
      await multiprise.save();
    }

    //  Créer les prises uniquement si la multiprise n'en possède pas encore
    const prisesExistantes = await Appareil.countDocuments({ multiprise: multiprise._id });
    if (prisesExistantes === 0) {
      const prisesParDefaut = [
        { nom: "Prise 1", gpioIndex: 0, multiprise: multiprise._id },
        { nom: "Prise 2", gpioIndex: 1, multiprise: multiprise._id },
        { nom: "Prise 3", gpioIndex: 2, multiprise: multiprise._id }
      ];
      await Appareil.insertMany(prisesParDefaut);
      console.log(`Prises créées pour multiprise ${deviceId}`);
    } else {
      console.log(`Les prises existent déjà pour multiprise ${deviceId}`);
    }

    //  Création du token de vérification
    const verificationToken = jwt.sign(
      { id: nouvelUtilisateur._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const urlDeVerification = `${process.env.FRONTEND_URL}/verifier-email?token=${verificationToken}`;

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
      subject: "Confirmez votre inscription sur PowerTrack",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f7f7f7; border-radius: 8px; border: 1px solid #ddd;">
          <h2 style="color: #2c3e50;">Bonjour ${nouvelUtilisateur.prenom},</h2>
          <p>Merci pour votre inscription à <strong>PowerTrack</strong> !</p>
          <p>Pour activer votre compte, cliquez sur le lien ci-dessous :</p>
          <p style="margin: 20px 0;"><a href="${urlDeVerification}" style="color: #ffffff; background-color: #3498db; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Activer mon compte</a></p>
          <p>Ce lien est valable pendant 24h.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ccc;" />
          <p style="font-size: 14px; color: #999;">Si vous n'avez pas fait cette demande, ignorez simplement cet email.</p>
        </div>
        <p style="font-size: 13px; color: #999; margin-top: 30px;">
        — L’équipe PowerTrack<br>
        <a href="mailto:powertrack5000@gmail.com">powertrack5000@gmail.com</a>
        </p>`
    };

    await transporter.sendMail(mailOptions);
    console.log("Email de vérification envoyé !");

    return res.status(200).json({
      message: "Un email de vérification a été envoyé. Veuillez confirmer pour activer votre compte."
    });

  } catch (err) {
    console.error("Erreur lors de l'inscription:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
  }
}




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

async function mettreAJourProfil(req, res) {
  try {
    const utilisateur = await Utilisateur.findById(req.userId);
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const { nom, email, ancienMotDePasse, nouveauMotDePasse } = req.body;
    let motDePasseChange = false;
    let nomChange = false;
    let emailChange = false;

    if (nom && nom !== utilisateur.nom) {
      utilisateur.nom = nom;
      nomChange = true;
    }

    let ancienneEmail = utilisateur.email;

    if (email && email !== utilisateur.email) {
      utilisateur.email = email;
      emailChange = true;
    }


    if (ancienMotDePasse && nouveauMotDePasse) {
      const match = await bcrypt.compare(ancienMotDePasse, utilisateur.motDePasse);
      if (!match) {
        return res.status(400).json({ message: "Ancien mot de passe incorrect." });
      }
      utilisateur.motDePasse = nouveauMotDePasse;
      motDePasseChange = true;
    }

    await utilisateur.save();

    // Préparation du transporteur
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Envoi des mails selon les cas :
    if (motDePasseChange) {
      await transporter.sendMail({
        from: 'PowerTrack <powertrack5000@gmail.com>',
        to: utilisateur.email,
        subject: "Votre mot de passe a été modifié",
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Bonjour ${utilisateur.prenom},</h2>
            <p>Votre mot de passe a bien été changé.</p>
            <p style="color: red;"><strong>Si vous n'êtes pas à l'origine de ce changement, veuillez nous contacter immédiatement.</strong></p>
            <hr />
            <p style="font-size: 13px; color: #888;">– L’équipe PowerTrack</p>
          </div>
        `
      });
    }

    if (nomChange) {
      await transporter.sendMail({
        from: 'PowerTrack <powertrack5000@gmail.com>',
        to: utilisateur.email,
        subject: "Votre nom a été modifié",
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Bonjour ${utilisateur.prenom},</h2>
            <p>Votre nom a été mis à jour avec succès.</p>
            <p>Si vous n'avez pas fait cette modification, contactez-nous immédiatement.</p>
            <hr />
            <p style="font-size: 13px; color: #888;">– L’équipe PowerTrack</p>
          </div>
        `
      });
    }

    if (emailChange) {
      await transporter.sendMail({
        from: 'PowerTrack <powertrack5000@gmail.com>',
        to: email, // nouveau mail
        subject: "Votre adresse email a été modifiée",
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Bonjour ${utilisateur.prenom},</h2>
            <p>Votre adresse email a été modifiée.</p>
            <p>Si vous n’êtes pas à l’origine de ce changement, veuillez nous alerter rapidement.</p>
            <hr />
            <p style="font-size: 13px; color: #888;">– L’équipe PowerTrack</p>
          </div>
        `
      });

      await transporter.sendMail({
      from: 'PowerTrack <powertrack5000@gmail.com>',
      to: ancienneEmail, // ancien mail
      subject: "Changement de votre adresse email",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Bonjour ${utilisateur.prenom},</h2>
          <p>Nous vous informons que l'adresse email liée à votre compte PowerTrack a été changée.</p>
          <p>Nouvelle adresse : <strong>${email}</strong></p>
          <p>Si ce n’est pas vous, contactez-nous immédiatement.</p>
          <hr />
          <p style="font-size: 13px; color: #888;">– L’équipe PowerTrack</p>
        </div>
      `
    });


    }

    res.status(200).json({ message: "Profil mis à jour avec succès." });

  } catch (err) {
    console.error("Erreur mise à jour profil :", err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du profil." });
  }
}




// Mettre à jour le profil utilisateur


const updateProfilePicture = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findById(req.userId);
    

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    if (req.file) {
      //  Chemin relatif pour que le frontend puisse accéder via http://localhost:5000/uploads/profiles/...
      const relativePath = `uploads/profiles/${req.file.filename}`;
      utilisateur.photoProfil = relativePath;
      
    }

    await utilisateur.save();

    res.status(200).json({
      message: 'Photo de profil mise à jour avec succès.',
      photo: utilisateur.photoProfil
    });
  } catch (err) {
    console.error("Erreur mise à jour photo de profil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour de la photo." });
  }
};


module.exports = { register, login, getMonProfil, supprimerMonCompte, updatePreferences, mettreAJourProfil, updateProfilePicture, verifierEmail };
