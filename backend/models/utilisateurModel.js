// models/utilisateurModel.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Schéma Utilisateur
const utilisateurSchema = new mongoose.Schema({
  prenom: { type: String, required: true },
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  appareils: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appareil' }],
  preferences: {
    unite: { type: String, enum: ['kWh', 'Wh'], default: 'kWh' },
    theme: { type: String, enum: ['clair', 'sombre'], default: 'clair' },
    emailNotifications: { type: Boolean, default: true }
  },
  photoProfil: { type: String, default: '' },
  verifie: { type: Boolean, default: false } // ✅ champ pour gérer la vérification
}, { timestamps: true });


// Avant de sauvegarder, hacher le mot de passe si modifié
utilisateurSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) return next();
  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
  next();
});

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
