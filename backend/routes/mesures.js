const mongoose = require('mongoose');

const MesureSchema = new mongoose.Schema({
    appareil: {
        type: String,
        required: true // Nom de l'appareil obligatoire
    },
    consommation: {
        type: Number,
        required: true // La consommation doit être spécifiée en Watts
    },
    date: {
        type: Date,
        default: Date.now // Par défaut, enregistre la date actuelle
    }
});

module.exports = mongoose.model('Mesure', MesureSchema);
