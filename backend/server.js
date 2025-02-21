const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connecté'))
  .catch(err => console.error(err));

// Route de test
app.get('/', (req, res) => {
    res.send('API en ligne');
});

app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));