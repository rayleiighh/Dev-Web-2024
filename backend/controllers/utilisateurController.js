// controllers/utilisateurController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/utilisateurModel');
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY || "defaultSecret";  // Utilisation d'une variable d'environnement


// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    const { prenom, nom, email, motDePasse } = req.body;
    // Validation basique des entrées
    if (!prenom || !nom || !email || !motDePasse) {
      return res.status(400).json({ message: "Tous les champs sont requis (prenom, nom, email, motDePasse)." });
    }
    // Vérifier si l'email est déjà utilisé
    const utilisateurExiste = await Utilisateur.findOne({ email: email });
    if (utilisateurExiste) {
      return res.status(400).json({ message: "Un compte avec cet email existe déjà." });
    }
    // Hachage du mot de passe avant sauvegarde
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(motDePasse, saltRounds);
    // Créer et sauvegarder le nouvel utilisateur
    const nouvelUtilisateur = new Utilisateur({
      prenom,
      nom,
      email,
      motDePasse: hashedPassword
    });
    await nouvelUtilisateur.save();
    // On peut éventuellement générer un token tout de suite après l'inscription pour connecter directement l'utilisateur
    const token = jwt.sign({ id: nouvelUtilisateur._id }, SECRET_KEY, { expiresIn: '2h' });
    return res.status(201).json({ 
      message: "Inscription réussie", 
      token: token, 
      utilisateur: { id: nouvelUtilisateur._id, email: nouvelUtilisateur.email, nom: nouvelUtilisateur.nom, prenom: nouvelUtilisateur.prenom }
    });
  } catch (err) {
    console.error("Erreur lors de l'inscription:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
  }
};

// Connexion (authentification)
exports.login = async (req, res) => {
  try {
    console.log("🔍 Données reçues:", req.body); // ✅ Affiche les données reçues

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
    
    
    console.log("✅ Réponse envoyée:", {
      message: "Connexion réussie",
      token: token,
      utilisateur: { id: utilisateur._id, email: utilisateur.email, nom: utilisateur.nom, prenom: utilisateur.prenom }
    });
    
    return res.status(200).json({
      message: "Connexion réussie",
      token: token,
      utilisateur: { id: utilisateur._id, email: utilisateur.email, nom: utilisateur.nom, prenom: utilisateur.prenom }
    });


    
  } catch (err) {
    console.error("Erreur lors de la connexion:", err);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
};

// Récupérer le profil de l'utilisateur connecté
exports.getMonProfil = async (req, res) => {
  try {
    // Grâce au middleware, req.userId contient l'ID de l'utilisateur
    const utilisateur = await Utilisateur.findById(req.userId).select('-motDePasse').populate('appareils');
    // select('-motDePasse') exclut le champ motDePasse du résultat pour ne pas le renvoyer
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.status(200).json(utilisateur);
  } catch (err) {
    console.error("Erreur récupération profil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération du profil." });
  }
};

// Mettre à jour le profil de l'utilisateur connecté
exports.updateMonProfil = async (req, res) => {
  try {
    const updates = req.body; // { nom: 'NouveauNom', prenom: 'NouveauPrenom', ... }
    if (updates.motDePasse) {
      // S'il souhaite changer de mot de passe, on le hache aussi
      updates.motDePasse = await bcrypt.hash(updates.motDePasse, 10);
    }
    const utilisateurMisAJour = await Utilisateur.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true }).select('-motDePasse');
    // new: true -> retourne le document mis à jour, runValidators -> applique les validations du schéma
    res.status(200).json({ message: "Profil mis à jour avec succès", utilisateur: utilisateurMisAJour });
  } catch (err) {
    console.error("Erreur mise à jour profil:", err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du profil." });
  }
};

// Supprimer le compte de l'utilisateur connecté
exports.supprimerMonCompte = async (req, res) => {
  try {
    // Supprimer l'utilisateur
    await Utilisateur.findByIdAndDelete(req.userId);
    // (Optionnel) Supprimer ou anonymiser les données liées: appareils, consommations, notifications
    // Ici, pour simplifier, on pourrait laisser MongoDB supprimer en cascade si on a défini des référentiels "on delete"
    // Sinon, il faudrait supprimer manuellement les appareils de l'utilisateur, etc.
    res.status(200).json({ message: "Compte utilisateur supprimé avec succès" });
  } catch (err) {
    console.error("Erreur suppression compte:", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression du compte." });
  }
};
