require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const connectDB = require('./config/db');
const consommationRoutes = require('./routes/consommationRoutes');


// Initialiser Express
const app = express();

// Sécurité des en-têtes HTTP
app.use(helmet());

// Protection contre les attaques DDoS avec rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par fenêtre de 15 minutes
    message: 'Trop de requêtes, réessayez plus tard.',
});
app.use(limiter);

// Logger les requêtes HTTP
app.use(morgan('dev'));

// Gérer CORS (autoriser uniquement le frontend)
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Parser les requêtes JSON
app.use(express.json());

// Connexion à MongoDB
connectDB();

// Routes
app.use('/api/utilisateurs', require('./routes/utilisateurRoutes'));
app.use('/api/appareils', require('./routes/appareilRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/consommations', consommationRoutes);



// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur serveur interne' });
});

// Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
