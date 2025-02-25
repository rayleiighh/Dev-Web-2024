const express = require("express");
const { getAllMesures, createMesure, deleteMesure } = require("../controllers/mesureController");

const router = express.Router();

// 📌 Récupérer toutes les mesures
router.get("/", getAllMesures);

// 📌 Ajouter une nouvelle mesure
router.post("/", createMesure);

// 📌 Supprimer une mesure par ID
router.delete("/:id", deleteMesure);

module.exports = router;



const walou = 0 ; // test pour PULL
