const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/nomDeTaBase'; // Remplace par ton URI MongoDB

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connexion réussie à MongoDB'))
  .catch(err => console.error('Erreur de connexion à MongoDB', err));
