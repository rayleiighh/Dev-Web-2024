// models/consommationModel.js

const mongoose = require('mongoose');

const consommationSchema = new mongoose.Schema({
  appareil:   { type: mongoose.Schema.Types.ObjectId, ref: 'Appareil', required: false },  
  value:      { type: Number, required: true },  // ✅ Remplace `quantite` si on enregistre des valeurs unitaires
  timestamp:  { type: Date, default: Date.now }  // ✅ Ajouter un timestamp automatique
}, { timestamps: true });

module.exports = mongoose.model('Consommation', consommationSchema);