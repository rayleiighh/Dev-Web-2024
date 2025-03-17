// models/consommationModel.js

const mongoose = require('mongoose');

const consommationSchema = new mongoose.Schema({
  appareil:   { type: mongoose.Schema.Types.ObjectId, ref: 'Appareil', required: true },
  // Référence à l'appareil concerné par cette mesure de consommation
  debut:      { type: Date, required: true },   // Date/heure de début de la mesure
  fin:        { type: Date, required: true },   // Date/heure de fin de la mesure
  quantite:   { type: Number, required: true }  // Quantité d'énergie consommée sur la période (ex: en kWh)
}, { timestamps: true });

module.exports = mongoose.model('Consommation', consommationSchema);