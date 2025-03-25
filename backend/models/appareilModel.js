// models/appareilModel.js

const mongoose = require('mongoose');

const appareilSchema = new mongoose.Schema({
  nom:        { type: String, required: true },              // Nom de l'appareil (ex: "Lampe du salon")
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  // Référence à l'utilisateur propriétaire de l'appareil (relation N→1 vers Utilisateur)
  etat:       { type: Boolean, default: false },             // Etat actuel de l'appareil (true = allumé, false = éteint)
  seuilConso: { type: Number, default: 0, required: true },  // Seuil personnalisé de consommation (ex: en kWh) pour notifications
  modeNuit:   {
    actif:    { type: Boolean, default: false },             // Indicateur si le mode nuit est activé pour cet appareil
    heureDebut: { type: String },                            // Heure de début du mode nuit (format "HH:MM")
    heureFin:   { type: String }                             // Heure de fin du mode nuit
  }
}, { timestamps: true });

module.exports = mongoose.model('Appareil', appareilSchema);
