const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Mesure = require('../backend/models/Mesure'); // Importer le modèle de données

// Charger les variables d'environnement
dotenv.config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ Connexion à MongoDB réussie"))
.catch(err => console.error("❌ Erreur de connexion MongoDB :", err));

// Données de test
const seedData = [
    { appareil: "Réfrigérateur", consommation: 150 },
    { appareil: "Télévision", consommation: 120 },
    { appareil: "Machine à laver", consommation: 500 },
    { appareil: "Four électrique", consommation: 1800 },
    { appareil: "Ordinateur portable", consommation: 65 }
];

// Insérer les données de test
const seedDatabase = async () => {
    try {
        await Mesure.deleteMany(); // Supprime toutes les mesures existantes
        await Mesure.insertMany(seedData); // Insère les nouvelles mesures
        console.log("✅ Base de données peuplée avec succès !");
        mongoose.connection.close(); // Ferme la connexion après insertion
    } catch (error) {
        console.error("❌ Erreur lors du peuplement de la base de données :", error);
        mongoose.connection.close();
    }
};

// Exécuter le script
seedDatabase();
