const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");

dotenv.config();

const app = express();

// Vérification des variables d'environnement
if (!process.env.MONGO_URI || !process.env.PORT) {
    console.error("❌ Erreur : Les variables d'environnement sont manquantes !");
    process.exit(1); // Stoppe l'exécution si les variables ne sont pas définies
}

// Middleware
app.use(express.json());
app.use(cors());

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connecté avec succès"))
  .catch(err => {
      console.error("❌ Erreur de connexion à MongoDB :", err);
      process.exit(1); // Stoppe le serveur en cas d'échec
  });

// Route de test pour voir si le serveur fonctionne
app.get("/", (req, res) => {
    res.send("🚀 API PowerTrack fonctionne !");
});

// Routes API
app.use("/api/users", userRoutes);

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error("❌ Erreur serveur :", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur backend en ligne sur http://localhost:${PORT}`));
