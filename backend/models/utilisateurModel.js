// models/utilisateurModel.js

const mongoose = require('mongoose');

// Schéma Utilisateur
const utilisateurSchema = new mongoose.Schema({
  prenom: { type: String, required: true },               // Prénom de l'utilisateur
  nom:    { type: String, required: true },               // Nom de famille de l'utilisateur
  email:  { type: String, required: true, unique: true }, // Email (doit être unique pour chaque utilisateur)
  motDePasse: { type: String, required: true },           // Mot de passe haché de l'utilisateur
  appareils: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appareil' }] 
  // Liste des appareils associés à cet utilisateur (relations 1→N avec Appareil)
}, { timestamps: true });  // timestamps ajoute createdAt et updatedAt automatiquement

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
