const mongoose = require('mongoose');

const consommationSchema = new mongoose.Schema({
  appareil: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appareil',
    default: null,
  },
  value: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Consommation', consommationSchema);