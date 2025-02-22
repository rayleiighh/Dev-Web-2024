const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Charger les variables d'environnement
dotenv.config();

// Initialiser l'application Express
const app = express();

// Connexion à MongoDB
connectDB();

// Middlewares
app.use(express.json()); // Permet de lire le JSON dans les requêtes
app.use(cors()); // Autorise les requêtes entre le frontend et le backend

// Importer les routes API
const mesuresRoutes = require('./routes/mesures');
app.use('/mesures', mesuresRoutes);

// Route par défaut
app.get('/', (req, res) => {
    res.send('✅ API Backend fonctionnelle !');
});

// Définition du port
const PORT = process.env.PORT || 5000;

// Lancer le serveur
app.listen(PORT, () => console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`));
