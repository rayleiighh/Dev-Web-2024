require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.error("MongoDB connection error:", err);
    } catch (err) {
      console.error(" Erreur connexion MongoDB :", err);
      process.exit(1);
    }
  };
  
  module.exports = connectDB;