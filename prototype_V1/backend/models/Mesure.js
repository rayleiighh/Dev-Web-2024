const mongoose = require('mongoose');

const MesureSchema = new mongoose.Schema({
    appareil: {
        type: String,
        required: true // Le nom de l'appareil est obligatoire
    },
    consommation: {
        type: Number,
        required: true // La consommation doit être spécifiée
    },
    date: {
        type: Date,
        default: Date.now // Par défaut, on enregistre la date actuelle
    }
});

module.exports = mongoose.model('Mesure', MesureSchema);
