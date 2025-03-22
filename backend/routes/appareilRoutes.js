// routes/appareilRoutes.js

const express = require('express');
const router = express.Router();
const appareilController = require('../controllers/appareilController');
const { verifAuth } = require('../middleware/auth');

// Toutes les routes appareils sont protégées (besoin d'un token JWT valide)
router.use(verifAuth);

// Créer un nouvel appareil
router.post('/', appareilController.creerAppareil);

// Récupérer tous les appareils de l'utilisateur connecté
router.get('/', appareilController.getAppareils);

// Récupérer un appareil spécifique de l'utilisateur (par ID)
router.get('/:id', appareilController.getAppareilParId);

// Mettre à jour un appareil (ex: nom, seuilConso, etc.)
router.put('/:id', appareilController.updateAppareil);

// Supprimer un appareil
router.delete('/:id', appareilController.supprimerAppareil);

// Allumer un appareil (mettre etat = true)
router.put('/:id/on', appareilController.allumerAppareil);

// Éteindre un appareil (mettre etat = false)
router.put('/:id/off', appareilController.eteindreAppareil);

// Activer le mode nuit sur un appareil (fournir heureDebut/heureFin dans req.body)
router.put('/:id/mode-nuit/activer', appareilController.activerModeNuit);

// Désactiver le mode nuit sur un appareil
router.put('/:id/mode-nuit/desactiver', appareilController.desactiverModeNuit);

// API pour que l’utilisateur puisse modifier son seuil de consommation
router.put('/:id/seuil', verifAuth, async (req, res) => {
    try {
      const { seuilConso } = req.body;
      const appareil = await Appareil.findById(req.params.id);
  
      if (!appareil) {
        return res.status(404).json({ message: "Appareil non trouvé" });
      }
  
      if (appareil.utilisateur.toString() !== req.userId) {
        return res.status(403).json({ message: "Non autorisé à modifier cet appareil" });
      }
  
      appareil.seuilConso = seuilConso;
      await appareil.save();
  
      res.status(200).json({ message: "Seuil mis à jour", appareil });
    } catch (err) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

// 🔧 Mise à jour du seuil de consommation d’un appareil
router.patch('/:id/seuil', verifAuth, appareilController.mettreAJourSeuil);


module.exports = router;