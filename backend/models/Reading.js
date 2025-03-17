// models/Reading.js
const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema({
  value: Number,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reading', ReadingSchema);
