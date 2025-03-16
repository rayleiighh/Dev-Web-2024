// config/db.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Chaîne de connexion à MongoDB - en pratique, à configurer via .env
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mon_app', {
      useNewUrlParser: true,
      useUnifiedTopology: true
      // useFindAndModify et useCreateIndex ne sont plus nécessaires sur les dernières versions de Mongoose
    });
    console.log(`MongoDB connecté : ${conn.connection.host}`);
  } catch (err) {
    console.error("Erreur de connexion à MongoDB :", err);
    process.exit(1); // arrêter le processus en cas d'échec critique de connexion
  }
};

module.exports = connectDB;