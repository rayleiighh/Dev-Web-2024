const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const http = require('http'); // Serveur HTTP pour WebSocket
const { Server } = require('socket.io');
const Mesure = require('./models/Mesure');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.json());
app.use(cors());

let lastSentMesures = []; // Stocke les dernières mesures envoyées

// Connexion WebSocket
io.on("connection", async (socket) => {
    console.log("✅ Un client WebSocket est connecté");

    try {
        // Envoyer les mesures actuelles au nouveau client
        const mesures = await Mesure.find();
        socket.emit("maj-mesures", mesures);
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi initial des mesures :", error);
    }

    socket.on("disconnect", () => {
        console.log("❌ Un client s'est déconnecté");
    });
});

// Route par défaut
app.get('/', (req, res) => {
    res.send('✅ API Backend fonctionnelle !');
});
// GET : Récupérer les mesures au chargement
app.get("/api/mesures", async (req, res) => {
    try {
        const mesures = await Mesure.find();
        res.status(200).json(mesures);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST : Ajouter une mesure et envoyer mise à jour WebSocket sans boucle infinie
app.post("/api/mesures", async (req, res) => {
    try {
        const { appareil, consommation } = req.body;
        const nouvelleMesure = new Mesure({ appareil, consommation });
        await nouvelleMesure.save();

        const mesures = await Mesure.find();

        // Éviter d'envoyer les mêmes données en boucle
        if (JSON.stringify(mesures) !== JSON.stringify(lastSentMesures)) {
            lastSentMesures = mesures; // Stocker les dernières données envoyées
            io.emit("maj-mesures", mesures);
        }

        res.status(201).json(nouvelleMesure);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`));
