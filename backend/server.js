require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');

// 📦 Connexion à MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// 🔌 Setup WebSocket (Socket.IO)
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
  }
});

// ⛑️ Middlewares de sécurité
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 🛡️ Limiteur de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite à 100 requêtes par IP
  message: "Trop de requêtes, réessaye plus tard"
});
app.use(limiter);

// 🧠 Injecter l'instance Socket.IO dans l'app
app.set('io', io);

// 📦 Routes API
app.use('/api/utilisateurs', require('./routes/utilisateurRoutes'));
app.use('/api/appareils', require('./routes/appareilRoutes'));
app.use('/api/consommations', require('./routes/consommationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// 🔁 Événements WebSocket
io.on('connection', (socket) => {
  console.log('✅ Nouveau client WebSocket connecté :', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Client déconnecté :', socket.id);
  });
});

// 🚀 Démarrage du serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
