const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const { Server } = require("socket.io");
require('dotenv').config();

const connectDB = require('./config/db');

// 🔧 Initialiser Express + HTTP server
const app = express();
app.set('etag', false);
app.set('trust proxy', true);
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté !"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
global.io = io;

io.on("connection", (socket) => {
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
app.use("/api/multiprises", require("./routes/multiprisesRoutes"));
app.use("/api/device-auth", require("./routes/deviceAuthRoutes"));
app.use('/api/utilisateurs', require('./routes/utilisateurRoutes'));
app.use('/api/appareils', require('./routes/appareilRoutes'));
app.use("/api/consommations", require("./routes/consommationRoutes"));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
