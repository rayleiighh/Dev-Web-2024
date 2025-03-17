require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connecté ✅');
    } catch (error) {
        console.error('Erreur connexion MongoDB ❌', error);
        process.exit(1);
    }
};

module.exports = connectDB;
