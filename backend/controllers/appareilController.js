const Appareil = require('../models/appareilModel');

exports.getAppareils = async (req, res) => {
  try {
    const appareils = await Appareil.find({ utilisateur: req.userId }).sort({ gpioIndex: 1 });
    res.json(appareils);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des appareils." });
  }
};

exports.updateAppareilEtat = async (req, res) => {
  try {
    const { id } = req.params;
    const { etat } = req.body;

    const appareil = await Appareil.findOneAndUpdate(
      { _id: id, utilisateur: req.userId },
      { etat },
      { new: true }
    );

    if (!appareil) {
      return res.status(404).json({ message: "Appareil introuvable." });
    }

    // ✅ WebSocket : émettre l'événement avec identifiant
    global.io.emit("etat_prise_changee", {
      id: appareil._id,
      gpioIndex: appareil.gpioIndex,
      etat: appareil.etat
    });

    res.json(appareil);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'état de l'appareil." });
  }
};


exports.initPrises = async (req, res) => {
  try {
    const userId = req.userId;

    await Appareil.deleteMany({ utilisateur: userId });

    const prises = [
      { nom: "Prise 1", gpioIndex: 0, utilisateur: userId },
      { nom: "Prise 2", gpioIndex: 1, utilisateur: userId },
      { nom: "Prise 3", gpioIndex: 2, utilisateur: userId },
      { nom: "Prise 4", gpioIndex: 3, utilisateur: userId }
    ];

    await Appareil.insertMany(prises);

    res.status(201).json({ message: "✅ 4 prises créées avec succès." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de la création des prises." });
  }
};

exports.createAppareil = async (req, res) => {
  try {
    const userId = req.userId;

    // 🔒 1. Vérifie combien l’utilisateur a déjà d’appareils
    const total = await Appareil.countDocuments({ utilisateur: userId });
    if (total >= 4) {
      return res.status(403).json({ message: "❌ Limite atteinte : vous ne pouvez avoir que 4 appareils." });
    }

    // 2. Récupère les données envoyées
    const { nom, gpioIndex } = req.body;

    // 3. Création et sauvegarde
    const nouvelAppareil = new Appareil({ nom, gpioIndex, utilisateur: userId });
    await nouvelAppareil.save();

    res.status(201).json({ message: "✅ Appareil ajouté avec succès", appareil: nouvelAppareil });

  } catch (error) {
    console.error("Erreur createAppareil :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
