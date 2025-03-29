const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');

// 🔧 Initialiser Express + HTTP server
const app = express();
const server = http.createServer(app);

// 🔌 Setup WebSocket (Socket.IO)
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
  }
});

// 🌍 Rendre le socket accessible globalement
global.io = io;
console.log("🧪 global.io est défini ?", !!global.io);

const consommationRoutes = require('./routes/consommationRoutes');
// 🔌 WebSocket : écouter les connexions
io.on('connection', (socket) => {
  console.log("🟢 Nouveau client connecté :", socket.id);

  socket.on('disconnect', () => {
    console.log("🔴 Client déconnecté :", socket.id);
  });
});

// 🛡️ Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json());
const multiprisesRoutes = require("./routes/multiprisesRoutes");

app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Trop de requêtes, réessayez plus tard.'
}));

// 🧠 Injecter l'instance Socket.IO dans l'app
app.set('io', io);

// 🔌 WebSocket : écouter les connexions
io.on('connection', (socket) => {
  console.log("🟢 Nouveau client connecté :", socket.id);

  socket.on('disconnect', () => {
    console.log("🔴 Client déconnecté :", socket.id);
  });
});

// 📦 Connexion à MongoDB
connectDB();

// 📦 Routes API
app.use("/api/multiprises", multiprisesRoutes);
app.use('/api/utilisateurs', require('./routes/utilisateurRoutes'));
app.use('/api/appareils', require('./routes/appareilRoutes'));
app.use('/api/consommations', consommationRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ❌ Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur interne' });
});

// 🚀 Démarrage du serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur + WebSocket actif sur http://localhost:${PORT}`);
});

