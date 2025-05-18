const mongoose = require('mongoose');

const appareilSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  multiprise: { // ✅ L'appareil est maintenant rattaché à une multiprise
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Multiprise',
    required: true
  },
  etat: {
    type: Boolean,
    default: false
  },
  seuilConso: {
    type: Number,
    default: 0
  },
  gpioIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  modeNuit: {
    actif: {
      type: Boolean,
      default: false
    },
    heureDebut: {
      type: String,
      default: null
    },
    heureFin: {
      type: String,
      default: null
    }
  },
  favori: { type: Boolean, default: false }

}, {
  timestamps: true
});

module.exports = mongoose.model('Appareil', appareilSchema);
