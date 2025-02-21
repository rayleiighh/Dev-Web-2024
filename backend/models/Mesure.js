const mongoose = require('mongoose');

const MesureSchema = new mongoose.Schema({
    appareil: String,
    consommation: Number,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mesure', MesureSchema);