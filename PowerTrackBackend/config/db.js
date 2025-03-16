const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config(); // Charge les variables d'environnement

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ MongoDB connecté avec succès");
    } catch (error) {
        console.error("❌ Erreur de connexion MongoDB :", error);
        process.exit(1); // Arrête l'application en cas d'échec de connexion
    }
};

module.exports = connectDB;
