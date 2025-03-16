// server.js

const express = require('express');
const cors = require("cors");
const connectDB = require('./config/db');

// Import des routeurs
const utilisateurRoutes = require('./routes/utilisateurRoutes');
const appareilRoutes = require('./routes/appareilRoutes');
const consommationRoutes = require('./routes/consommationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Active le parsing des formulaires (si nécessaire)
app.use(cors());
const PORT = process.env.PORT || 5000;

// Connexion à la base de données
connectDB();

// Route de test pour voir si le serveur tourne bien
app.get('/', (req, res) => {
  res.json({ message: "Bienvenue sur l'API PowerTrack 🚀" });
});

// Utilisation des routeurs
app.use('/api/utilisateurs', utilisateurRoutes);
console.log("✅ Routes utilisateur chargées");
app.use('/api/appareils', appareilRoutes);
app.use('/api/consommations', consommationRoutes);
app.use('/api/notifications', notificationRoutes);

// Middleware de gestion des erreurs pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
