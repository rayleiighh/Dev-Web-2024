const mongoose = require('mongoose');

const appareilSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
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
    max: 3,
    unique: true // 🔒 Empêche les doublons (1 gpio = 1 appareil)
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Appareil', appareilSchema);
