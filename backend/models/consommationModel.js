const mongoose = require('mongoose');

const consommationSchema = new mongoose.Schema({
  multiprise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Multiprise',
    required: true,
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