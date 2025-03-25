// scripts/initPrises.js
const mongoose = require("mongoose");
const Appareil = require("../models/appareilModel");
require("dotenv").config();

async function initPrises() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connexion MongoDB OK");

    const userId = "TON_ID_UTILISATEUR"; // <-- remplace par un ObjectId valide

    // 🧼 Supprimer les anciens appareils
    await Appareil.deleteMany({ utilisateur: userId });

    const prises = [
      { nom: "Prise 1", gpioIndex: 0, utilisateur: userId },
      { nom: "Prise 2", gpioIndex: 1, utilisateur: userId },
      { nom: "Prise 3", gpioIndex: 2, utilisateur: userId },
      { nom: "Prise 4", gpioIndex: 3, utilisateur: userId }
    ];

    await Appareil.insertMany(prises);
    console.log("✅ 4 prises ajoutées !");
    process.exit();

  } catch (err) {
    console.error("❌ Erreur :", err);
    process.exit(1);
  }
}

initPrises();
