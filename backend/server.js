const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const http = require('http'); // Ajout du serveur HTTP
const { Server } = require('socket.io'); // Importation de Socket.io
const Mesure = require('./models/Mesure');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app); // Création d'un serveur HTTP
const io = new Server(server, {
    cors: { origin: "*" } // Permettre les requêtes de tous les domaines (sinon, mets ton frontend)
});

app.use(express.json());
app.use(cors());

// Écouter les connexions WebSocket
io.on("connection", (socket) => {
    console.log("✅ Un client est connecté via WebSocket");

    // Lorsqu'une nouvelle mesure est ajoutée, on envoie une mise à jour
    socket.on("demande-mesures", async () => {
        const mesures = await Mesure.find();
        io.emit("maj-mesures", mesures);
    });

    socket.on("disconnect", () => {
        console.log("❌ Un client s'est déconnecté");
    });
});

// Endpoint pour ajouter une mesure (Modifié pour émettre une mise à jour)
app.post("/api/mesures", async (req, res) => {
    try {
        const { appareil, consommation } = req.body;
        const nouvelleMesure = new Mesure({ appareil, consommation });
        await nouvelleMesure.save();

        const mesures = await Mesure.find(); // Récupérer toutes les mesures mises à jour
        io.emit("maj-mesures", mesures); // Envoyer les nouvelles données à tous les clients

        res.status(201).json(nouvelleMesure);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lancer le serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`));
