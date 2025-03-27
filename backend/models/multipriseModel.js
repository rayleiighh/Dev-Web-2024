const mongoose = require('mongoose');

const multipriseSchema = new mongoose.Schema({
  nom: { type: String, required: true },  // Ex : "Multiprise salon"
  identifiantUnique: { type: String, required: true, unique: true }, // UUID ou ID généré côté Raspberry
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', default: null }, // Peut être nul si non encore lié
  dateAppairage: { type: Date },
  actif: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Multiprise', multipriseSchema);
